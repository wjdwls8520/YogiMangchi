package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.PostCreateRequest;
import com.yogimangchi.domain.community.dto.response.PostDetailDto;
import com.yogimangchi.domain.community.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community/posts")
@Tag(name = "Community-Post", description = "커뮤니티 게시글 관련 API")
public class PostController {

    private final PostService postService;

    @Operation(
            summary = "모든 게시글 조회",
            description = "모든 게시글을 조회합니다. 무한 스크롤로 페이징 합니다. \n\n\n \n\n\n *** 루트폴더 커뮤니티더미데이터.md에 더미데이터 있음 db에 쿼리문 복붙해서 사용 ***"
    )
    @GetMapping
    public ResponseEntity<Page<PostDetailDto>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String keyword
    ) {

        Page<PostDetailDto> postsList = postService.getPosts(page, size, keyword);

        return ResponseEntity.ok(postsList);
    }

    @Operation(
            summary = "커뮤니티 글 쓰기",
            description = "제목, 내용, 첨부 이미지 파일을 함께 등록합니다. multipart/form-data 형식으로 요청합니다.\n" +
                    "\n" +
                    "요청 필드:\n" +
                    "- title: 게시글 제목\n" +
                    "- content: 게시글 내용\n" +
                    "- files: 첨부 이미지 파일 목록 (선택)\n" +
                    "\n" +
                    "Next.js fetch 예시:\n" +
                    "```javascript\n" +
                    "const formData = new FormData();\n" +
                    "formData.append('title', '오늘 시장 정리');\n" +
                    "formData.append('content', '비트코인이 반등했어요.');\n" +
                    "files.forEach((file) => formData.append('files', file));\n" +
                    "\n" +
                    "await fetch('/api/v1/community/posts', {\n" +
                    "  method: 'POST',\n" +
                    "  body: formData,\n" +
                    "  credentials: 'include',\n" +
                    "});\n" +
                    "```"
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDetailDto> createPost(
            @AuthenticationPrincipal Long memberId,
            @ModelAttribute @Valid PostCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        PostDetailDto createdPost = postService.createPost(memberId, request, files);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

}
