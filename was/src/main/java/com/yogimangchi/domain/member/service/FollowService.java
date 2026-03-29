package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.member.dto.request.FollowSearchCondition;
import com.yogimangchi.domain.member.dto.response.FollowMemberDto;
import com.yogimangchi.domain.member.dto.response.FollowResponseDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.entity.MemberFollow;
import com.yogimangchi.domain.member.repository.MemberFollowRepository;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.trade.dto.response.CursorResponseDto;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final MemberFollowRepository memberFollowRepository;
    private final MemberRepository memberRepository;
    private final MemberReader memberReader;

    @Transactional
    public FollowResponseDto followMember(Long loginMemberId, Long targetMemberId) {
        Member loginMember = memberReader.getAuthenticated(loginMemberId);
        Member targetMember = memberReader.getFindMember(targetMemberId);

        validateNotSelfFollow(loginMember.getId(), targetMember.getId());

        int insertedCount = memberFollowRepository.insertIgnore(loginMemberId, targetMemberId);
        if (insertedCount > 0) {
            memberRepository.increaseFollowingCount(loginMemberId);
            memberRepository.increaseFollowerCount(targetMemberId);
        }

        return new FollowResponseDto(targetMemberId, memberRepository.findFollowerCountById(targetMemberId), true);
    }

    @Transactional
    public FollowResponseDto unfollowMember(Long loginMemberId, Long targetMemberId) {
        Member loginMember = memberReader.getAuthenticated(loginMemberId);
        Member targetMember = memberReader.getFindMember(targetMemberId);

        validateNotSelfFollow(loginMember.getId(), targetMember.getId());

        int deletedCount = memberFollowRepository.deleteByFollowerIdAndFollowingId(loginMemberId, targetMemberId);
        if (deletedCount > 0) {
            memberRepository.decreaseFollowingCount(loginMemberId);
            memberRepository.decreaseFollowerCount(targetMemberId);
        }

        return new FollowResponseDto(targetMemberId, memberRepository.findFollowerCountById(targetMemberId), false);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<FollowMemberDto> getFollowerMembers(Long memberId, FollowSearchCondition condition) {
        memberReader.getFindMember(memberId);

        List<MemberFollow> followerMembers = memberFollowRepository.searchFollowerMembers(memberId, condition);
        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = followerMembers.size() > limitSize;

        if (hasNext) {
            followerMembers.remove(limitSize);
        }

        Long nextCursorId = followerMembers.isEmpty() ? null : followerMembers.get(followerMembers.size() - 1).getId();

        List<FollowMemberDto> content = followerMembers.stream()
                .map(this::toFollowerMemberDto)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<FollowMemberDto> getFollowingMembers(Long memberId, FollowSearchCondition condition) {
        memberReader.getFindMember(memberId);

        List<MemberFollow> followingMembers = memberFollowRepository.searchFollowingMembers(memberId, condition);
        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = followingMembers.size() > limitSize;

        if (hasNext) {
            followingMembers.remove(limitSize);
        }

        Long nextCursorId = followingMembers.isEmpty() ? null : followingMembers.get(followingMembers.size() - 1).getId();

        List<FollowMemberDto> content = followingMembers.stream()
                .map(this::toFollowingMemberDto)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    private void validateNotSelfFollow(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신은 팔로우할 수 없습니다.");
        }
    }

    private FollowMemberDto toFollowerMemberDto(MemberFollow memberFollow) {
        Member followerMember = memberFollow.getFollower();
        return new FollowMemberDto(
                followerMember.getId(),
                followerMember.getNickname(),
                followerMember.getProfileImgUrl(),
                followerMember.getProfileMsg(),
                followerMember.getBestCount(),
                followerMember.getFollowerCount(),
                followerMember.getFollowingCount(),
                memberFollow.getCreatedAt()
        );
    }

    private FollowMemberDto toFollowingMemberDto(MemberFollow memberFollow) {
        Member followingMember = memberFollow.getFollowing();
        return new FollowMemberDto(
                followingMember.getId(),
                followingMember.getNickname(),
                followingMember.getProfileImgUrl(),
                followingMember.getProfileMsg(),
                followingMember.getBestCount(),
                followingMember.getFollowerCount(),
                followingMember.getFollowingCount(),
                memberFollow.getCreatedAt()
        );
    }
}
