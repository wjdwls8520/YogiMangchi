package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.query.PostQueryDto;
import com.yogimangchi.domain.community.dto.query.ReplyQueryDto;
import com.yogimangchi.domain.community.dto.request.PostSearchDto;
import com.yogimangchi.domain.community.dto.request.ReplySearchDto;
import com.yogimangchi.domain.community.dto.response.LikeResponseDto;
import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
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
import com.yogimangchi.global.dto.CursorResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

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

    // 포스트조아요
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
    public CursorResponseDto<PostAndMemberDto> getLikedPosts(Long loginMemberId, PostSearchDto request) {
        memberReader.getAuthenticated(loginMemberId);

        String q = (request.keyword() == null) ? null : request.keyword().trim();
        int limitSize = request.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<PostQueryDto> posts = (q == null || q.isBlank())
                ? postLikeRepository.findLikedPostsByCursor(loginMemberId, request.cursorId(), pageable)
                : postLikeRepository.findLikedPostsByKeywordByCursor(loginMemberId, request.cursorId(), q, pageable);

        if (posts.isEmpty()) return new CursorResponseDto<>(List.of(), null, false);

        boolean hasNext = posts.size() > limitSize;
        if (hasNext) {
            posts = new ArrayList<>(posts.subList(0, limitSize));
        }

        Long nextCursorId = posts.get(posts.size() - 1).cursorId();
        List<PostAndMemberDto> content = posts.stream().map(PostQueryDto::toPostAndMemberDto).toList();
        return new CursorResponseDto<>(content, hasNext ? nextCursorId : null, hasNext);
    }



    // 댓글조아요
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

    @Transactional(readOnly = true)
    public CursorResponseDto<ReplyDetailDto> getLikedReplys(Long loginMemberId, ReplySearchDto request) {
        memberReader.getAuthenticated(loginMemberId);
        int limitSize = request.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<ReplyQueryDto> replys = replyLikeRepository.getLikedReplysByCursor(loginMemberId, request.cursorId(), pageable);

        if (replys.isEmpty()) return new CursorResponseDto<>(List.of(), null, false);

        boolean hasNext = replys.size() > limitSize;
        if (hasNext) {
            replys = new ArrayList<>(replys.subList(0, limitSize));
        }

        Long nextCursorId = replys.get(replys.size() - 1).cursorId();
        List<ReplyDetailDto> content = replys.stream().map(ReplyQueryDto::toReplyDetailDto).toList();
        return new CursorResponseDto<>(content, hasNext ? nextCursorId : null, hasNext);
    }
}
