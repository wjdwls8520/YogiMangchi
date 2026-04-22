package com.yogimangchi.domain.community.facade;

import com.yogimangchi.domain.community.dto.result.ReplyCreatedResultDto;
import com.yogimangchi.domain.community.dto.request.ReplyCreateDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.service.ReplyService;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.notification.service.NotificationSseService;
import com.yogimangchi.global.sse.enums.CommunitySseEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommunityReplyFacadeService {

    private final ReplyService replyService;
    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;

    // 댓글 작성 유스케이스의 전체 흐름을 조립한다.
    // 댓글 저장 -> 알림 저장 -> SSE 전송 -> 응답 DTO 변환 순서로 처리한다.
    public ReplyDetailDto createReply(Long loginMemberId, Long postId, ReplyCreateDto request) {
        ReplyCreatedResultDto createdResult = replyService.createReply(loginMemberId, postId, request);
        sendReplyCreatedNotification(createdResult);

        // 댓글 작성 API 응답은 기존 ReplyDetailDto 구조를 그대로 유지한다.
        return createdResult.toReplyDetailDto();
    }

    // 댓글 생성 결과를 기준으로 게시글 댓글 알림과 답글 알림을 분기해서 전송한다.
    private void sendReplyCreatedNotification(ReplyCreatedResultDto createdResult) {
        if (createdResult.isChildReply()) {
            // 대댓글은 target 작성자를 우선 수신자로 사용하고, 없으면 부모댓글 작성자를 사용한다.
            Long receiverId = createdResult.resolveReplyReceiverId();

            // 자기 자신에게 쓰는 댓글/답글은 알림을 만들지 않는다.
            if (receiverId == null || receiverId.equals(createdResult.memberId())) {
                return;
            }

            // 답글 알림은 DB에 먼저 저장한 뒤, 저장된 응답 DTO를 그대로 SSE로 보낸다.
            NotificationResponseDto notification = notificationService.createReplyCommentNotification(
                    receiverId,
                    createdResult
            );

            if (notification == null) {
                return;
            }

            notificationSseService.sendNotification(
                    receiverId,
                    CommunitySseEventType.NOTIFICATION_COMMUNITY_REPLY_COMMENT_CREATED.name(),
                    notification
            );
            return;
        }

        // 최상위 댓글은 게시글 작성자를 수신자로 사용한다.
        Long receiverId = createdResult.postAuthorMemberId();
        if (receiverId == null || receiverId.equals(createdResult.memberId())) {
            return;
        }

        // 게시글 댓글 알림도 저장 완료 후 SSE로 후속 전송한다.
        NotificationResponseDto notification = notificationService.createPostCommentNotification(
                receiverId,
                createdResult
        );

        if (notification == null) {
            return;
        }

        notificationSseService.sendNotification(
                receiverId,
                CommunitySseEventType.NOTIFICATION_COMMUNITY_POST_COMMENT_CREATED.name(),
                notification
        );
    }
}
