package com.yogimangchi.domain.community.facade;

import com.yogimangchi.domain.community.dto.result.PostLikeCreatedResultDto;
import com.yogimangchi.domain.community.dto.result.ReplyLikeCreatedResultDto;
import com.yogimangchi.domain.community.dto.response.LikeResponseDto;
import com.yogimangchi.domain.community.service.LikeService;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.notification.service.NotificationSseService;
import com.yogimangchi.global.sse.enums.CommunitySseEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommunityLikeFacadeService {

    private final LikeService likeService;
    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;

    // 좋아요 생성 유스케이스의 전체 흐름을 조립한다.
    // 좋아요 저장 -> 알림 저장 -> SSE 전송 -> 응답 DTO 변환 순서로 처리한다.
    public LikeResponseDto likePost(Long loginMemberId, Long postId) {
        PostLikeCreatedResultDto createdResult = likeService.likePost(loginMemberId, postId);
        sendPostLikedNotification(createdResult);
        return createdResult.toLikeResponseDto();
    }

    // 좋아요 생성 유스케이스의 전체 흐름을 조립한다.
    // 좋아요 저장 -> 알림 저장 -> SSE 전송 -> 응답 DTO 변환 순서로 처리한다.
    public LikeResponseDto likeReply(Long loginMemberId, Long postId, Long replyId) {
        ReplyLikeCreatedResultDto createdResult = likeService.likeReply(loginMemberId, postId, replyId);
        sendReplyLikedNotification(createdResult);
        return createdResult.toLikeResponseDto();
    }

    // 게시글 좋아요 생성 결과를 기준으로 최초 1회 알림을 저장하고 SSE로 전송한다.
    private void sendPostLikedNotification(PostLikeCreatedResultDto createdResult) {
        NotificationResponseDto notification = notificationService.createPostLikedNotification(createdResult);
        if (notification == null) {
            return;
        }

        notificationSseService.sendNotification(
                createdResult.receiverMemberId(),
                CommunitySseEventType.NOTIFICATION_COMMUNITY_POST_LIKED.name(),
                notification
        );
    }

    // 댓글 좋아요 생성 결과를 기준으로 최초 1회 알림을 저장하고 SSE로 전송한다.
    private void sendReplyLikedNotification(ReplyLikeCreatedResultDto createdResult) {
        NotificationResponseDto notification = notificationService.createReplyLikedNotification(createdResult);
        if (notification == null) {
            return;
        }

        notificationSseService.sendNotification(
                createdResult.receiverMemberId(),
                CommunitySseEventType.NOTIFICATION_COMMUNITY_REPLY_LIKED.name(),
                notification
        );
    }
}
