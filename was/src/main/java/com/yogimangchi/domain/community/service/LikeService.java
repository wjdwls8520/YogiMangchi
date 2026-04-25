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
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import com.yogimangchi.domain.notification.repository.NotificationDedupeStateRepository;
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.notification.service.NotificationSseService;
import com.yogimangchi.global.support.MemberReader;
import com.yogimangchi.domain.community.support.PostReader;
import com.yogimangchi.domain.community.support.ReplyReader;
import com.yogimangchi.domain.community.validator.ReplyValidator;
import com.yogimangchi.global.dto.CursorResponseDto;
import com.yogimangchi.global.sse.enums.CommunitySseEventType;
import java.time.LocalDateTime;
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
    private final NotificationDedupeStateRepository notificationDedupeStateRepository;
    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;

    // 포스트조아요
    @Transactional
    public LikeResponseDto likePost(Long loginMemberId, Long postId) {
        // 로그인한 사용자가 활성 게시글에만 좋아요를 누를 수 있습니다.
        Member actor = memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);

        int insertedCount = postLikeRepository.insertIgnore(loginMemberId, postId);
        if (insertedCount > 0) {
            postRepository.increaseLikeCount(postId);
            sendPostLikedNotification(actor, post);
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
        Member actor = memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글에만 좋아요를 누를 수 있습니다.");

        int insertedCount = replyLikeRepository.insertIgnore(loginMemberId, replyId);
        if (insertedCount > 0) {
            replyRepository.increaseLikeCount(replyId);
            sendReplyLikedNotification(actor, reply);
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

    // 게시글 좋아요가 실제로 새로 생성된 경우에만 알림 저장과 SSE 전송을 이어서 처리
    private void sendPostLikedNotification(Member actor, Post post) {
        Member receiver = post.getMember();

        // 자기 글에 누른 좋아요는 알림을 만들지 않음
        if (receiver.getId().equals(actor.getId())) {
            return;
        }

        // 같은 사람이 같은 게시글에 대해 이미 알림을 보낸 적 있으면 최초 1회 정책에 따라 스킵
        int dedupeInserted = notificationDedupeStateRepository.insertIgnore(
                NotificationType.POST_LIKED.name(),
                actor.getId(),
                receiver.getId(),
                NotificationTargetType.POST.name(),
                post.getId(),
                LocalDateTime.now()
        );

        if (dedupeInserted == 0) {
            return;
        }

        NotificationResponseDto notification = notificationService.createPostLikedNotification(
                receiver,
                actor,
                post
        );

        if (notification == null) {
            return;
        }

        // 저장된 알림 응답 DTO를 그대로 SSE에 실어 프론트가 즉시 반영할 수 있게 함
        notificationSseService.sendNotification(
                receiver.getId(),
                CommunitySseEventType.NOTIFICATION_COMMUNITY_POST_LIKED.name(),
                notification
        );
    }

    // 댓글 좋아요가 실제로 새로 생성된 경우에만 알림 저장과 SSE 전송을 이어서 처리
    private void sendReplyLikedNotification(Member actor, Reply reply) {
        Member receiver = reply.getMember();

        // 자기 댓글에 누른 좋아요는 알림을 만들지 않음
        if (receiver.getId().equals(actor.getId())) {
            return;
        }

        // 같은 사람이 같은 댓글에 대해 이미 알림을 보낸 적 있으면 최초 1회 정책에 따라 스킵
        int dedupeInserted = notificationDedupeStateRepository.insertIgnore(
                NotificationType.REPLY_LIKED.name(),
                actor.getId(),
                receiver.getId(),
                NotificationTargetType.REPLY.name(),
                reply.getId(),
                LocalDateTime.now()
        );

        if (dedupeInserted == 0) {
            return;
        }

        NotificationResponseDto notification = notificationService.createReplyLikedNotification(
                receiver,
                actor,
                reply
        );

        if (notification == null) {
            return;
        }

        // 저장된 알림 응답 DTO를 그대로 SSE에 실어 프론트가 즉시 반영할 수 있게 함
        notificationSseService.sendNotification(
                receiver.getId(),
                CommunitySseEventType.NOTIFICATION_COMMUNITY_REPLY_LIKED.name(),
                notification
        );
    }
}
