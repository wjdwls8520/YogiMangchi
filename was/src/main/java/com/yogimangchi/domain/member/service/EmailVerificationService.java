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
import com.yogimangchi.global.mail.EmailSendService;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final String EMAIL_VERIFY_PREFIX = "email:verify:";
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    // 재발송 쿨다운: 1분 이내 재발송 차단
    private static final long RESEND_COOLDOWN_SECONDS = 60;

    private static final String EMAIL_VERIFIED_PREFIX = "email:verified:";
    private static final Duration VERIFIED_FLAG_TTL = Duration.ofHours(1);

    private final StringRedisTemplate stringRedisTemplate;
    private final EmailSendService emailSendService;
    private final MemberReader memberReader;
    private final OAuthAccountRepository oAuthAccountRepository;

    // OAuth 이메일 조회
    public OAuthEmailResponseDto getOAuthEmail(Long memberId) {
        OAuthAccount oAuthAccount = oAuthAccountRepository.findByMember_Id(memberId)
                .orElseThrow(MemberException::oauthAccountNotFound);
        return new OAuthEmailResponseDto(oAuthAccount.getEmail());
    }

    // 인증 코드 발송
    public void sendCode(Long memberId, EmailSendRequestDto request) {
        Member member = memberReader.getAuthenticated(memberId);

        if (member.getRole() == MemberRole.VERIFIED_USER) {
            throw MemberException.alreadyVerified();
        }

        // 입력한 이메일이 소셜 로그인 이메일과 일치하는지 검증
        OAuthAccount oAuthAccount = oAuthAccountRepository.findByMember_Id(memberId)
                .orElseThrow(MemberException::oauthAccountNotFound);

        if (!request.email().equals(oAuthAccount.getEmail())) {
            throw MemberException.emailMismatch();
        }

        // 재발송 쿨다운 체크 (1분 이내 재발송 차단)
        // TTL이 CODE_TTL - RESEND_COOLDOWN_SECONDS(4분) 초과면 1분이 지나지 않은 것
        Long remainingTtl = stringRedisTemplate.getExpire(buildVerifyKey(memberId), TimeUnit.SECONDS);
        if (remainingTtl != null && remainingTtl > CODE_TTL.toSeconds() - RESEND_COOLDOWN_SECONDS) {
            throw MemberException.emailResendTooSoon();
        }

        String code = generateCode();

        // 이메일 발송 성공 후 Redis 저장 (실패 시 Redis에 코드 남지 않도록)
        emailSendService.sendVerificationCode(request.email(), code);
        stringRedisTemplate.opsForValue().set(buildVerifyKey(memberId), code, CODE_TTL);
    }

    // 인증 코드 검증
    public void verify(Long memberId, EmailVerifyRequestDto request) {
        Member member = memberReader.getAuthenticated(memberId);

        if (member.getRole() == MemberRole.VERIFIED_USER) {
            throw MemberException.alreadyVerified();
        }

        // verify 단계에서도 OAuth 이메일 일치 검증
        OAuthAccount oAuthAccount = oAuthAccountRepository.findByMember_Id(memberId)
                .orElseThrow(MemberException::oauthAccountNotFound);

        if (!request.email().equals(oAuthAccount.getEmail())) {
            throw MemberException.emailMismatch();
        }

        String savedCode = stringRedisTemplate.opsForValue().get(buildVerifyKey(memberId));

        if (!Objects.equals(savedCode, request.code())) {
            throw MemberException.invalidVerificationCode();
        }

        // 인증 코드 삭제 (재사용 방지)
        stringRedisTemplate.delete(buildVerifyKey(memberId));

        // 인증 완료 플래그 저장 (1시간 유효)
        stringRedisTemplate.opsForValue().set(
                buildVerifiedKey(memberId),
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

        String verifiedFlag = stringRedisTemplate.opsForValue().get(buildVerifiedKey(memberId));

        if (verifiedFlag == null) {
            throw MemberException.emailNotVerified();
        }

        member.verifyWithInfo(
                request.phoneNumber(),
                request.addressCode(),
                request.address1(),
                request.address2()
        );

        // DB 커밋 성공 후 Redis 삭제 (DB 롤백 시 플래그 보존)
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    stringRedisTemplate.delete(buildVerifiedKey(memberId));
                }
            });
        } else {
            stringRedisTemplate.delete(buildVerifiedKey(memberId));
        }
    }

    // 탈퇴 시 이메일 인증 관련 Redis 키 일괄 정리
    public void deleteEmailVerificationKeys(Long memberId) {
        stringRedisTemplate.delete(buildVerifyKey(memberId));
        stringRedisTemplate.delete(buildVerifiedKey(memberId));
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(900000) + 100000; // 100000~999999
        return String.valueOf(code);
    }

    private String buildVerifyKey(Long memberId) {
        return EMAIL_VERIFY_PREFIX + memberId;
    }

    private String buildVerifiedKey(Long memberId) {
        return EMAIL_VERIFIED_PREFIX + memberId;
    }
}
