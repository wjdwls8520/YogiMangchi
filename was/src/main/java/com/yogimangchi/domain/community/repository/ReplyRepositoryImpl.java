package com.yogimangchi.domain.community.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.community.dto.request.AdminReplySearchDto;
import com.yogimangchi.domain.community.dto.response.AdminReplyResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;

import static com.yogimangchi.domain.community.entity.QPost.post;
import static com.yogimangchi.domain.community.entity.QReply.reply;
import static com.yogimangchi.domain.member.entity.QMember.member;

@Repository
@RequiredArgsConstructor
public class ReplyRepositoryImpl implements ReplyRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<AdminReplyResponseDto> findRepliesByCursor(AdminReplySearchDto searchDto, String authorStatus) {
        return queryFactory
                .select(Projections.constructor(
                        AdminReplyResponseDto.class,
                        reply.id,
                        reply.content,
                        reply.likeCount,
                        reply.reportCount,
                        reply.deleteYn,
                        reply.createdAt,
                        reply.updatedAt,
                        reply.post.id,
                        reply.member.id
                ))
                .from(reply)
                .join(reply.post, post)
                .join(reply.member, member)
                .where(
                        postTitleContains(searchDto.postTitle()),
                        postContentContains(searchDto.postContent()),
                        replyContentContains(searchDto.replyContent()),
                        authorNicknameContains(searchDto.authorNickname()),
                        authorStatusEq(authorStatus),
                        cursorIdLt(searchDto.cursorId())
                )
                .orderBy(reply.id.desc())
                .limit(searchDto.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression postTitleContains(String postTitle) {
        if (!StringUtils.hasText(postTitle)) {
            return null;
        }
        return post.title.containsIgnoreCase(postTitle.trim());
    }

    private BooleanExpression postContentContains(String postContent) {
        if (!StringUtils.hasText(postContent)) {
            return null;
        }
        return post.content.containsIgnoreCase(postContent.trim());
    }

    private BooleanExpression replyContentContains(String replyContent) {
        if (!StringUtils.hasText(replyContent)) {
            return null;
        }
        return reply.content.containsIgnoreCase(replyContent.trim());
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
        return cursorId != null ? reply.id.lt(cursorId) : null;
    }
}
