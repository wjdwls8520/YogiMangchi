package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.response.LikeResponseDto;
import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.PostDetailDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.PostLikeRepository;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.repository.ReplyLikeRepository;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import com.yogimangchi.global.support.MemberReader;
import com.yogimangchi.domain.community.support.PostReader;
import com.yogimangchi.domain.community.support.ReplyReader;
import com.yogimangchi.domain.community.validator.ReplyValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final PostLikeRepository postLikeRepository;
    private final ReplyLikeRepository replyLikeRepository;
    private final MemberReader memberReader;
    private final PostReader postReader;
    private final ReplyReader replyReader;
    private final ReplyValidator replyValidator;

    @Transactional
    public LikeResponseDto likePost(Long loginMemberId, Long postId) {
        // 로그인한 사용자가 활성 게시글에만 좋아요를 누를 수 있습니다.
        memberReader.getAuthenticated(loginMemberId);
        postReader.getActive(postId);

        int insertedCount = postLikeRepository.insertIgnore(loginMemberId, postId);
        if (insertedCount > 0) {
            postRepository.increaseLikeCount(postId);
        }

        return new LikeResponseDto(postId, postRepository.findLikeCountById(postId), true);
    }

    @Transactional
    public LikeResponseDto unlikePost(Long loginMemberId, Long postId) {
        // 취소 요청도 동일하게 인증과 게시글 활성 상태를 먼저 확인합니다.
        memberReader.getAuthenticated(loginMemberId);
        postReader.getActive(postId);

        int deletedCount = postLikeRepository.deleteByMemberIdAndPostId(loginMemberId, postId);
        if (deletedCount > 0) {
            postRepository.decreaseLikeCount(postId);
        }

        return new LikeResponseDto(postId, postRepository.findLikeCountById(postId), false);
    }

    @Transactional(readOnly = true)
    public Page<PostAndMemberDto> getLikedPosts(Long loginMemberId, int page, int size, String keyword) {
        memberReader.getAuthenticated(loginMemberId);

        String q = (keyword == null) ? null : keyword.trim();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostAndMemberDto> likedPosts = (q == null || q.isBlank())
                ? postLikeRepository.findAllLikedPosts(loginMemberId, pageable)
                : postLikeRepository.findLikedPostsByKeyword(loginMemberId, q, pageable);

        if (likedPosts.isEmpty()) return Page.empty(pageable);

        return likedPosts;
    }


    @Transactional
    public LikeResponseDto likeReply(Long loginMemberId, Long postId, Long replyId) {
        // 댓글 좋아요는 게시글-댓글 소속까지 함께 검증합니다.
        memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글에만 좋아요를 누를 수 있습니다.");

        int insertedCount = replyLikeRepository.insertIgnore(loginMemberId, replyId);
        if (insertedCount > 0) {
            replyRepository.increaseLikeCount(replyId);
        }

        return new LikeResponseDto(replyId, replyRepository.findLikeCountById(replyId), true);
    }

    @Transactional
    public LikeResponseDto unlikeReply(Long loginMemberId, Long postId, Long replyId) {
        // 취소 요청도 같은 게시글의 활성 댓글인지 먼저 확인합니다.
        memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글에만 좋아요를 누를 수 있습니다.");

        int deletedCount = replyLikeRepository.deleteByMemberIdAndReplyId(loginMemberId, replyId);
        if (deletedCount > 0) {
            replyRepository.decreaseLikeCount(replyId);
        }

        return new LikeResponseDto(replyId, replyRepository.findLikeCountById(replyId), false);
    }

}
