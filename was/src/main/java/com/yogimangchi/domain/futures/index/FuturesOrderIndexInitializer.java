package com.yogimangchi.domain.futures.index;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
// 지정가 선물 주문 체결 매칭용 부분 인덱스 초기화 컴포넌트
// 현물 SpotOrderIndexInitializer 와 동일 패턴 — ApplicationReadyEvent 시점에 보장
public class FuturesOrderIndexInitializer {

    // 하한 트리거 부분 인덱스 — LONG OPEN ∪ SHORT CLOSE 매칭용
    // 가격이 minPrice 까지 내려왔을 때 체결 후보 (orderPrice >= minPrice) 를 인덱스 시크로 추출
    private static final String CREATE_LIMIT_LOWER_TRIGGER_MATCH_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_futures_order_limit_lower_trigger_match
            ON futures_order (symbol, order_price, id)
            WHERE order_type = 'LIMIT'
              AND order_status = 'PENDING'
              AND ((position_side = 'LONG' AND position_action = 'OPEN')
                OR (position_side = 'SHORT' AND position_action = 'CLOSE'))
            """;

    // 상한 트리거 부분 인덱스 — SHORT OPEN ∪ LONG CLOSE 매칭용
    // 가격이 maxPrice 까지 올라왔을 때 체결 후보 (orderPrice <= maxPrice) 를 인덱스 시크로 추출
    private static final String CREATE_LIMIT_UPPER_TRIGGER_MATCH_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_futures_order_limit_upper_trigger_match
            ON futures_order (symbol, order_price, id)
            WHERE order_type = 'LIMIT'
              AND order_status = 'PENDING'
              AND ((position_side = 'SHORT' AND position_action = 'OPEN')
                OR (position_side = 'LONG' AND position_action = 'CLOSE'))
            """;

    private final JdbcTemplate jdbcTemplate;

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initialize() {
        // 애플리케이션 기동 완료 후 인덱스 보장 처리 (IF NOT EXISTS 로 멱등성 확보)
        jdbcTemplate.execute(CREATE_LIMIT_LOWER_TRIGGER_MATCH_INDEX);
        jdbcTemplate.execute(CREATE_LIMIT_UPPER_TRIGGER_MATCH_INDEX);

        log.info("Futures order matching partial indexes ensured");
    }
}
