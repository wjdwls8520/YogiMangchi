package com.yogimangchi.domain.auth.service;

import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.global.auth.jwt.dto.AuthTokens;
import com.yogimangchi.global.auth.jwt.service.JwtService;
import com.yogimangchi.global.auth.jwt.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final MemberRepository memberRepository;

    public AuthTokens issueTokens(Long memberId) {
        Member member = memberRepository.findActiveById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않거나 탈퇴한 회원입니다."));

        String accessToken = jwtService.createAccessToken(member.getId(), member.getRole());
        String refreshToken = jwtService.createRefreshToken(memberId);

        refreshTokenService.saveRefreshToken(memberId, refreshToken);

        return new AuthTokens(accessToken, refreshToken);
    }

    public AuthTokens refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("refresh token 이 없습니다.");
        }

        if (jwtService.validateToken(refreshToken) == false) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 refresh token 입니다.");
        }

        Long memberId = jwtService.extractMemberId(refreshToken);

        if (refreshTokenService.matches(memberId, refreshToken) == false) {
            throw new IllegalArgumentException("저장된 refresh token 과 일치하지 않습니다.");
        }

        return issueTokens(memberId);
    }

    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        if (jwtService.validateToken(refreshToken) == false) {
            return;
        }

        Long memberId = jwtService.extractMemberId(refreshToken);
        refreshTokenService.removeRefreshToken(memberId);
    }
}
