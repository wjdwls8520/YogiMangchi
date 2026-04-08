package com.yogimangchi.domain.notification.controller.v1;

import com.yogimangchi.domain.notification.dto.request.NotificationSearchConditionDto;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.notification.service.NotificationSseService;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification", description = "알림 API")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;

    @Operation(
            summary = "알림 목록 조회",
            description = "로그인한 회원의 알림 목록을 커서 기반 무한 스크롤로 조회합니다. " +
                    "ex) 해더드롭다운 - GET /api/v1/notifications?scope=ALL&read=false&size=5\n, 오늘탭 - GET /api/v1/notifications?scope=TODAY&size=20\n, 전체탭 - GET /api/v1/notifications?scope=ALL&size=20"
    )
    @GetMapping
    public ResponseEntity<CursorResponseDto<NotificationResponseDto>> getNotifications(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute NotificationSearchConditionDto request
    ) {
        // 로그인 회원 알림 목록 조회 진입 로직
        return ResponseEntity.ok(notificationService.getNotifications(memberId, request));
    }

    @Operation(
            summary = "알림 SSE 구독",
            description = "로그인한 회원의 알림 수신 채널을 연결하고 이후 발생하는 알림 이벤트를 서버에서 실시간으로 전송합니다."
    )
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal Long memberId) {
        // 로그인 회원 검증 로직
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 로그인 회원 알림 구독 채널 연결 진입 로직
        return notificationSseService.subscribe(memberId);
    }
}
