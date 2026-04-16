package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.dto.request.CompleteVerificationRequestDto;
import com.yogimangchi.domain.member.dto.request.EmailSendRequestDto;
import com.yogimangchi.domain.member.dto.request.EmailVerifyRequestDto;
import com.yogimangchi.domain.member.dto.response.OAuthEmailResponseDto;
import com.yogimangchi.domain.member.service.EmailVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/member/email")
@RequiredArgsConstructor
@Tag(name = "02 - Member-EMAIL", description = "인증회원 요청에 필요한 이메일 인증 api")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @Operation(summary = "소셜 로그인 이메일 조회", description = "인증에 사용할 소셜 로그인 이메일을 조회합니다.")
    @GetMapping("/oauth")
    public ResponseEntity<OAuthEmailResponseDto> getOAuthEmail(
            @AuthenticationPrincipal Long loginMemberId
    ) {
        return ResponseEntity.ok(emailVerificationService.getOAuthEmail(loginMemberId));
    }

    @Operation(summary = "이메일 인증 코드 발송", description = "입력한 이메일로 6자리 인증 코드를 발송합니다. (유효시간 5분)")
    @PostMapping("/send")
    public ResponseEntity<Void> sendVerificationCode(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestBody @Valid EmailSendRequestDto request
    ) {
        emailVerificationService.sendCode(loginMemberId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "이메일 인증 코드 확인", description = "인증 코드가 일치하면 인증회원(VERIFIED_USER)으로 변경됩니다.")
    @PostMapping("/verify")
    public ResponseEntity<Void> verifyCode(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestBody @Valid EmailVerifyRequestDto request
    ) {
        emailVerificationService.verify(loginMemberId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "인증회원 전환", description = "이메일 인증 완료 후 주소/전화번호 입력 시 인증회원으로 전환됩니다.")
    @PostMapping("/complete")
    public ResponseEntity<Void> completeVerification(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestBody @Valid CompleteVerificationRequestDto request
    ) {
        emailVerificationService.completeVerification(loginMemberId, request);
        return ResponseEntity.ok().build();
    }
}
