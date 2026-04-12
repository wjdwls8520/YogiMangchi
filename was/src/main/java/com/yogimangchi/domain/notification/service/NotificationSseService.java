package com.yogimangchi.domain.notification.service;

import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.support.NotificationEmitterRepository;
import com.yogimangchi.global.exception.notification.NotificationException;
import com.yogimangchi.global.support.MemberReader;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationSseService {

    private static final long DEFAULT_TIMEOUT = 60L * 60L * 1000L;

    private final NotificationEmitterRepository notificationEmitterRepository;
    private final MemberReader memberReader;

    public SseEmitter subscribe(Long memberId) {
        // 구독 시작 전에 로그인 회원 정보를 공통 로직으로 검증한다.
        memberReader.getAuthenticated(memberId);

        // 회원별 다중 접속 환경을 구분하기 위한 emitter 식별자다.
        String emitterId = memberId + "_" + UUID.randomUUID();

        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        notificationEmitterRepository.save(memberId, emitterId, emitter);
        log.info("알림 SSE 구독 시작. memberId={}, emitterId={}", memberId, emitterId);

        // 브라우저 연결 종료 시점마다 저장소의 emitter를 정리한다.
        emitter.onCompletion(() -> {
            log.info("알림 SSE 구독 완료. memberId={}, emitterId={}", memberId, emitterId);
            notificationEmitterRepository.remove(memberId, emitterId);
        });
        emitter.onTimeout(() -> {
            log.info("알림 SSE 구독 시간 초과. memberId={}, emitterId={}", memberId, emitterId);
            notificationEmitterRepository.remove(memberId, emitterId);
        });
        emitter.onError(exception -> {
            log.warn("알림 SSE 연결 오류. memberId={}, emitterId={}", memberId, emitterId, exception);
            notificationEmitterRepository.remove(memberId, emitterId);
        });

        try {
            // 최초 연결 직후 CONNECTED 이벤트를 보내 구독 성공 여부를 확인한다.
            emitter.send(
                    SseEmitter.event()
                            .id(emitterId)
                            .name("CONNECTED")
                            .data("알림 구독이 연결되었습니다.")
            );
        } catch (IOException exception) {
            notificationEmitterRepository.remove(memberId, emitterId);
            throw NotificationException.notificationSubscribeFailed(exception);
        }

        return emitter;
    }

    public void sendNotification(Long memberId, NotificationResponseDto notification) {
        // 잘못된 전송 요청은 로그만 남기고 무시한다.
        if (memberId == null || notification == null) {
            log.warn("알림 SSE 전송을 생략했습니다. memberId={}, notification={}", memberId, notification);
            return;
        }

        Map<String, SseEmitter> emitters = notificationEmitterRepository.findAllByMemberId(memberId);

        for (Map.Entry<String, SseEmitter> entry : emitters.entrySet()) {
            try {
                entry.getValue().send(
                        SseEmitter.event()
                                .id(String.valueOf(notification.notificationId()))
                                .name("NOTIFICATION_CREATED")
                                .data(notification)
                );
            } catch (IOException | IllegalStateException exception) {
                // 죽은 emitter 하나가 다른 연결 전송까지 막지 않도록 즉시 제거한다.
                log.warn("알림 SSE 전송 중 연결 제거. memberId={}, emitterId={}", memberId, entry.getKey(), exception);
                notificationEmitterRepository.remove(memberId, entry.getKey());
            }
        }
    }

    @PreDestroy
    public void closeAllEmitters() {
        Map<Long, Map<String, SseEmitter>> emittersByMemberId = notificationEmitterRepository.findAll();
        int emitterCount = emittersByMemberId.values().stream()
                .mapToInt(Map::size)
                .sum();

        log.info("서버 종료로 알림 SSE 연결 정리를 시작합니다. emitterCount={}", emitterCount);

        emittersByMemberId.forEach((memberId, emitters) ->
                emitters.forEach((emitterId, emitter) -> {
                    try {
                        emitter.complete();
                    } catch (IllegalStateException exception) {
                        log.debug("이미 종료된 알림 SSE 연결입니다. memberId={}, emitterId={}", memberId, emitterId);
                    }
                })
        );

        notificationEmitterRepository.clear();
        log.info("서버 종료로 알림 SSE 연결 정리를 완료했습니다. emitterCount={}", emitterCount);
    }
}
