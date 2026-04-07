package com.yogimangchi.domain.notification.service;

import com.yogimangchi.domain.notification.support.NotificationEmitterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationSseService {

    private static final long DEFAULT_TIMEOUT = 60L * 60L * 1000L;

    private final NotificationEmitterRepository notificationEmitterRepository;

    public SseEmitter subscribe(Long memberId) {
        // 회원별 다중 접속 환경 대응 emitter 식별자 생성 로직
        String emitterId = memberId + "_" + UUID.randomUUID();

        // 알림 구독용 SSE 연결 생성 로직
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);

        notificationEmitterRepository.save(memberId, emitterId, emitter);

        // 브라우저 연결 종료/타임아웃/에러 시 emitter 정리 로직
        emitter.onCompletion(() -> notificationEmitterRepository.remove(memberId, emitterId));
        emitter.onTimeout(() -> notificationEmitterRepository.remove(memberId, emitterId));
        emitter.onError(exception -> notificationEmitterRepository.remove(memberId, emitterId));

        try {
            // 구독 직후 연결 확인용 초기 이벤트 전송 로직
            emitter.send(
                    SseEmitter.event()
                            .id(emitterId)
                            .name("CONNECTED")
                            .data("알림 구독이 연결되었습니다.")
            );
        } catch (IOException exception) {
            // 초기 전송 실패 시 죽은 emitter 제거 로직
            notificationEmitterRepository.remove(memberId, emitterId);
            throw new IllegalStateException("알림 구독 연결에 실패했습니다.", exception);
        }

        return emitter;
    }

}
