package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.dto.request.CompleteVerificationRequestDto;
import com.yogimangchi.domain.member.dto.request.EmailSendRequestDto;
import com.yogimangchi.domain.member.dto.request.EmailVerifyRequestDto;
import com.yogimangchi.domain.member.dto.response.OAuthEmailResponseDto;
import com.yogimangchi.domain.member.service.EmailVerificationService;
import com.yogimangchi.global.auth.jwt.service.AuthCookieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/member/email")
@RequiredArgsConstructor
@Tag(name = "02 - Member-EMAIL", description = "인증회원 전환에 필요한 이메일 인증 api")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;
    private final AuthCookieService authCookieService;

    @Operation(
            summary = "소셜 로그인 이메일 조회",
            description = "인증에 사용할 소셜 로그인 이메일을 조회합니다. 인증은 가입 시 사용한 소셜 계정 이메일로만 가능합니다."
    )
    @GetMapping("/oauth")
    public ResponseEntity<OAuthEmailResponseDto> getOAuthEmail(
            @AuthenticationPrincipal Long loginMemberId
    ) {
        return ResponseEntity.ok(emailVerificationService.getOAuthEmail(loginMemberId));
    }

    @Operation(
            summary = "이메일 인증 코드 발송",
            description = """
                    소셜 로그인 이메일로 6자리 인증 코드를 발송합니다.

                    [비동기 처리]
                    - 요청 즉시 202 Accepted 를 반환하며, 이메일 발송은 백그라운드에서 처리됩니다.
                    - 발송 결과는 기존 SSE 연결(/api/v1/notification/subscribe)을 통해 수신합니다.
                    - EMAIL_SENT : 발송 성공
                    - EMAIL_SEND_FAILED : 발송 실패 (재시도 필요)

                    [제한]
                    - 인증 코드 유효시간: 5분
                    - 재발송 쿨다운: 1분
                    - 소셜 계정에 연결된 이메일로만 발송 가능
                    """
    )
    @PostMapping("/send")
    public ResponseEntity<Void> sendVerificationCode(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestBody @Valid EmailSendRequestDto request
    ) {
        emailVerificationService.sendCode(loginMemberId, request);
        return ResponseEntity.accepted().build();
    }

    @Operation(
            summary = "이메일 인증 코드 확인",
            description = """
                    발송된 6자리 인증 코드를 검증합니다.

                    - 코드 일치 시 인증 완료 플래그를 1시간 동안 유지합니다.
                    - 코드 불일치 또는 만료 시 400 에러를 반환합니다.
                    - 인증 완료 후 /email/complete 를 호출해 인증회원으로 전환해야 합니다.
                    """
    )
    @PostMapping("/verify")
    public ResponseEntity<Void> verifyCode(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestBody @Valid EmailVerifyRequestDto request
    ) {
        emailVerificationService.verify(loginMemberId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "인증회원 전환",
            description = """
                    이메일 인증 완료 후 전화번호와 주소를 입력해 인증회원(VERIFIED_USER)으로 전환합니다.
                    \n\n
                    [전환 조건]
                    - /email/verify 를 통한 인증 완료 상태여야 합니다. (1시간 이내)
                    - 전화번호: 10~11자리 숫자 (- 제외)
                    - 주소코드: 5자리 이하
                    - 주소1: 20자 이하 (도로명/지번 주소)
                    - 주소2: 100자 이하 (상세 주소, 선택)
                    \n\n        
                    [인증 완료 플로우]
                    1. GET  /email/oauth    → 소셜 이메일 확인
                    2. POST /email/send     → 인증 코드 발송 (SSE로 결과 수신)
                    3. POST /email/verify   → 코드 입력 검증
                    4. POST /email/complete → 정보 입력 후 인증회원 전환
                    """
    )
    @PostMapping("/complete")
    public ResponseEntity<Void> completeVerification(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestBody @Valid CompleteVerificationRequestDto request,
            HttpServletResponse response
    ) {
        emailVerificationService.completeVerification(loginMemberId, request);
        authCookieService.expireAccessTokenCookie(response);
        return ResponseEntity.ok().build();
    }
}
