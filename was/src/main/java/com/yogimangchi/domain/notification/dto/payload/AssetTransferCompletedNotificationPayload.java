package com.yogimangchi.domain.notification.dto.payload;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.real.enums.TransferType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// 자산 이체 완료 알림 페이로드
// 프론트엔드에서 실시간 UI 업데이트 시 사용하는 순수 데이터 구조입니다.
public record AssetTransferCompletedNotificationPayload(
        Long transferId,
        AssetType fromType,
        AssetType toType,
        BigDecimal amount,
        TransferType transferType,
        LocalDateTime executedAt
) {
}
