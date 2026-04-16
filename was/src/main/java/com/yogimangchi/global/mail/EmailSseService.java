package com.yogimangchi.global.mail;

import com.yogimangchi.domain.notification.support.NotificationEmitterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailSseService {

    private final NotificationEmitterRepository notificationEmitterRepository;

    public void sendEvent(Long memberId, String eventName, String message) {
        // 해당 유저(memberId)가 연결한 모든 SSE 통로(Emitter)들을 저장소에서 가져옵니다. (멀티 디바이스/탭 대응)
        Map<String, SseEmitter> emitters = notificationEmitterRepository.findAllByMemberId(memberId);

        // 유저가 가진 여러 개의 연결 통로를 하나씩 순회하며 메시지를 전송합니다.
        for(Map.Entry<String, SseEmitter> entry : emitters.entrySet()) {
            try {
                // 해당 통로를 통해 이벤트 이름과 메시지 데이터를 담아 실시간 알림을 전송합니다.
                entry.getValue().send(
                        SseEmitter.event()
                                .name(eventName)
                                .data(message)
                );
            } catch (IOException | IllegalStateException e) {
                // 전송 중 오류가 발생하거나 연결이 이미 끊긴 경우, 로그를 남기고 저장소에서 해당 연결을 삭제합니다.
                log.warn("이메일 SSE 이벤트 전송 실패. memberId={}, emitterId={}", memberId, entry.getKey());
                notificationEmitterRepository.remove(memberId, entry.getKey());
            }
        }
    }
}
