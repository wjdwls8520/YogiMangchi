package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.dto.request.FollowSearchCondition;
import com.yogimangchi.domain.member.dto.query.FollowMemberQueryDto;

import java.util.List;

public interface MemberFollowRepositoryCustom {

    List<FollowMemberQueryDto> searchFollowerMembers(Long memberId, FollowSearchCondition request);

    List<FollowMemberQueryDto> searchFollowingMembers(Long memberId, FollowSearchCondition request);
}
