package com.yogimangchi.domain.community.support;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class CommunityUxEmitterRegistry {

    // topic별 다중 SSE 연결 저장소
    // 예: community-feed -> { emitterId1, emitterId2, ... }
    private final Map<String, Map<String, SseEmitter>> emittersByTopic = new ConcurrentHashMap<>();

    // 특정 topic 구독 연결을 저장한다.
    public void save(String topic, String emitterId, SseEmitter emitter) {
        // 같은 topic을 구독하는 브라우저 연결들을 한 맵으로 묶어서 관리한다.
        emittersByTopic
                .computeIfAbsent(topic, key -> new ConcurrentHashMap<>())
                .put(emitterId, emitter);
    }

    // 특정 topic 구독 연결을 제거하고, 마지막 연결이면 빈 topic도 함께 정리한다.
    public boolean remove(String topic, String emitterId) {
        final boolean[] removed = {false};

        // emitter 제거와 비어 있는 topic 맵 정리를 원자적으로 처리한다.
        emittersByTopic.computeIfPresent(topic, (key, emitters) -> {
            removed[0] = emitters.remove(emitterId) != null;
            return emitters.isEmpty() ? null : emitters;
        });

        return removed[0];
    }

    // 특정 topic에 현재 연결된 전체 emitter를 조회한다.
    public Map<String, SseEmitter> findAllByTopic(String topic) {
        // topic broadcast 시 현재 열려 있는 전체 연결을 조회한다.
        Map<String, SseEmitter> emitters = emittersByTopic.get(topic);

        if (emitters == null) {
            return Map.of();
        }

        return Map.copyOf(emitters);
    }

    // 전체 topic과 연결 상태를 조회한다.
    public Map<String, Map<String, SseEmitter>> findAll() {
        // 스케줄러나 종료 처리에서 안전하게 순회할 수 있도록 현재 상태를 복사해서 반환한다.
        Map<String, Map<String, SseEmitter>> copiedEmitters = new HashMap<>();
        emittersByTopic.forEach((topic, emitters) ->
                copiedEmitters.put(topic, Map.copyOf(emitters))
        );
        return Map.copyOf(copiedEmitters);
    }

    // 특정 topic의 현재 연결 수를 반환한다.
    public int countByTopic(String topic) {
        Map<String, SseEmitter> emitters = emittersByTopic.get(topic);
        return emitters == null ? 0 : emitters.size();
    }

    // 현재 열려 있는 UX SSE 전체 연결 수를 반환한다.
    public int countAllEmitters() {
        // UX SSE 전체 연결 수를 빠르게 확인할 수 있게 topic별 연결 수를 합산한다.
        return emittersByTopic.values().stream()
                .mapToInt(Map::size)
                .sum();
    }

    // 서버 종료 등 전체 정리가 필요할 때 저장소를 비운다.
    public void clear() {
        emittersByTopic.clear();
    }
}
