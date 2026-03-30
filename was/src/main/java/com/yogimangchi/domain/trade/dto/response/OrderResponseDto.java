package com.yogimangchi.domain.trade.dto.response;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.trade.dto.query.OrderQueryDto;
import com.yogimangchi.domain.trade.entity.Order;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "주문내역/미체결 주문 응답 데이터")
public record OrderResponseDto(

        @Schema(description = "주문 ID", example = "152")
        Long orderId,

        @Schema(description = "지갑 타입", example = "MOCK")
        AssetType assetType,

        @Schema(description = "코인 심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "코인 한글명", example = "비트코인")
        String displayNameKr,

        @Schema(description = "주문 유형", example = "MARKET")
        String orderType,

        @Schema(description = "주문 방향", example = "BUY")
        String side,

        @Schema(description = "주문 상태", example = "PENDING")
        OrderStatus orderStatus,

        @Schema(description = "주문 가격 (지정가 주문 시 사용)", example = "70000.00", nullable = true)
        BigDecimal orderPrice,

        @Schema(description = "주문 수량", example = "0.5", nullable = true)
        BigDecimal orderQuantity,

        @Schema(description = "주문 금액 (시장가 매수 시 사용)", example = "1000.00", nullable = true)
        BigDecimal orderAmount,

        @Schema(description = "누적 체결 수량", example = "0.2")
        BigDecimal filledQuantity,

        @Schema(description = "남은 미체결 수량", example = "0.3")
        BigDecimal remainingQuantity,

        @Schema(description = "평균 체결가", example = "70120.00", nullable = true)
        BigDecimal avgFilledPrice,

        @Schema(description = "누적 체결 금액", example = "14024.00")
        BigDecimal executedAmount,

        @Schema(description = "누적 수수료", example = "7.01")
        BigDecimal totalFee,

        @Schema(description = "주문 생성 시각")
        LocalDateTime orderedAt,

        @Schema(description = "최종 체결 완료 시각", nullable = true)
        LocalDateTime executedAt,

        @Schema(description = "주문 취소 시각", nullable = true)
        LocalDateTime canceledAt
) {
    // 주문 엔티티를 화면에서 바로 쓰기 좋은 응답 형식으로 변환
    public static OrderResponseDto from(Order order, String displayNameKr) {
        return new OrderResponseDto(
                order.getId(),
                order.getAssets().getType(),
                order.getSymbol(),
                displayNameKr,
                order.getOrderType(),
                order.getSide(),
                order.getStatus(),
                order.getOrderPrice(),
                order.getOrderQuantity(),
                order.getOrderAmount(),
                order.getFilledQuantity(),
                order.getRemainingQuantity(),
                order.getAvgFilledPrice(),
                order.getExecutedAmount(),
                order.getTotalFee(),
                order.getCreatedAt(),
                order.getExecutedAt(),
                order.getCanceledAt()
        );
    }

    public static OrderResponseDto from(OrderQueryDto queryDto) {
        return new OrderResponseDto(
                queryDto.orderId(),
                queryDto.assetType(),
                queryDto.symbol(),
                queryDto.displayNameKr(),
                queryDto.orderType(),
                queryDto.side(),
                queryDto.orderStatus(),
                queryDto.orderPrice(),
                queryDto.orderQuantity(),
                queryDto.orderAmount(),
                queryDto.filledQuantity(),
                queryDto.remainingQuantity(),
                queryDto.avgFilledPrice(),
                queryDto.executedAmount(),
                queryDto.totalFee(),
                queryDto.orderedAt(),
                queryDto.executedAt(),
                queryDto.canceledAt()
        );
    }
}
