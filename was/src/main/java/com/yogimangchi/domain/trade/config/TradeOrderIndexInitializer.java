package com.yogimangchi.domain.trade.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
// 지정가 주문 체결 조회 인덱스 초기화 컴포넌트
public class TradeOrderIndexInitializer {

    // partial index
    // 매수 지정가 미체결 주문 매칭 성능 보강용 인덱스 정의
    private static final String CREATE_LIMIT_BUY_OPEN_MATCH_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_trade_order_limit_buy_open_match
            ON trade_order (symbol, order_price, id)
            WHERE order_type = 'LIMIT'
              AND side = 'BUY'
              AND order_status IN ('PENDING', 'PARTIALLY_FILLED')
            """;

    // 매도 지정가 미체결 주문 매칭 성능 보강용 인덱스 정의
    private static final String CREATE_LIMIT_SELL_OPEN_MATCH_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_trade_order_limit_sell_open_match
            ON trade_order (symbol, order_price, id)
            WHERE order_type = 'LIMIT'
              AND side = 'SELL'
              AND order_status IN ('PENDING', 'PARTIALLY_FILLED')
            """;

    private final JdbcTemplate jdbcTemplate;

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initialize() {
        // 애플리케이션 기동 완료 후 인덱스 보장 처리
        jdbcTemplate.execute(CREATE_LIMIT_BUY_OPEN_MATCH_INDEX);
        jdbcTemplate.execute(CREATE_LIMIT_SELL_OPEN_MATCH_INDEX);

        log.info("Trade order matching indexes ensured");
    }
}
