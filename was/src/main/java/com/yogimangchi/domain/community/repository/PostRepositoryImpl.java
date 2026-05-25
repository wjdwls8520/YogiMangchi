package com.yogimangchi.domain.community.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.community.dto.request.AdminPostSearchDto;
import com.yogimangchi.domain.community.dto.response.AdminPostResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;

import static com.yogimangchi.domain.community.entity.QPost.post;
import static com.yogimangchi.domain.member.entity.QMember.member;

@Repository
@RequiredArgsConstructor
public class PostRepositoryImpl implements PostRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<AdminPostResponseDto> findPostsByCursor(AdminPostSearchDto searchDto, String authorStatus) {
        return queryFactory
                .select(Projections.constructor(
                        AdminPostResponseDto.class,
                        post.id,
                        post.title,
                        post.content,
                        post.likeCount,
                        post.replyCount,
                        post.reportCount,
                        post.deleteYn,
                        post.createdAt,
                        post.updatedAt,
                        post.member.id
                ))
                .from(post)
                .join(post.member, member)
                .where(
                        titleContains(searchDto.title()),
                        contentContains(searchDto.content()),
                        authorNicknameContains(searchDto.authorNickname()),
                        authorStatusEq(authorStatus),
                        cursorIdLt(searchDto.cursorId())
                )
                .orderBy(post.id.desc())
                .limit(searchDto.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression titleContains(String title) {
        if (!StringUtils.hasText(title)) {
            return null;
        }
        return post.title.containsIgnoreCase(title.trim());
    }

    private BooleanExpression contentContains(String content) {
        if (!StringUtils.hasText(content)) {
            return null;
        }
        return post.content.containsIgnoreCase(content.trim());
    }

    private BooleanExpression authorNicknameContains(String authorNickname) {
        if (!StringUtils.hasText(authorNickname)) {
            return null;
        }
        return member.nickname.containsIgnoreCase(authorNickname.trim());
    }

    private BooleanExpression authorStatusEq(String authorStatus) {
        if (!StringUtils.hasText(authorStatus) || "ALL".equalsIgnoreCase(authorStatus)) {
            return null;
        }
        if ("ACTIVE".equalsIgnoreCase(authorStatus)) {
            return member.deleteYn.eq("N");
        }
        if ("WITHDRAWN".equalsIgnoreCase(authorStatus)) {
            return member.deleteYn.eq("Y");
        }
        return null;
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? post.id.lt(cursorId) : null;
    }
}
