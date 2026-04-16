package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.member.dto.request.CompleteVerificationRequestDto;
import com.yogimangchi.domain.member.dto.request.EmailSendRequestDto;
import com.yogimangchi.domain.member.dto.request.EmailVerifyRequestDto;
import com.yogimangchi.domain.member.dto.response.OAuthEmailResponseDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.entity.OAuthAccount;
import com.yogimangchi.domain.member.enums.MemberRole;
import com.yogimangchi.domain.member.repository.OAuthAccountRepository;
import com.yogimangchi.global.exception.member.MemberException;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

import static com.yogimangchi.domain.member.service.EmailVerificationConstants.*;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final StringRedisTemplate stringRedisTemplate;
    private final MemberReader memberReader;
    private final OAuthAccountRepository oAuthAccountRepository;
    private final EmailVerificationAsyncService emailVerificationAsyncService;

    // OAuth 이메일 조회
    public OAuthEmailResponseDto getOAuthEmail(Long memberId) {
        OAuthAccount oAuthAccount = oAuthAccountRepository.findByMember_Id(memberId)
                .orElseThrow(MemberException::oauthAccountNotFound);
        return new OAuthEmailResponseDto(oAuthAccount.getEmail());
    }

    // 인증 코드 발송 요청 (검증 후 비동기 발송 위임)
    public void sendCode(Long memberId, EmailSendRequestDto request) {
        Member member = memberReader.getAuthenticated(memberId);

        if (member.getRole() == MemberRole.VERIFIED_USER) {
            throw MemberException.alreadyVerified();
        }

        OAuthAccount oAuthAccount = oAuthAccountRepository.findByMember_Id(memberId)
                .orElseThrow(MemberException::oauthAccountNotFound);

        if (!request.email().equals(oAuthAccount.getEmail())) {
            throw MemberException.emailMismatch();
        }

        Long remainingTtl = stringRedisTemplate.getExpire(EMAIL_VERIFY_PREFIX + memberId, TimeUnit.SECONDS);
        if (remainingTtl != null && remainingTtl > CODE_TTL.toSeconds() - RESEND_COOLDOWN_SECONDS) {
            throw MemberException.emailResendTooSoon();
        }

        String code = generateCode();
        emailVerificationAsyncService.sendAndNotify(memberId, request.email(), code);
    }

    // 인증 코드 검증
    public void verify(Long memberId, EmailVerifyRequestDto request) {
        Member member = memberReader.getAuthenticated(memberId);

        if (member.getRole() == MemberRole.VERIFIED_USER) {
            throw MemberException.alreadyVerified();
        }

        OAuthAccount oAuthAccount = oAuthAccountRepository.findByMember_Id(memberId)
                .orElseThrow(MemberException::oauthAccountNotFound);

        if (!request.email().equals(oAuthAccount.getEmail())) {
            throw MemberException.emailMismatch();
        }

        String savedCode = stringRedisTemplate.opsForValue().get(EMAIL_VERIFY_PREFIX + memberId);

        if (savedCode == null || !MessageDigest.isEqual(savedCode.getBytes(), request.code().getBytes())) {
            throw MemberException.invalidVerificationCode();
        }

        stringRedisTemplate.delete(EMAIL_VERIFY_PREFIX + memberId);

        stringRedisTemplate.opsForValue().set(
                EMAIL_VERIFIED_PREFIX + memberId,
                request.email(),
                VERIFIED_FLAG_TTL
        );
    }

    // 인증회원 전환
    @Transactional
    public void completeVerification(Long memberId, CompleteVerificationRequestDto request) {
        Member member = memberReader.getAuthenticated(memberId);

        if (member.getRole() == MemberRole.VERIFIED_USER) {
            throw MemberException.alreadyVerified();
        }

        String verifiedFlag = stringRedisTemplate.opsForValue().get(EMAIL_VERIFIED_PREFIX + memberId);

        if (verifiedFlag == null) {
            throw MemberException.emailNotVerified();
        }

        member.verifyWithInfo(
                request.phoneNumber(),
                request.addressCode(),
                request.address1(),
                request.address2()
        );

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    stringRedisTemplate.delete(EMAIL_VERIFIED_PREFIX + memberId);
                }
            });
        } else {
            stringRedisTemplate.delete(EMAIL_VERIFIED_PREFIX + memberId);
        }
    }

    // 탈퇴 시 이메일 인증 관련 Redis 키 일괄 정리
    public void deleteEmailVerificationKeys(Long memberId) {
        stringRedisTemplate.delete(EMAIL_VERIFY_PREFIX + memberId);
        stringRedisTemplate.delete(EMAIL_VERIFIED_PREFIX + memberId);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(900000) + 100000;
        return String.valueOf(code);
    }
}
