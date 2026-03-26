package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReplyCreateDto(
    @Schema(description = "댓글 내용", example = "잘생긴 정진")
    @NotNull @NotBlank
    String content,

    @Schema(description = "부모댓글 id", example = "null")
    Long parentId,

    @Schema(description = "타겟댓글 id", example = "null")
    Long targetId
) {}
