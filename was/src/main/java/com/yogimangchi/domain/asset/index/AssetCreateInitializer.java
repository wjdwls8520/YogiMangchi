package com.yogimangchi.domain.asset.index;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AssetCreateInitializer {

    private static final String CREATE_CONTEST_WALLET_UNIQUE_INDEX = """
        CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_contest_member_season
        ON assets (member_id, contest_season_id)
        WHERE asset_type = 'CONTEST'
    """;

    private final JdbcTemplate jdbcTemplate;

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initialize() {
        jdbcTemplate.execute(CREATE_CONTEST_WALLET_UNIQUE_INDEX);
        log.info("대회 지갑의 유니크 인덱스를 보장함.");
    }

}
