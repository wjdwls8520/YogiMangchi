package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.dto.MemberResponseDto;
import com.yogimangchi.domain.member.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/member")
@RequiredArgsConstructor
@Tag(name = "Member", description = "회원 멤버(유저) 관련 api") // 도메인 구분
public class memberController {

    private final MemberService memberService;

    @Operation(summary = "멤버(유저) 프로필 정보", description = "멤버의 프로필 정보를 요청합니다.")
    @GetMapping("/info/me")
    public ResponseEntity<MemberResponseDto.myProfileInfo> getMemberInfoMe(
            @AuthenticationPrincipal Long memberId
    ) {

        MemberResponseDto.myProfileInfo myData =  memberService.getMyProfile(memberId);

        return ResponseEntity.ok(myData);
    }
}
