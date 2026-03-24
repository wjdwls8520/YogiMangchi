package com.yogimangchi.global.file.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Schema(description = "파일")
public record FileDto (
    @Schema(description = "파일 ID", example = "33", requiredMode = Schema.RequiredMode.REQUIRED) @NotNull
    Long id,

    @Schema(description = "원본 파일명", example = "photo.png") @NotBlank
    String originalname,

    @Schema(description = "용량(Byte)", example = "154321")
    Long size,

    @Schema(description = "파일 경로", example = "/uploads/2026/photo.png") @NotBlank
    String path,

    @Schema(description = "콘텐츠 타입", example = "image/png") @NotBlank
    String contentType,

    @Schema(description = "생성일시", example = "2026-03-24T10:20:00", type = "string", format = "date-time")
    LocalDateTime createdAt,

    @Schema(description = "연결된 게시글 ID", example = "12", requiredMode = Schema.RequiredMode.REQUIRED) @NotNull
    Long postId
) {}
