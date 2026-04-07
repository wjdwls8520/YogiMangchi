package com.yogimangchi.domain.notification.support;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class NotificationEmitterRepository {

    // 회원별 다중 SSE 연결 저장소
    private final Map<Long, Map<String, SseEmitter>> emittersByMemberId = new ConcurrentHashMap<>();

    public void save(Long memberId, String emitterId, SseEmitter emitter) {
        emittersByMemberId
                .computeIfAbsent(memberId, key -> new ConcurrentHashMap<>())
                .put(emitterId, emitter);
    }

    public void remove(Long memberId, String emitterId) {
        // emitter 제거와 비어 있는 회원 맵 정리를 원자적으로 처리하는 로직
        emittersByMemberId.computeIfPresent(memberId, (key, emitters) -> {
            emitters.remove(emitterId);
            return emitters.isEmpty() ? null : emitters;
        });
    }

    public Map<String, SseEmitter> findAllByMemberId(Long memberId) {
        // 회원 알림 발행 시 전체 연결 조회 로직
        Map<String, SseEmitter> emitters = emittersByMemberId.get(memberId);

        if (emitters == null) {
            return Map.of();
        }

        return Map.copyOf(emitters);
    }
}
