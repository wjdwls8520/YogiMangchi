package com.yogimangchi.domain.member.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "어드민 멤버 조회 필터 조건")
public record AdminMemberSearchDto(
        @Schema(description = "회원 상태 필터 (ALL: 전체, ACTIVE: 활성 회원만, WITHDRAWN: 탈퇴 회원만)", example = "ALL", defaultValue = "ALL")
        String status,

        @Schema(description = "권한 역할 필터 (ALL: 전체, USER: 일반 회원, VERIFIED_USER: 인증 회원, ADMIN: 어드민)", example = "ALL", defaultValue = "ALL")
        String role,

        @Schema(description = "특정 회원 ID 검색", example = "12", nullable = true)
        Long memberId,

        @Schema(description = "닉네임 검색어", example = "홍길동", nullable = true)
        String nickname,

        @Schema(description = "첫 요청 시 null, 이후에는 이전 응답의 nextCursorId 입력", example = "10", nullable = true)
        Long cursorId,

        @Schema(description = "한 페이지 크기 (기본 10, 최대 50)", example = "10", defaultValue = "10")
        Integer size
) {
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : Math.min(size, 50);
    }
}
