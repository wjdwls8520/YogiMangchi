package com.yogimangchi.domain.member.dto.result;

import com.yogimangchi.domain.member.dto.response.FollowResponseDto;

// 팔로우 생성 직후의 내부 결과를 담는 DTO로,
// 파사드가 알림 생성과 최종 응답 변환에 함께 사용한다.
public record FollowCreatedResultDto(
        Long targetMemberId,
        Long followerCount,
        Boolean followedByMe,
        boolean newFollowCreated,
        Long actorMemberId,
        Long receiverMemberId
) {

    public FollowResponseDto toFollowResponseDto() {
        return new FollowResponseDto(
                targetMemberId,
                followerCount,
                followedByMe
        );
    }
}
