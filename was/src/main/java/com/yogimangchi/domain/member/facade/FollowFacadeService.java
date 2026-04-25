package com.yogimangchi.domain.member.facade;

import com.yogimangchi.domain.member.dto.result.FollowCreatedResultDto;
import com.yogimangchi.domain.member.dto.response.FollowResponseDto;
import com.yogimangchi.domain.member.service.FollowService;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.notification.service.NotificationSseService;
import com.yogimangchi.global.sse.enums.CommunitySseEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FollowFacadeService {

    private final FollowService followService;
    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;

    // 팔로우 생성 유스케이스의 전체 흐름을 조립한다.
    // 팔로우 저장 -> 알림 저장 -> SSE 전송 -> 응답 DTO 변환 순서로 처리한다.
    public FollowResponseDto followMember(Long loginMemberId, Long targetMemberId) {
        FollowCreatedResultDto createdResult = followService.followMember(loginMemberId, targetMemberId);
        sendFollowCreatedNotification(createdResult);
        return createdResult.toFollowResponseDto();
    }

    private void sendFollowCreatedNotification(FollowCreatedResultDto createdResult) {
        NotificationResponseDto notification = notificationService.createFollowNotification(createdResult);
        if (notification == null) {
            return;
        }

        notificationSseService.sendNotification(
                createdResult.receiverMemberId(),
                CommunitySseEventType.NOTIFICATION_COMMUNITY_FOLLOW_CREATED.name(),
                notification
        );
    }
}
