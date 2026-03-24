package com.yogimangchi.domain.member.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record NicknameDuplicationDto(
        @Schema(description = "닉네임 사용 가능 여부", example = "true")
        boolean available
) {
}
