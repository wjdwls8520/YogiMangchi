package com.yogimangchi.domain.community.validator;

import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.enums.MemberRole;
import org.springframework.stereotype.Component;

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
