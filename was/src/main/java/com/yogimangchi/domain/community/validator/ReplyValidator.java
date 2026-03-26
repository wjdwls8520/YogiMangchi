package com.yogimangchi.domain.community.validator;

import com.yogimangchi.domain.community.dto.request.ReplyCreateDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import org.springframework.stereotype.Component;

@Component
public class ReplyValidator {

    public void validateCreateRequest(ReplyCreateDto request) {
        if (request.parentId() == null && request.targetId() != null) {
            throw new IllegalArgumentException("부모댓글 id 없이 타겟댓글을 지정할 수 없습니다.");
        }
    }

    public void validateReplyBelongsToPost(Post post, Reply reply, String errorMessage) {
        if (!reply.getPost().getId().equals(post.getId())) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    public void validateParent(Post post, Reply parentReply) {
        validateReplyBelongsToPost(post, parentReply, "같은 게시글의 댓글에만 대댓글을 작성할 수 있습니다.");

        if (parentReply.getParentReply() != null) {
            throw new IllegalArgumentException("대댓글은 최상위 댓글에만 작성할 수 있습니다.");
        }
    }

    public void validateTarget(Post post, Reply parentReply, Reply targetReply) {
        validateReplyBelongsToPost(post, targetReply, "같은 게시글의 댓글에만 대댓글을 작성할 수 있습니다.");

        boolean sameReplyGroup = targetReply.getId().equals(parentReply.getId())
                || (targetReply.getParentReply() != null
                && targetReply.getParentReply().getId().equals(parentReply.getId()));

        if (!sameReplyGroup) {
            throw new IllegalArgumentException("같은 댓글 그룹의 댓글에만 답글을 작성할 수 있습니다.");
        }
    }

    public void validateReplyGroupParent(Post post, Reply parentReply) {
        validateReplyBelongsToPost(post, parentReply, "같은 게시글의 댓글만 조회할 수 있습니다.");

        if (parentReply.getParentReply() != null) {
            throw new IllegalArgumentException("최상위 댓글만 조회할 수 있습니다.");
        }
    }
}
