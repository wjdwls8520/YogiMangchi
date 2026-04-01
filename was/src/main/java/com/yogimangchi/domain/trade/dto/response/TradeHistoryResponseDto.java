package com.yogimangchi.domain.trade.dto.response;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.trade.dto.query.TradeHistoryQueryDto;
import com.yogimangchi.domain.trade.entity.TradeHistory;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "매매 영수증(체결 이력) 1건 응답 데이터")
public record TradeHistoryResponseDto(

        @Schema(description = "거래 이력 ID", example = "152")
        Long tradeId,

        @Schema(description = "원주문 ID", example = "78")
        Long orderId,

        @Schema(description = "지갑 타입(컨텐츠 구분)", example = "MOCK")
        AssetType assetType,

        @Schema(description = "마켓 심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "코인 한글명", example = "비트코인")
        String displayNameKr,

        @Schema(description = "매매 방향 (BUY / SELL)", example = "BUY")
        String side,

        @Schema(description = "주문 타입 (MARKET: 시장가 / LIMIT: 지정가)", example = "MARKET")
        String orderType,

        @Schema(description = "주문 상태 (PENDING / PARTIALLY_FILLED / COMPLETED / CANCELED)", example = "COMPLETED")
        OrderStatus orderStatus,

        @Schema(description = "체결 가격 (1개당 가격)", example = "70500.50")
        BigDecimal price,

        @Schema(description = "체결 수량", example = "0.5")
        BigDecimal quantity,

        @Schema(description = "체결 금액 (수수료 제외)", example = "999.50")
        BigDecimal totalAmount,

        @Schema(description = "발생 수수료", example = "0.50")
        BigDecimal fee,

        @Schema(description = "정산 금액 (BUY는 실제 차감액, SELL은 실제 수령액, 수수료 반영)", example = "1000.00")
        BigDecimal settlementAmount,

        @Schema(description = "실현 손익 (매수는 0 또는 null, 매도는 실제 손익)", example = "500.00")
        BigDecimal realizedProfit,

        @Schema(description = "주문 일시")
        LocalDateTime orderedAt,

        @Schema(description = "체결 시각", nullable = true)
        LocalDateTime executedAt
) {
    public static TradeHistoryResponseDto from(TradeHistory history, String displayNameKr) {
        return new TradeHistoryResponseDto(
                history.getId(),
                history.getOrder().getId(),
                history.getAssets().getType(),
                history.getSymbol(),
                displayNameKr,
                history.getSide(),
                history.getOrderType(),
                history.getOrder().getStatus(),
                history.getPrice(),
                history.getQuantity(),
                history.getTotalAmount(),
                history.getFee(),
                calculateSettlementAmount(history.getSide(), history.getTotalAmount(), history.getFee()),
                history.getRealizedProfit(),
                history.getOrder().getCreatedAt(),
                history.getExecutedAt()
        );
    }

    public static TradeHistoryResponseDto from(TradeHistoryQueryDto queryDto) {
        return new TradeHistoryResponseDto(
                queryDto.tradeId(),
                queryDto.orderId(),
                queryDto.assetType(),
                queryDto.symbol(),
                queryDto.displayNameKr(),
                queryDto.side(),
                queryDto.orderType(),
                queryDto.orderStatus(),
                queryDto.price(),
                queryDto.quantity(),
                queryDto.totalAmount(),
                queryDto.fee(),
                calculateSettlementAmount(queryDto.side(), queryDto.totalAmount(), queryDto.fee()),
                queryDto.realizedProfit(),
                queryDto.orderedAt(),
                queryDto.executedAt()
        );
    }

    private static BigDecimal calculateSettlementAmount(String side, BigDecimal totalAmount, BigDecimal fee) {
        if (totalAmount == null || fee == null) {
            return null;
        }

        if ("SELL".equalsIgnoreCase(side)) {
            return totalAmount.subtract(fee);
        }

        return totalAmount.add(fee);
    }
}
