package com.yogimangchi.domain.futures.index;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FuturesPositionCreateInitializer {

    private static final String CREATE_FUTURES_POSITION_OPEN_UNIQUE_INDEX = """
          CREATE UNIQUE INDEX IF NOT EXISTS ux_futures_position_open
          ON futures_position (assets_id, symbol, position_side)                                                                                                                 
          WHERE position_status = 'OPEN'                                                                                                                                         
      """;

    private final JdbcTemplate jdbcTemplate;

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initialize() {
        jdbcTemplate.execute(CREATE_FUTURES_POSITION_OPEN_UNIQUE_INDEX);
        log.info("선물 포지션 OPEN 유니크 인덱스를 보장함.");
    }

}
