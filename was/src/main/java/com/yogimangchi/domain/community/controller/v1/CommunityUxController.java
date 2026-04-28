package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.service.CommunityUxSseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community/ux")
@Tag(name = "Community-UX", description = "커뮤니티 실시간 UX 이벤트 API")
public class CommunityUxController {

    private final CommunityUxSseService communityUxSseService;

    @Operation(
            summary = "커뮤니티 피드 UX SSE 구독",
            description = "커뮤니티 목록 피드 화면에서 새 게시글 생성 신호를 실시간으로 받기 위한 SSE 연결을 생성합니다. 로그인 없이도 구독 가능합니다."
    )
    @GetMapping(value = "/subscribe/feed", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeFeed() {
        return communityUxSseService.subscribeFeed();
    }
}
