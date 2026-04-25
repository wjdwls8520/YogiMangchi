package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.member.dto.query.FollowMemberQueryDto;
import com.yogimangchi.domain.member.dto.request.FollowSearchDto;
import com.yogimangchi.domain.member.dto.result.FollowCreatedResultDto;
import com.yogimangchi.domain.member.dto.response.FollowMemberDto;
import com.yogimangchi.domain.member.dto.response.FollowResponseDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberFollowRepository;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.global.support.MemberReader;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final MemberFollowRepository memberFollowRepository;
    private final MemberRepository memberRepository;
    private final MemberReader memberReader;

    @Transactional
    public FollowCreatedResultDto followMember(Long loginMemberId, Long targetMemberId) {
        Member loginMember = memberReader.getAuthenticated(loginMemberId);
        Member targetMember = memberReader.getFindMember(targetMemberId);

        validateNotSelfFollow(loginMember.getId(), targetMember.getId());

        int insertedCount = memberFollowRepository.insertIgnore(loginMemberId, targetMemberId);
        if (insertedCount > 0) {
            memberRepository.increaseFollowingCount(loginMemberId);
            memberRepository.increaseFollowerCount(targetMemberId);
        }

        return new FollowCreatedResultDto(
                targetMemberId,
                memberRepository.findFollowerCountById(targetMemberId),
                true,
                insertedCount > 0,
                loginMember.getId(),
                targetMember.getId()
        );
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
    public CursorResponseDto<FollowMemberDto> getFollowerMembers(Long memberId, FollowSearchDto request) {
        memberReader.getFindMember(memberId);

        List<FollowMemberQueryDto> followerMembers = memberFollowRepository.searchFollowerMembers(memberId, request);
        int limitSize = request.getOrDefaultSize();
        boolean hasNext = followerMembers.size() > limitSize;

        if (hasNext) {
            followerMembers.remove(limitSize);
        }

        Long nextCursorId = hasNext && !followerMembers.isEmpty()
                ? followerMembers.get(followerMembers.size() - 1).cursorId()
                : null;

        List<FollowMemberDto> content = followerMembers.stream()
                .map(this::toFollowMemberDto)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<FollowMemberDto> getFollowingMembers(Long memberId, FollowSearchDto request) {
        memberReader.getFindMember(memberId);

        List<FollowMemberQueryDto> followingMembers = memberFollowRepository.searchFollowingMembers(memberId, request);
        int limitSize = request.getOrDefaultSize();
        boolean hasNext = followingMembers.size() > limitSize;

        if (hasNext) {
            followingMembers.remove(limitSize);
        }

        Long nextCursorId = hasNext && !followingMembers.isEmpty()
                ? followingMembers.get(followingMembers.size() - 1).cursorId()
                : null;

        List<FollowMemberDto> content = followingMembers.stream()
                .map(this::toFollowMemberDto)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    private void validateNotSelfFollow(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신은 팔로우할 수 없습니다.");
        }
    }

    private FollowMemberDto toFollowMemberDto(FollowMemberQueryDto member) {
        return new FollowMemberDto(
                member.memberId(),
                member.nickname(),
                member.profileImgUrl(),
                member.profileMsg(),
                member.bestCount(),
                member.followerCount(),
                member.followingCount(),
                member.followCreatedAt()
        );
    }
}
