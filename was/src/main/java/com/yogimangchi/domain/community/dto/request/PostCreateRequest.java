package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostCreateRequest {
    @Schema(description = "게시글 제목", example = "오늘 시장 정리")
    @NotNull
    @NotBlank
    private String title;

    @Schema(description = "게시글 내용", example = "내용")
    @NotNull
    @NotBlank
    private String content;
}
