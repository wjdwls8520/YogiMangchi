package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.dto.request.FollowSearchDto;
import com.yogimangchi.domain.member.dto.response.FollowMemberDto;
import com.yogimangchi.domain.member.dto.response.FollowResponseDto;
import com.yogimangchi.domain.member.facade.FollowFacadeService;
import com.yogimangchi.domain.member.service.FollowService;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springdoc.core.annotations.ParameterObject;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/member")
@Tag(name = "02 - Member-Follow", description = "멤버 팔로우 관련 API")
public class FollowController {

    private final FollowFacadeService followFacadeService;
    private final FollowService followService;

    @Operation(
            summary = "멤버를 팔로우한 멤버 목록 조회",
            description = "특정 멤버를 팔로우한 멤버 목록을 커서 기반 무한 스크롤 방식으로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요. 닉네임 검색이 필요하면 keyword 를 함께 보내고, 검색어를 바꾸면 cursorId 는 다시 비워주세요."
    )
    @GetMapping("/{memberId}/followers")
    public ResponseEntity<CursorResponseDto<FollowMemberDto>> getFollowerMembers(
            @Parameter(description = "조회할 멤버 ID")
            @PathVariable Long memberId,
            @Valid @ParameterObject @ModelAttribute FollowSearchDto request
    ) {
        CursorResponseDto<FollowMemberDto> followerMembers = followService.getFollowerMembers(memberId, request);

        return ResponseEntity.ok(followerMembers);
    }

    @Operation(
            summary = "멤버가 팔로우한 멤버 목록 조회",
            description = "특정 멤버가 팔로우한 멤버 목록을 커서 기반 무한 스크롤 방식으로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요. 닉네임 검색이 필요하면 keyword 를 함께 보내고, 검색어를 바꾸면 cursorId 는 다시 비워주세요."
    )
    @GetMapping("/{memberId}/followings")
    public ResponseEntity<CursorResponseDto<FollowMemberDto>> getFollowingMembers(
            @Parameter(description = "조회할 멤버 ID")
            @PathVariable Long memberId,
            @Valid @ParameterObject @ModelAttribute FollowSearchDto request
    ) {
        CursorResponseDto<FollowMemberDto> followingMembers = followService.getFollowingMembers(memberId, request);

        return ResponseEntity.ok(followingMembers);
    }

    @Operation(
            summary = "멤버 팔로우",
            description = "다른 멤버를 팔로우합니다. path 의 targetMemberId 에 팔로우할 멤버 ID를 넣어주세요. 본인은 팔로우할 수 없고, 이미 팔로우한 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @PutMapping("/{targetMemberId}/follows")
    public ResponseEntity<FollowResponseDto> followMember(
            @AuthenticationPrincipal Long loginMemberId,
            @Parameter(description = "팔로우할 대상 멤버 ID")
            @PathVariable Long targetMemberId
    ) {
        FollowResponseDto response = followFacadeService.followMember(loginMemberId, targetMemberId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "멤버 팔로우 취소",
            description = "멤버 팔로우를 취소합니다. path 의 targetMemberId 에 언팔로우할 멤버 ID를 넣어주세요. 이미 취소된 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @DeleteMapping("/{targetMemberId}/follows")
    public ResponseEntity<FollowResponseDto> unfollowMember(
            @AuthenticationPrincipal Long loginMemberId,
            @Parameter(description = "언팔로우할 대상 멤버 ID")
            @PathVariable Long targetMemberId
    ) {
        FollowResponseDto response = followService.unfollowMember(loginMemberId, targetMemberId);
        return ResponseEntity.ok(response);
    }
}
