package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record PostCreateDto(
        @Schema(description = "게시글 제목", example = "오늘 시장 정리")
        String title,

        @Schema(description = "게시글 내용", example = "내용")
        String content,

        @Schema(description = "업로드할 이미지파일")
        List<MultipartFile> files
) {
    public PostCreateDto {
        files = files == null ? List.of() : files;
    }

    public static PostCreateDto of(String title, String content, List<MultipartFile> files) {
        return new PostCreateDto(title, content, files);
    }
}
