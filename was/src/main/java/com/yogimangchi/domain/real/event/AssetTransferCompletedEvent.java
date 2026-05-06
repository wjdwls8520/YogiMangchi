package com.yogimangchi.domain.real.event;


// 자산 이체 완료 이벤트
// 비동기 처리를 위해 엔티티 대신 ID만 포함하여 영속성 컨텍스트 이슈를 방지합니다.

public record AssetTransferCompletedEvent(
        Long memberId,
        Long transferHistoryId
) {
}
