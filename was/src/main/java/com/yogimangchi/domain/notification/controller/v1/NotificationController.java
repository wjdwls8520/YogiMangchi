package com.yogimangchi.domain.notification.controller.v1;

import com.yogimangchi.domain.notification.dto.request.NotificationReadRequestDto;
import com.yogimangchi.domain.notification.dto.request.NotificationSearchConditionDto;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.dto.response.NotificationStatusResponseDto;
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.notification.service.NotificationSseService;
import com.yogimangchi.domain.trade.dto.response.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification", description = "알림 API")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;

    @Operation(
            summary = "알림 목록 조회",
            description = "알림을 최신순으로 조회합니다. cursorId로 무한 스크롤을 구현할 수 있고, read 조건으로 읽음 여부를 필터링할 수 있습니다."
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
            summary = "알림 상태 조회",
            description = "새 알림 개수와 읽지 않은 알림 개수, 각 상태의 존재 여부를 조회합니다."
    )
    @GetMapping("/status")
    public ResponseEntity<NotificationStatusResponseDto> getStatus(
            @AuthenticationPrincipal Long memberId
    ) {
        // 헤더 벨 아이콘 상태와 읽음 관리 상태를 함께 조회하는 진입 로직
        return ResponseEntity.ok(notificationService.getStatus(memberId));
    }

    @Operation(
            summary = "알림 확인 처리",
            description = "현재 회원이 가진 최신 알림까지 확인한 것으로 처리합니다."
    )
    @PutMapping("/check")
    public ResponseEntity<Void> checkNotifications(
            @AuthenticationPrincipal Long memberId
    ) {
        // 알림 페이지 진입 시 최신 알림 확인 기준점을 갱신하는 진입 로직
        notificationService.checkNotifications(memberId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "단건 읽음 처리",
            description = "로그인한 회원의 알림 한 건을 읽음 처리합니다."
    )
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal Long memberId,
            @PathVariable @Positive(message = "notificationId는 0보다 커야 합니다.") Long notificationId
    ) {
        notificationService.markAsRead(memberId, notificationId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "다건 읽음 처리",
            description = "로그인한 회원의 알림 여러 건을 읽음 처리합니다."
    )
    @PutMapping("/read")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody NotificationReadRequestDto request
    ) {
        notificationService.markAllAsRead(memberId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "알림 SSE 구독",
            description = "로그인한 회원의 실시간 알림 수신 채널을 연결합니다."
    )
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal Long memberId) {
        // 로그인 회원 알림 구독 채널 연결 진입 로직
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        return notificationSseService.subscribe(memberId);
    }
}
