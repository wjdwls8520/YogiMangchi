package com.yogimangchi.domain.community.dto.event;

import java.time.LocalDateTime;

// 커뮤니티 피드 화면에서 "새 글이 있습니다" UX를 표시하기 위한 SSE 이벤트 DTO다.
// 저장형 알림이 아니라 화면용 신호이므로, 새 게시글 식별과 작성자 구분에 필요한 최소 정보만 담는다.
public record PostCreatedUxEventDto(
        Long postId,
        String title,
        Long authorMemberId,
        String authorNickname,
        LocalDateTime createdAt
) {
}
