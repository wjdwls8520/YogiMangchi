package com.yogimangchi.domain.futures.index;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
// 강제청산 매칭용 부분 인덱스 초기화 컴포넌트
// FuturesOrderIndexInitializer 와 동일 패턴 — ApplicationReadyEvent 시점에 보장
public class FuturesPositionLiquidationIndexInitializer {

    // LONG 청산 매칭용 부분 인덱스
    // 가격이 떨어져 청산가 이하로 내려갈 때 트리거되는 LONG OPEN 포지션 시크용
    // (symbol equality + liquidation_price range scan)
    private static final String CREATE_LONG_LIQUIDATION_MATCH_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_futures_position_long_liquidation_match
            ON futures_position (symbol, liquidation_price, id)
            WHERE position_status = 'OPEN'
              AND position_side = 'LONG'
            """;

    // SHORT 청산 매칭용 부분 인덱스
    // 가격이 올라가 청산가 이상으로 올라갈 때 트리거되는 SHORT OPEN 포지션 시크용
    private static final String CREATE_SHORT_LIQUIDATION_MATCH_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_futures_position_short_liquidation_match
            ON futures_position (symbol, liquidation_price, id)
            WHERE position_status = 'OPEN'
              AND position_side = 'SHORT'
            """;

    private final JdbcTemplate jdbcTemplate;

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initialize() {
        // 애플리케이션 기동 완료 후 인덱스 보장 처리 (IF NOT EXISTS 로 멱등성 확보)
        jdbcTemplate.execute(CREATE_LONG_LIQUIDATION_MATCH_INDEX);
        jdbcTemplate.execute(CREATE_SHORT_LIQUIDATION_MATCH_INDEX);

        log.info("Futures position liquidation partial indexes ensured");
    }
}
