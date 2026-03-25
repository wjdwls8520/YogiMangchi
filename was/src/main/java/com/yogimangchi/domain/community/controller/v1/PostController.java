package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.response.PostListDto;
import com.yogimangchi.domain.community.service.PostService;
import com.yogimangchi.domain.community.service.ReplyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community/posts")
@Tag(name = "Community-Post", description = "커뮤니티 게시글 관련 API")
public class PostController {

    private final PostService postService;
    private final ReplyService replyService;

    @Operation(
            summary = "모든 게시글 조회",
            description = "모든 게시글을 조회합니다. 무한 스크롤로 페이징 합니다. \n\n\n \n\n\n *** 루트폴더 커뮤니티더미데이터.md에 더미데이터 있음 db에 쿼리문 복붙해서 사용 ***"
    )
    @GetMapping
    public ResponseEntity<Page<PostListDto>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String keyword
    ) {

        Page<PostListDto> postsList = postService.getPosts(page, size, keyword);

        return ResponseEntity.ok(postsList);
    }

}
