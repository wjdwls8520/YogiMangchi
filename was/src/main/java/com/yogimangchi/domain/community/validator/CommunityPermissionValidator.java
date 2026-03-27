package com.yogimangchi.domain.community.validator;

import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.enums.MemberRole;
import org.springframework.stereotype.Component;

/**
 * 커뮤니티 도메인의 권한 검증기
 * 게시글·댓글의 수정/삭제 시 "본인 또는 ADMIN"인지 확인합니다.
 *
 * 예시: postService.updatePost() → validatePostAuthorOrAdmin(post, requester, "수정 권한이 없습니다.")
 */
@Component
public class CommunityPermissionValidator {

    public void validatePostAuthorOrAdmin(Post post, Member requester, String errorMessage) {
        boolean isAuthor = post.getMember().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == MemberRole.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new SecurityException(errorMessage);
        }
    }

    public void validateReplyAuthorOrAdmin(Reply reply, Member requester, String errorMessage) {
        boolean isAuthor = reply.getMember().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == MemberRole.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new SecurityException(errorMessage);
        }
    }
}
