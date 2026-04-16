package com.yogimangchi.global.mail;

import com.yogimangchi.global.exception.member.MemberException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSendService {

    private final JavaMailSender mailSender;

    public void sendVerificationCode(String toEmail, String code) {

        try {
            // MimeMessage 객체 생성: 멀티파트(HTML, 첨부파일 등) 메세지를 만들기 위한 기본 객체
            MimeMessage message = mailSender.createMimeMessage();
            // MimeMessageHelper 설정: 메세지 구성을 도와주는 유틸리티
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            // 수신자 이메일 설정
            helper.setTo(toEmail);
            // 메일 제목
            helper.setSubject("[요기망치] 이메일 인증 코드");
            // 메일 본문
            helper.setText(buildEmailContent(code), true);

            // 메일 전송 실행 (SMTP 서버와 통신)
            mailSender.send(message);

        } catch (MessagingException e) {
            log.error("이메일 발송 실패 - to: {}", toEmail, e);
            throw MemberException.emailSendFailed();
        }
    }

    private String buildEmailContent(String code) {
        return """
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
               <h2>요기망치 이메일 인증</h2>
               <p>아래 인증 코드를 입력해주세요. (5분 이내)</p>
               <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
                   %s
               </div>
            </div>
        """.formatted(code);
    }
}
