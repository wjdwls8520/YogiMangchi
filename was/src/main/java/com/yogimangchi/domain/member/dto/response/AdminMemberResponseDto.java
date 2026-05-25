package com.yogimangchi.domain.member.dto.response;

import com.yogimangchi.domain.member.enums.MemberRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "어드민 회원 조회 응답 정보")
public record AdminMemberResponseDto(
        @Schema(description = "회원 ID", example = "12")
        Long memberId,

        @Schema(description = "닉네임", example = "홍길동")
        String nickname,

        @Schema(description = "프로필 이미지 URL", example = "profile.png")
        String profileImgUrl,

        @Schema(description = "권한 역할", example = "USER")
        MemberRole role,

        @Schema(description = "탈퇴 여부 (Y / N)", example = "N")
        String deleteYn,

        @Schema(description = "가입일", example = "2026-05-20T12:00:00")
        LocalDateTime createdAt,

        @Schema(description = "연동된 소셜 이메일 (연동 이력이 있으면 탈퇴 회원도 표기됨)", example = "user@gmail.com", nullable = true)
        String oauthEmail,

        @Schema(description = "소셜 로그인 제공사", example = "google", nullable = true)
        String oauthProvider,

        @Schema(description = "소셜 로그인 고유 ID", example = "1029384756", nullable = true)
        String oauthProviderUserId
) {
}
