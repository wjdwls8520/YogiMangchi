package com.yogimangchi.domain.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.yogimangchi.domain.auth.dto.SignupInfoResponse;
import com.yogimangchi.domain.auth.dto.SignupRequest;
import com.yogimangchi.domain.auth.dto.SignupResponse;
import com.yogimangchi.domain.auth.dto.SignupTokenPayload;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.entity.OAuthAccount;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.member.repository.OAuthAccountRepository;
import com.yogimangchi.global.validator.NicknameValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SignupService {

    private final SignupTokenService signupTokenService;
    private final MemberRepository memberRepository;
    private final OAuthAccountRepository oAuthAccountRepository;

    @Transactional(readOnly = true)
    public SignupInfoResponse getSignupInfo(String signupToken) {
        SignupTokenPayload signupTokenPayload = getSignupTokenPayload(signupToken);

        return new SignupInfoResponse(
                signupTokenPayload.provider(),
                signupTokenPayload.email(),
                signupTokenPayload.nickname(),
                signupTokenPayload.profileImgUrl(),
                signupTokenPayload.role(),
                signupTokenPayload.createdAt()
        );
    }

    @Transactional
    public SignupResponse signup(SignupRequest signupRequest) {
        validateSignupRequest(signupRequest);

        SignupTokenPayload signupTokenPayload = getSignupTokenPayload(signupRequest.signupToken());

        if (signupTokenPayload.email() == null || signupTokenPayload.email().isBlank()) {
            throw new IllegalArgumentException("소셜 로그인 이메일 정보가 없습니다.");
        }

        if (oAuthAccountRepository.findByProviderAndProviderUserId(
                signupTokenPayload.provider(),
                signupTokenPayload.providerUserId()
        ).isPresent()) {
            throw new IllegalArgumentException("이미 가입된 소셜 계정입니다.");
        }

        memberRepository.lockNickname(signupRequest.nickname());
        if (memberRepository.existsByNickname(signupRequest.nickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        Member member = Member.createSocialMember(
                signupRequest.nickname(),
                signupTokenPayload.profileImgUrl(), // 가입 시 SNS 이미지 대신 랜덤 기본 이미지 경로가 들어옵니다.
                signupRequest.profileMsg(),
                signupRequest.termAgree(),
                signupRequest.privateAgree()
        );

        Member savedMember = saveMemberOrThrowDuplicateNickname(member);

        OAuthAccount oAuthAccount = OAuthAccount.create(
                savedMember,
                signupTokenPayload.email(),
                signupTokenPayload.provider(),
                signupTokenPayload.providerUserId()
        );

        saveOAuthAccountOrThrowDuplicate(oAuthAccount);
        signupTokenService.removeSignupToken(signupRequest.signupToken());

        return new SignupResponse(savedMember.getId(), savedMember.getNickname());
    }

    private SignupTokenPayload getSignupTokenPayload(String signupToken) {
        try {
            return signupTokenService.getSignupTokenPayload(signupToken);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("signup token 정보 복원 실패", e);
        }
    }

    private void validateSignupRequest(SignupRequest signupRequest) {
        if (signupRequest.signupToken() == null || signupRequest.signupToken().isBlank()) {
            throw new IllegalArgumentException("signupToken 은 필수입니다.");
        }

        NicknameValidator.validate(signupRequest.nickname());

        if (signupRequest.termAgree() == false) {
            throw new IllegalArgumentException("서비스 이용약관 동의가 필요합니다.");
        }

        if (signupRequest.privateAgree() == false) {
            throw new IllegalArgumentException("개인정보 수집 및 이용 동의가 필요합니다.");
        }
    }

    private Member saveMemberOrThrowDuplicateNickname(Member member) {
        try {
            return memberRepository.save(member);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
    }

    private void saveOAuthAccountOrThrowDuplicate(OAuthAccount oAuthAccount) {
        try {
            oAuthAccountRepository.save(oAuthAccount);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("이미 가입된 소셜 계정입니다.");
        }
    }
}
