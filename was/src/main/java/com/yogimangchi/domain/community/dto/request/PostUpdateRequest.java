package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PostUpdateRequest {
    @Schema(description = "게시글 제목", example = "수정된 제목")
    @NotBlank
    private String title;

    @Schema(description = "게시글 내용", example = "수정된 내용")
    @NotBlank
    private String content;

    @Schema(description = "삭제할 기존 파일 ID 목록", example = "[1, 2]")
    private List<Long> deleteFileIds = new ArrayList<>();

    @Schema(description = "새로 업로드할 이미지파일")
    private List<MultipartFile> files = new ArrayList<>();
}
