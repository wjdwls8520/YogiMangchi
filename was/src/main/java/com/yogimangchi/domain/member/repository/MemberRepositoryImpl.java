package com.yogimangchi.domain.member.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.yogimangchi.domain.member.enums.MemberRole;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.member.dto.request.AdminMemberSearchDto;
import com.yogimangchi.domain.member.dto.response.AdminMemberResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;

import static com.yogimangchi.domain.member.entity.QMember.member;
import static com.yogimangchi.domain.member.entity.QOAuthAccount.oAuthAccount;
import static com.yogimangchi.domain.member.entity.QWithdrawnOAuthAccount.withdrawnOAuthAccount;

@Repository
@RequiredArgsConstructor
public class MemberRepositoryImpl implements MemberRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<AdminMemberResponseDto> findMembersByCursor(AdminMemberSearchDto searchDto) {
        return queryFactory
                .select(Projections.constructor(
                        AdminMemberResponseDto.class,
                        member.id,
                        member.nickname,
                        member.profileImgUrl,
                        member.role,
                        member.deleteYn,
                        member.createdAt,
                        new CaseBuilder()
                                .when(member.deleteYn.eq("N")).then(oAuthAccount.email)
                                .otherwise(withdrawnOAuthAccount.email),
                        new CaseBuilder()
                                .when(member.deleteYn.eq("N")).then(oAuthAccount.provider)
                                .otherwise(withdrawnOAuthAccount.provider),
                        new CaseBuilder()
                                .when(member.deleteYn.eq("N")).then(oAuthAccount.providerUserId)
                                .otherwise(withdrawnOAuthAccount.providerUserId)
                ))
                .from(member)
                .leftJoin(oAuthAccount).on(oAuthAccount.member.id.eq(member.id))
                .leftJoin(withdrawnOAuthAccount).on(withdrawnOAuthAccount.memberId.eq(member.id))
                .where(
                        memberIdEq(searchDto.memberId()),
                        nicknameContains(searchDto.nickname()),
                        statusEq(searchDto.status()),
                        roleEq(searchDto.role()),
                        cursorIdLt(searchDto.cursorId())
                )
                .orderBy(member.id.desc())
                .limit(searchDto.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression memberIdEq(Long memberId) {
        return memberId != null ? member.id.eq(memberId) : null;
    }

    private BooleanExpression nicknameContains(String nickname) {
        if (!StringUtils.hasText(nickname)) {
            return null;
        }
        return member.nickname.containsIgnoreCase(nickname.trim());
    }

    private BooleanExpression statusEq(String status) {
        if (!StringUtils.hasText(status) || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        if ("ACTIVE".equalsIgnoreCase(status)) {
            return member.deleteYn.eq("N");
        }
        if ("WITHDRAWN".equalsIgnoreCase(status)) {
            return member.deleteYn.eq("Y");
        }
        return null;
    }

    private BooleanExpression roleEq(String role) {
        if (!StringUtils.hasText(role) || "ALL".equalsIgnoreCase(role)) {
            return null;
        }
        try {
            MemberRole memberRole = MemberRole.valueOf(role.toUpperCase().trim());
            return member.role.eq(memberRole);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? member.id.lt(cursorId) : null;
    }
}
