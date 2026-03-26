package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.PostCreateDto;
import com.yogimangchi.domain.community.dto.request.PostUpdateDto;
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
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;

import java.beans.PropertyEditorSupport;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community/posts")
@Tag(name = "Community-Post", description = "커뮤니티 게시글 관련 API")
public class PostController {

    private final PostService postService;

    /**
     * Swagger에서 파일을 선택하지 않으면 빈 문자열("")이 전송되는데,
     * Spring이 빈 문자열을 MultipartFile로 변환하지 못해 400 에러가 발생합니다.
     * 빈 문자열을 null로 치환하여 파일 미첨부 요청도 정상 처리되도록 합니다.
     */
    @InitBinder
    public void initBinder(WebDataBinder binder) {
        binder.registerCustomEditor(java.util.List.class, "files", new PropertyEditorSupport() {
            @Override
            public void setAsText(String text) {
                setValue(null);
            }
        });
    }

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
            summary = "단건 게시글 조회",
            description = "게시글 ID로 단건 게시글을 조회합니다. 첨부 파일 정보를 포함합니다.\n" +
                    "\n" +
                    "비회원도 조회 가능합니다."
    )
    @GetMapping("/{postId}")
    public ResponseEntity<PostDetailDto> getPost(
            @PathVariable Long postId
    ) {
        PostDetailDto post = postService.getPost(postId);

        return ResponseEntity.ok(post);
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
            @ModelAttribute @Valid PostCreateDto request
    ) {
        PostDetailDto createdPost = postService.createPost(memberId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @Operation(
            summary = "커뮤니티 글 수정",
            description = "게시글 제목, 내용을 수정하고 첨부 이미지를 추가·삭제합니다. multipart/form-data 형식으로 요청합니다.\n" +
                    "\n" +
                    "수정 권한: **본인** 또는 **ADMIN**만 가능합니다.\n" +
                    "\n" +
                    "요청 필드:\n" +
                    "- title: 수정할 제목\n" +
                    "- content: 수정할 내용\n" +
                    "- deleteFileIds: 삭제할 기존 파일 ID 목록 (선택)\n" +
                    "- files: 새로 첨부할 이미지 파일 목록 (선택)\n" +
                    "\n" +
                    "Next.js fetch 예시:\n" +
                    "```javascript\n" +
                    "const formData = new FormData();\n" +
                    "formData.append('title', '수정된 제목');\n" +
                    "formData.append('content', '수정된 내용입니다.');\n" +
                    "deleteIds.forEach((id) => formData.append('deleteFileIds', id));\n" +
                    "newFiles.forEach((file) => formData.append('files', file));\n" +
                    "\n" +
                    "await fetch(`/api/v1/community/posts/${postId}`, {\n" +
                    "  method: 'PUT',\n" +
                    "  body: formData,\n" +
                    "  credentials: 'include',\n" +
                    "});\n" +
                    "```"
    )
    @PutMapping(value = "/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDetailDto> updatePost(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId,
            @ModelAttribute @Valid PostUpdateDto request
    ) {
        PostDetailDto updatedPost = postService.updatePost(memberId, postId, request);

        return ResponseEntity.ok(updatedPost);
    }

    @Operation(
            summary = "커뮤니티 글 삭제",
            description = "게시글을 소프트 삭제합니다. (deleteYn = 'Y')\n" +
                    "\n" +
                    "삭제 권한: **본인** 또는 **ADMIN**만 가능합니다."
    )
    @DeleteMapping(value = "/{postId}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId
    ) {
        postService.deletePost(memberId, postId);

        return ResponseEntity.noContent().build();  // 204
    }

}
