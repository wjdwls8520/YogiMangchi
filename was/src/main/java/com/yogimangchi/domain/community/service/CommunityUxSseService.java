package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.event.PostCreatedUxEventDto;
import com.yogimangchi.domain.community.support.CommunityUxEmitterRegistry;
import com.yogimangchi.global.sse.enums.CommunityUxSseEventType;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityUxSseService {

    private static final String COMMUNITY_FEED_TOPIC = "community-feed";
    private static final long DEFAULT_TIMEOUT = 60L * 60L * 1000L;
    private static final long HEARTBEAT_INTERVAL = 30_000L;

    private final CommunityUxEmitterRegistry communityUxEmitterRegistry;

    // 커뮤니티 피드 화면을 보고 있는 클라이언트가 새 글 UX 이벤트를 받을 수 있도록 SSE 연결을 생성한다.
    public SseEmitter subscribeFeed() {
        String emitterId = UUID.randomUUID().toString();
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);

        communityUxEmitterRegistry.save(COMMUNITY_FEED_TOPIC, emitterId, emitter);
        log.info("커뮤니티 UX SSE 구독 시작. topic={}, emitterId={}, topicEmitterCount={}, totalEmitterCount={}",
                COMMUNITY_FEED_TOPIC,
                emitterId,
                communityUxEmitterRegistry.countByTopic(COMMUNITY_FEED_TOPIC),
                communityUxEmitterRegistry.countAllEmitters());

        // 브라우저 연결 종료 시점마다 topic 저장소의 emitter를 정리한다.
        emitter.onCompletion(() -> {
            if (communityUxEmitterRegistry.remove(COMMUNITY_FEED_TOPIC, emitterId)) {
                logEmitterState("커뮤니티 UX SSE 구독 완료", emitterId);
            }
        });
        emitter.onTimeout(() -> {
            if (communityUxEmitterRegistry.remove(COMMUNITY_FEED_TOPIC, emitterId)) {
                logEmitterState("커뮤니티 UX SSE 구독 시간 초과", emitterId);
            }
        });
        emitter.onError(exception -> {
            if (communityUxEmitterRegistry.remove(COMMUNITY_FEED_TOPIC, emitterId)) {
                log.info("커뮤니티 UX SSE 연결 종료. topic={}, emitterId={}, topicEmitterCount={}, totalEmitterCount={}, cause={}",
                        COMMUNITY_FEED_TOPIC,
                        emitterId,
                        communityUxEmitterRegistry.countByTopic(COMMUNITY_FEED_TOPIC),
                        communityUxEmitterRegistry.countAllEmitters(),
                        exception.getClass().getSimpleName());
            }
        });

        try {
            sendConnected(emitter);
        } catch (IOException exception) {
            communityUxEmitterRegistry.remove(COMMUNITY_FEED_TOPIC, emitterId);
            throw new IllegalStateException("커뮤니티 UX SSE 구독 연결에 실패했습니다.", exception);
        }

        return emitter;
    }

    // 새 게시글이 생성되면 community-feed 구독자 전체에게 공개 피드용 UX 이벤트를 broadcast 한다.
    public void sendPostCreated(PostCreatedUxEventDto event) {
        if (event == null) {
            log.warn("커뮤니티 UX 새 글 이벤트 전송을 생략했습니다. event=null");
            return;
        }

        Map<String, SseEmitter> emitters = communityUxEmitterRegistry.findAllByTopic(COMMUNITY_FEED_TOPIC);

        for (Map.Entry<String, SseEmitter> entry : emitters.entrySet()) {
            try {
                sendEvent(
                        entry.getValue(),
                        CommunityUxSseEventType.UX_COMMUNITY_POST_CREATED.name(),
                        event
                );
            } catch (IOException | IllegalStateException exception) {
                // 죽은 emitter 하나가 다른 피드 구독자 전송까지 막지 않도록 즉시 제거한다.
                if (communityUxEmitterRegistry.remove(COMMUNITY_FEED_TOPIC, entry.getKey())) {
                    log.info("커뮤니티 UX SSE 전송 중 연결 제거. topic={}, emitterId={}, topicEmitterCount={}, totalEmitterCount={}, cause={}",
                            COMMUNITY_FEED_TOPIC,
                            entry.getKey(),
                            communityUxEmitterRegistry.countByTopic(COMMUNITY_FEED_TOPIC),
                            communityUxEmitterRegistry.countAllEmitters(),
                            exception.getClass().getSimpleName());
                }
            }
        }
    }

    // 닫힌 브라우저, 페이지 이탈 등 구독 해지를 감지하기 위한 30초 핑
    @Scheduled(fixedDelay = HEARTBEAT_INTERVAL)
    public void sendHeartbeat() {
        Map<String, Map<String, SseEmitter>> emittersByTopic = communityUxEmitterRegistry.findAll();

        if (emittersByTopic.isEmpty()) {
            return;
        }

        emittersByTopic.forEach((topic, emitters) ->
                emitters.forEach((emitterId, emitter) -> {
                    try {
                        emitter.send(SseEmitter.event().comment("heartbeat"));
                    } catch (IOException | IllegalStateException exception) {
                        if (communityUxEmitterRegistry.remove(topic, emitterId)) {
                            log.info("커뮤니티 UX SSE heartbeat 연결 제거. topic={}, emitterId={}, topicEmitterCount={}, totalEmitterCount={}, cause={}",
                                    topic,
                                    emitterId,
                                    communityUxEmitterRegistry.countByTopic(topic),
                                    communityUxEmitterRegistry.countAllEmitters(),
                                    exception.getClass().getSimpleName());
                        }
                    }
                })
        );
    }

    private void sendConnected(SseEmitter emitter) throws IOException {
        emitter.send(
                SseEmitter.event()
                        .name(CommunityUxSseEventType.CONNECTED.name())
                        .data("커뮤니티 피드 실시간 연결이 완료되었습니다.")
        );
    }

    private void sendEvent(SseEmitter emitter, String eventName, Object data) throws IOException {
        emitter.send(
                SseEmitter.event()
                        .name(eventName)
                        .data(data)
        );
    }

    private void logEmitterState(String message, String emitterId) {
        log.info("{}. topic={}, emitterId={}, topicEmitterCount={}, totalEmitterCount={}",
                message,
                COMMUNITY_FEED_TOPIC,
                emitterId,
                communityUxEmitterRegistry.countByTopic(COMMUNITY_FEED_TOPIC),
                communityUxEmitterRegistry.countAllEmitters());
    }

    @EventListener(ContextClosedEvent.class)
    public void closeAllEmitters() {
        Map<String, Map<String, SseEmitter>> emittersByTopic = communityUxEmitterRegistry.findAll();
        int emitterCount = emittersByTopic.values().stream()
                .mapToInt(Map::size)
                .sum();

        log.info("서버 종료 이벤트를 감지하여 커뮤니티 UX SSE 연결 정리를 시작합니다. (Graceful Shutdown 지연 방지) emitterCount={}", emitterCount);

        emittersByTopic.forEach((topic, emitters) ->
                emitters.forEach((emitterId, emitter) -> {
                    try {
                        emitter.complete();
                    } catch (IllegalStateException exception) {
                        log.debug("이미 종료된 커뮤니티 UX SSE 연결입니다. topic={}, emitterId={}", topic, emitterId);
                    }
                })
        );

        communityUxEmitterRegistry.clear();
        log.info("커뮤니티 UX SSE 연결 정리를 완료했습니다. 서버가 빠르게 종료됩니다. emitterCount={}", emitterCount);
    }
}
