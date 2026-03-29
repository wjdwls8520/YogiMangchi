package com.yogimangchi.domain.member.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.member.dto.request.FollowSearchCondition;
import com.yogimangchi.domain.member.dto.query.FollowMemberQueryDto;
import com.yogimangchi.domain.member.entity.QMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;

import static com.yogimangchi.domain.member.entity.QMemberFollow.memberFollow;

@Repository
@RequiredArgsConstructor
public class MemberFollowRepositoryImpl implements MemberFollowRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<FollowMemberQueryDto> searchFollowerMembers(Long memberId, FollowSearchCondition condition) {
        QMember followerMember = new QMember("followerMember");

        return queryFactory
                .select(Projections.constructor(
                        FollowMemberQueryDto.class,
                        memberFollow.id,
                        followerMember.id,
                        followerMember.nickname,
                        followerMember.profileImgUrl,
                        followerMember.profileMsg,
                        followerMember.bestCount,
                        followerMember.followerCount,
                        followerMember.followingCount,
                        memberFollow.createdAt
                ))
                .from(memberFollow)
                .join(memberFollow.follower, followerMember)
                .where(
                        memberFollow.following.id.eq(memberId),
                        activeMemberOnly(followerMember),
                        nicknameContains(followerMember, condition.keyword()),
                        cursorIdLt(condition.cursorId())
                )
                .orderBy(memberFollow.id.desc())
                .limit(condition.getOrDefaultSize() + 1L)
                .fetch();
    }

    @Override
    public List<FollowMemberQueryDto> searchFollowingMembers(Long memberId, FollowSearchCondition condition) {
        QMember followingMember = new QMember("followingMember");

        return queryFactory
                .select(Projections.constructor(
                        FollowMemberQueryDto.class,
                        memberFollow.id,
                        followingMember.id,
                        followingMember.nickname,
                        followingMember.profileImgUrl,
                        followingMember.profileMsg,
                        followingMember.bestCount,
                        followingMember.followerCount,
                        followingMember.followingCount,
                        memberFollow.createdAt
                ))
                .from(memberFollow)
                .join(memberFollow.following, followingMember)
                .where(
                        memberFollow.follower.id.eq(memberId),
                        activeMemberOnly(followingMember),
                        nicknameContains(followingMember, condition.keyword()),
                        cursorIdLt(condition.cursorId())
                )
                .orderBy(memberFollow.id.desc())
                .limit(condition.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? memberFollow.id.lt(cursorId) : null;
    }

    private BooleanExpression activeMemberOnly(QMember member) {
        return member.deleteYn.eq("N");
    }

    private BooleanExpression nicknameContains(QMember member, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }

        return member.nickname.containsIgnoreCase(keyword.trim());
    }
}
