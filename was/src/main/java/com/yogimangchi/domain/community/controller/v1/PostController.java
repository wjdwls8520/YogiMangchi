package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.PostCreateDto;
import com.yogimangchi.domain.community.dto.request.PostSearchDto;
import com.yogimangchi.domain.community.dto.request.PostUpdateDto;
import com.yogimangchi.domain.community.dto.response.PostDetailDto;
import com.yogimangchi.domain.community.service.PostService;
import com.yogimangchi.global.dto.CursorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springdoc.core.annotations.ParameterObject;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community")
@Tag(name = "Community-Post", description = "커뮤니티 게시글 관련 API")
public class PostController {

    private final PostService postService;

    @Operation(
            summary = "모든 게시글 조회",
            description = "모든 게시글을 커서 기반 무한 스크롤로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요. 검색어를 바꾸면 cursorId 는 다시 비워주세요. (로그인이 되어있다면 좋아요한 글의 유무도 같이 보냄)"
    )
    @GetMapping("/posts")
    public ResponseEntity<CursorResponse<PostDetailDto>> getPosts(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute PostSearchDto request
    ) {
        CursorResponse<PostDetailDto> postsList = postService.getPosts(loginMemberId, request);

        return ResponseEntity.ok(postsList);
    }

    @Operation(
            summary = "특정 유저의 모든 게시글 조회",
            description = "특정 유저의 모든 게시글을 커서 기반 무한 스크롤로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요. (특정 유저의 memberId를 같이 보내면 해당 유저가 작성한 글을 모두 조회합니다)"
    )
    @GetMapping("/member/{memberId}/posts")
    public ResponseEntity<CursorResponse<PostDetailDto>> getPostsByAuthor(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable("memberId") Long authorMemberId,
            @Valid @ParameterObject @ModelAttribute PostSearchDto request
    ) {
        CursorResponse<PostDetailDto> postsList = postService.getPostsByAuthor(loginMemberId, authorMemberId, request);

        return ResponseEntity.ok(postsList);
    }



    @Operation(
            summary = "단건 게시글 조회",
            description = "게시글 ID로 단건 게시글을 조회합니다. 첨부 파일 정보를 포함합니다.\n" +
                    "\n" +
                    "비회원도 조회 가능합니다."
    )
    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDetailDto> getPost(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable Long postId
    ) {
        PostDetailDto post = postService.getPost(loginMemberId, postId);

        return ResponseEntity.ok(post);
    }

    @Operation(
            summary = "커뮤니티 글 쓰기",
            description = "제목, 내용, 첨부 이미지 파일을 함께 등록합니다. multipart/form-data 형식으로 요청합니다."
    )
    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDetailDto> createPost(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam String title,
            @RequestParam String content,
            @Parameter(description = "업로드할 이미지 파일 목록") @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        PostCreateDto request = PostCreateDto.of(title, content, files);
        PostDetailDto createdPost = postService.createPost(loginMemberId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @Operation(
            summary = "커뮤니티 글 수정",
            description = "게시글 제목, 내용을 수정하고 첨부 이미지를 추가·삭제합니다. multipart/form-data 형식으로 요청합니다."
    )
    @PutMapping(value = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDetailDto> updatePost(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable Long postId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) List<Long> deleteFileIds,
            @Parameter(description = "새로 업로드할 이미지 파일 목록")
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        PostUpdateDto request = PostUpdateDto.of(title, content, deleteFileIds, files);
        PostDetailDto updatedPost = postService.updatePost(loginMemberId, postId, request);

        return ResponseEntity.ok(updatedPost);
    }

    @Operation(
            summary = "커뮤니티 글 삭제",
            description = "게시글을 소프트 삭제합니다. (deleteYn = 'Y')\n" +
                    "\n" +
                    "삭제 권한: **본인** 또는 **ADMIN**만 가능합니다."
    )
    @DeleteMapping(value = "/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable Long postId
    ) {
        postService.deletePost(loginMemberId, postId);

        return ResponseEntity.noContent().build();  // 204
    }

}
