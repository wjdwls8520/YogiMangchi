package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record PostUpdateDto(
        @Schema(description = "게시글 제목", example = "수정된 제목")
        String title,

        @Schema(description = "게시글 내용", example = "수정된 내용")
        String content,

        @Schema(description = "삭제할 기존 파일 ID 목록", example = "[1, 2]")
        List<Long> deleteFileIds,

        @Schema(description = "새로 업로드할 이미지파일")
        List<MultipartFile> files
) {
    public PostUpdateDto {
        deleteFileIds = deleteFileIds == null ? List.of() : deleteFileIds;
        files = files == null ? List.of() : files;
    }

    public static PostUpdateDto of(String title, String content, List<Long> deleteFileIds, List<MultipartFile> files) {
        return new PostUpdateDto(title, content, deleteFileIds, files);
    }
}
