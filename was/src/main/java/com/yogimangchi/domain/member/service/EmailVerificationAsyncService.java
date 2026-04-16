package com.yogimangchi.domain.member.service;

import com.yogimangchi.global.mail.EmailSendService;
import com.yogimangchi.global.mail.EmailSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import static com.yogimangchi.domain.member.service.EmailVerificationConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationAsyncService {

    private final EmailSendService emailSendService;
    private final StringRedisTemplate stringRedisTemplate;
    private final EmailSseService emailSseService;

    @Async("emailTaskExecutor") // 설정해둔 전용 스레드 풀(최대 10개)에서 이 메서드를 별도의 일꾼이 실행하도록 합니다.
    public void sendAndNotify(Long memberId, String email, String code) {
        try {
            // 실제 외부 메일 서버를 통해 인증 코드가 담긴 이메일을 전송합니다.
            emailSendService.sendVerificationCode(email, code);

            // 나중에 유저가 입력한 값과 비교할 수 있도록 레디스(Redis)에 인증 코드를 5분간 저장합니다.
            stringRedisTemplate.opsForValue().set(EMAIL_VERIFY_PREFIX + memberId, code, CODE_TTL);

            // 이메일 발송이 성공했음을 SSE 연결을 통해 유저의 브라우저로 실시간 알림을 보냅니다.
            emailSseService.sendEvent(memberId, "EMAIL_SENT", "이메일이 발송되었습니다.");

            // 서버 로그에 인증 코드 발송이 성공했음을 기록합니다.
            log.info("이메일 인증 코드 발송 완료. memberId={}", memberId);

        } catch (Exception e) {
            // 이메일 전송 중 네트워크 오류나 예외가 발생하면 로그에 에러 내용을 상세히 남깁니다.
            log.error("이메일 인증 코드 발송 실패. memberId={}", memberId, e);

            // 이메일 발송 실패 사실을 SSE를 통해 유저에게 실시간으로 알려 페이지 새로고침 없이 대응하게 합니다.
            emailSseService.sendEvent(memberId, "EMAIL_SEND_FAILED", "이메일 발송에 실패했습니다. 다시 시도해주세요.");
        }
    }
}
