package com.yogimangchi.domain.member.dto.query;

import java.time.LocalDateTime;

public record FollowMemberQueryDto(
        Long cursorId,
        Long memberId,
        String nickname,
        String profileImgUrl,
        String profileMsg,
        Long bestCount,
        Long followerCount,
        Long followingCount,
        LocalDateTime followCreatedAt
) {}
