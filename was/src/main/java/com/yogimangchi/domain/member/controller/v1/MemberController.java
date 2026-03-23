package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.dto.response.MyProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.NicknameDuplicationDto;
import com.yogimangchi.domain.member.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/member")
@RequiredArgsConstructor
@Tag(name = "Member", description = "회원 멤버(유저) 관련 api") // 도메인 구분
public class MemberController {

    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[가-힣a-zA-Z0-9]{2,12}$");

    private final MemberService memberService;

    @Operation(
            summary = "닉네임 중복 체크",
            description = "중복된 닉네임을 체크합니다. \n" +
                    " 한글영문숫자만 가능하며 최대 2~12자리 까지 가능합니다. 띄어쓰기는 허용되지 않습니다. \n" +
                    "const resp = await axios.get('/api/v1/member/nickname/duplication?nickname=홍길동');")
    @GetMapping("/nickname/duplication")
    public ResponseEntity<NicknameDuplicationDto> isAvailableNickname(
        @RequestParam String nickname
    ) {

        if (nickname == null || !NICKNAME_PATTERN.matcher(nickname).matches()) {
            throw new IllegalArgumentException("닉네임은 공백없는 한글, 영문, 숫자만 사용 가능하며 2~12자여야 합니다.");
        }

        // 닉네임이 존재하지 않으면 true 존재하면 false를 리턴
        NicknameDuplicationDto available = memberService.isAvailableNickname(nickname);
        return ResponseEntity.ok(available);
    }

    @Operation(summary = "멤버(유저) 프로필 정보", description = "멤버의 프로필 정보를 요청합니다.")
    @GetMapping("/info/me")
    public ResponseEntity<MyProfileInfoDto> getMemberInfoMe(
            @AuthenticationPrincipal Long memberId
    ) {
        MyProfileInfoDto myData =  memberService.getMyProfile(memberId);

        return ResponseEntity.ok(myData);
    }
}
