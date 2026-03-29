package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.dto.request.FollowSearchCondition;
import com.yogimangchi.domain.member.entity.MemberFollow;

import java.util.List;

public interface MemberFollowRepositoryCustom {

    List<MemberFollow> searchFollowerMembers(Long memberId, FollowSearchCondition condition);

    List<MemberFollow> searchFollowingMembers(Long memberId, FollowSearchCondition condition);
}
