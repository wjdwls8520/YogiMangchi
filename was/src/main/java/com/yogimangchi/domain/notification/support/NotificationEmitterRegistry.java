package com.yogimangchi.domain.notification.support;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class NotificationEmitterRegistry {

    // 회원별 다중 SSE 연결 저장소
    private final Map<Long, Map<String, SseEmitter>> emittersByMemberId = new ConcurrentHashMap<>();

    public void save(Long memberId, String emitterId, SseEmitter emitter) {
        emittersByMemberId
                .computeIfAbsent(memberId, key -> new ConcurrentHashMap<>())
                .put(emitterId, emitter);
    }

    public boolean remove(Long memberId, String emitterId) {
        final boolean[] removed = {false};

        // emitter 제거와 비어 있는 회원 맵 정리를 원자적으로 처리하는 로직
        emittersByMemberId.computeIfPresent(memberId, (key, emitters) -> {
            removed[0] = emitters.remove(emitterId) != null;
            return emitters.isEmpty() ? null : emitters;
        });

        return removed[0];
    }

    public Map<String, SseEmitter> findAllByMemberId(Long memberId) {
        // 회원 알림 발행 시 전체 연결 조회 로직
        Map<String, SseEmitter> emitters = emittersByMemberId.get(memberId);

        if (emitters == null) {
            return Map.of();
        }

        return Map.copyOf(emitters);
    }

    public Map<Long, Map<String, SseEmitter>> findAll() {
        Map<Long, Map<String, SseEmitter>> copiedEmitters = new HashMap<>();
        emittersByMemberId.forEach((memberId, emitters) ->
                copiedEmitters.put(memberId, Map.copyOf(emitters))
        );
        return Map.copyOf(copiedEmitters);
    }

    public int countByMemberId(Long memberId) {
        Map<String, SseEmitter> emitters = emittersByMemberId.get(memberId);
        return emitters == null ? 0 : emitters.size();
    }

    public int countAllEmitters() {
        return emittersByMemberId.values().stream()
                .mapToInt(Map::size)
                .sum();
    }

    public void clear() {
        emittersByMemberId.clear();
    }
}
