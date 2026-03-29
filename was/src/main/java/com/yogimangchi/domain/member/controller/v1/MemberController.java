package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.dto.request.UpdateMyProfileDto;
import com.yogimangchi.domain.member.dto.response.MemberProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.MyProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.NicknameDuplicationDto;
import com.yogimangchi.domain.member.service.MemberService;
import com.yogimangchi.global.validator.NicknameValidator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/member")
@RequiredArgsConstructor
@Tag(name = "02 - Member", description = "회원 멤버(유저) 관련 api") // 도메인 구분
public class MemberController {

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
        NicknameValidator.validate(nickname);

        // 닉네임이 존재하지 않으면 true 존재하면 false를 리턴
        NicknameDuplicationDto available = memberService.isAvailableNickname(nickname);
        return ResponseEntity.ok(available);
    }

    @Operation(summary = "멤버(유저) 프로필 정보", description = "멤버의 프로필 정보를 요청합니다.")
    @GetMapping("/me/info")
    public ResponseEntity<MyProfileInfoDto> getMemberInfoMe(
            @AuthenticationPrincipal Long loginMemberId
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MyProfileInfoDto myData =  memberService.getMyProfile(loginMemberId);

        return ResponseEntity.ok(myData);
    }

    @Operation(summary = "다른멤버(유저) 프로필 정보", description = "다른멤버의 프로필 정보를 요청합니다.")
    @GetMapping("/{memberId}/info")
    public ResponseEntity<MemberProfileInfoDto> getMemberInfo(
            @PathVariable Long memberId
    ) {
        MemberProfileInfoDto memberData = memberService.getMemberProfile(memberId);

        return ResponseEntity.ok(memberData);
    }

    @Operation(
            summary = "멤버(유저) 프로필 수정",
            description = "로그인한 멤버의 닉네임, 프로필 이미지 파일, 프로필 메시지를 수정합니다. multipart/form-data 형식으로 요청합니다. \n\n\n type=null, 파일값존재 하면 이미지변경 \n\n\n type=null, 파일값=null 이면 기존 프로필 그대로 \n\n\n type=reset, 파일값=null 이면 기본프로필로 초기화 \n\n\n type=reset, 파일값존재 하면 에러 (둘다값이있으면 안됨)"
    )
    @PatchMapping(value = "/me/info", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MyProfileInfoDto> updateMemberInfoMe(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam(required = false) String nickname,
            @Parameter(description = "변경할 프로필 이미지 파일")
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String profileMsg
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UpdateMyProfileDto request = UpdateMyProfileDto.of(nickname, profileImage, type, profileMsg);
        MyProfileInfoDto updatedProfile = memberService.updateMyProfile(loginMemberId, request);

        return ResponseEntity.ok(updatedProfile);
    }
}
