package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.response.LikeResponseDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.PostLikeRepository;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.repository.ReplyLikeRepository;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import com.yogimangchi.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final PostLikeRepository postLikeRepository;
    private final ReplyLikeRepository replyLikeRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public LikeResponseDto likePost(Long memberId, Long postId) {
        validateAuthenticated(memberId);
        validateMemberExists(memberId);
        validatePost(postId);

        int insertedCount = postLikeRepository.insertIgnore(memberId, postId);
        if (insertedCount > 0) {
            postRepository.increaseLikeCount(postId);
        }

        return new LikeResponseDto(postId, postRepository.findLikeCountById(postId), true);
    }

    @Transactional
    public LikeResponseDto unlikePost(Long memberId, Long postId) {
        validateAuthenticated(memberId);
        validateMemberExists(memberId);
        validatePost(postId);

        int deletedCount = postLikeRepository.deleteByMemberIdAndPostId(memberId, postId);
        if (deletedCount > 0) {
            postRepository.decreaseLikeCount(postId);
        }

        return new LikeResponseDto(postId, postRepository.findLikeCountById(postId), false);
    }

    @Transactional
    public LikeResponseDto likeReply(Long memberId, Long postId, Long replyId) {
        validateAuthenticated(memberId);
        validateMemberExists(memberId);
        validateReply(postId, replyId);

        int insertedCount = replyLikeRepository.insertIgnore(memberId, replyId);
        if (insertedCount > 0) {
            replyRepository.increaseLikeCount(replyId);
        }

        return new LikeResponseDto(replyId, replyRepository.findLikeCountById(replyId), true);
    }

    @Transactional
    public LikeResponseDto unlikeReply(Long memberId, Long postId, Long replyId) {
        validateAuthenticated(memberId);
        validateMemberExists(memberId);
        validateReply(postId, replyId);

        int deletedCount = replyLikeRepository.deleteByMemberIdAndReplyId(memberId, replyId);
        if (deletedCount > 0) {
            replyRepository.decreaseLikeCount(replyId);
        }

        return new LikeResponseDto(replyId, replyRepository.findLikeCountById(replyId), false);
    }

    private void validateAuthenticated(Long memberId) {
        if (memberId == null) {
            throw new IllegalArgumentException("로그인 이후 이용할 수 있습니다.");
        }
    }

    private void validateMemberExists(Long memberId) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
    }

    private void validatePost(Long postId) {
        postRepository.findById(postId)
                .filter(post -> "N".equals(post.getDeleteYn()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않거나 삭제된 게시글입니다."));
    }

    private void validateReply(Long postId, Long replyId) {
        Post post = postRepository.findById(postId)
                .filter(savedPost -> "N".equals(savedPost.getDeleteYn()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않거나 삭제된 게시글입니다."));

        Reply reply = replyRepository.findById(replyId)
                .filter(savedReply -> "N".equals(savedReply.getDeleteYn()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));

        if (!reply.getPost().getId().equals(post.getId())) {
            throw new IllegalArgumentException("같은 게시글의 댓글에만 좋아요를 누를 수 있습니다.");
        }
    }
}
