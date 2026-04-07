package com.yogimangchi.domain.notification.support;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
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
        Map<String, SseEmitter> emitters = emittersByMemberId.get(memberId);

        if (emitters == null) {
            return;
        }

        emitters.remove(emitterId);

        if (emitters.isEmpty()) {
            emittersByMemberId.remove(memberId);
        }
    }

    public List<SseEmitter> findAllByMemberId(Long memberId) {
        // 체결 / 취소 알림 발생 시 회원의 모든 emitter 조히
        Map<String, SseEmitter> emitters = emittersByMemberId.get(memberId);

        if (emitters == null) {
            return List.of();
        }

        return List.copyOf(emitters.values());
    }
}
