package com.yogimangchi.domain.trade.dto.response;

import com.yogimangchi.domain.trade.entity.TradeHistory;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "매매 영수증 (거래 내역) 1건 응답 데이터")
public record TradeHistoryResponseDto(

        @Schema(description = "거래 내역 ID", example = "152")
        Long tradeId,

        @Schema(description = "마켓 심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "매매 방향 (BUY / SELL)", example = "BUY")
        String side,

        @Schema(description = "주문 타입 (MARKET: 시장가 / LIMIT: 지정가)", example = "MARKET")
        String orderType,

        @Schema(description = "체결 단가 (1개당 가격)", example = "70500.50")
        BigDecimal price,

        @Schema(description = "체결 수량", example = "0.5")
        BigDecimal quantity,

        @Schema(description = "총 거래 금액 (단가 * 수량)", example = "35250.25")
        BigDecimal totalAmount,

        @Schema(description = "발생 수수료", example = "17.62")
        BigDecimal fee,

        @Schema(description = "실현 손익 (매수일 경우 0 또는 null, 매도일 경우 실제 손익)", example = "500.00")
        BigDecimal realizedProfit,

        @Schema(description = "체결시간")
        LocalDateTime executedAt
) {
    // Entity를 DTO로 변환하는 정적 팩토리 메서드
    public static TradeHistoryResponseDto from(TradeHistory history) {
        return new TradeHistoryResponseDto(
                history.getId(),
                history.getSymbol(),
                history.getSide(),
                history.getOrderType(),
                history.getPrice(),
                history.getQuantity(),
                history.getTotalAmount(),
                history.getFee(),
                history.getRealizedProfit(),
                history.getExecutedAt()
        );
    }
}