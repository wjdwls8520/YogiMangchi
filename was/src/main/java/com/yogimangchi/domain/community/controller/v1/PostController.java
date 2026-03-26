package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.PostCreateDto;
import com.yogimangchi.domain.community.dto.request.PostUpdateDto;
import com.yogimangchi.domain.community.dto.response.PostDetailDto;
import com.yogimangchi.domain.community.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
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
            @AuthenticationPrincipal Long memberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String keyword
    ) {

        Page<PostDetailDto> postsList = postService.getPosts(memberId, page, size, keyword);

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
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId
    ) {
        PostDetailDto post = postService.getPost(memberId, postId);

        return ResponseEntity.ok(post);
    }

    @Operation(
            summary = "커뮤니티 글 쓰기",
            description = "제목, 내용, 첨부 이미지 파일을 함께 등록합니다. multipart/form-data 형식으로 요청합니다."
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDetailDto> createPost(
            @AuthenticationPrincipal Long memberId,
            @RequestParam String title,
            @RequestParam String content,
            @Parameter(description = "업로드할 이미지 파일 목록")
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        PostCreateDto request = PostCreateDto.of(title, content, files);
        PostDetailDto createdPost = postService.createPost(memberId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @Operation(
            summary = "커뮤니티 글 수정",
            description = "게시글 제목, 내용을 수정하고 첨부 이미지를 추가·삭제합니다. multipart/form-data 형식으로 요청합니다."
    )
    @PutMapping(value = "/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDetailDto> updatePost(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) List<Long> deleteFileIds,
            @Parameter(description = "새로 업로드할 이미지 파일 목록")
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        PostUpdateDto request = PostUpdateDto.of(title, content, deleteFileIds, files);
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
