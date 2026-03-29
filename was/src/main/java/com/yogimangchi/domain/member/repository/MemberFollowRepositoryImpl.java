package com.yogimangchi.domain.member.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.member.dto.request.FollowSearchCondition;
import com.yogimangchi.domain.member.entity.MemberFollow;
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
    public List<MemberFollow> searchFollowerMembers(Long memberId, FollowSearchCondition condition) {
        QMember followerMember = new QMember("followerMember");

        return queryFactory
                .selectFrom(memberFollow)
                .join(memberFollow.follower, followerMember).fetchJoin()
                .where(
                        memberFollow.following.id.eq(memberId),
                        nicknameContains(followerMember, condition.keyword()),
                        cursorIdLt(condition.cursorId())
                )
                .orderBy(memberFollow.id.desc())
                .limit(condition.getOrDefaultSize() + 1L)
                .fetch();
    }

    @Override
    public List<MemberFollow> searchFollowingMembers(Long memberId, FollowSearchCondition condition) {
        QMember followingMember = new QMember("followingMember");

        return queryFactory
                .selectFrom(memberFollow)
                .join(memberFollow.following, followingMember).fetchJoin()
                .where(
                        memberFollow.follower.id.eq(memberId),
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

    private BooleanExpression nicknameContains(QMember member, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }

        return member.nickname.containsIgnoreCase(keyword.trim());
    }
}
