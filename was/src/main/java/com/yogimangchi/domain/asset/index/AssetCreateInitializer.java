package com.yogimangchi.domain.asset.index;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
// 자산 관련 partial unique index를 애플리케이션 시작 시 보장하는 초기화 컴포넌트
public class AssetCreateInitializer {

    // 회원당 동시에 ACTIVE 상태인 MOCK 지갑은 1개만 허용한다.
    private static final String CREATE_MOCK_ACTIVE_WALLET_UNIQUE_INDEX = """
        CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_mock_active_member
        ON assets (member_id)
        WHERE asset_type = 'MOCK' AND status = 'ACTIVE'
    """;

    // 대회 지갑은 같은 회원/같은 시즌 조합으로 1개만 허용한다.
    private static final String CREATE_CONTEST_WALLET_UNIQUE_INDEX = """
        CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_contest_member_season
        ON assets (member_id, contest_season_id)
        WHERE asset_type = 'CONTEST'
    """;

    private final JdbcTemplate jdbcTemplate;

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initialize() {
        // 기동 완료 후 인덱스를 보장해 동시 요청에서도 DB 레벨에서 중복 생성을 막는다.
        jdbcTemplate.execute(CREATE_MOCK_ACTIVE_WALLET_UNIQUE_INDEX);
        jdbcTemplate.execute(CREATE_CONTEST_WALLET_UNIQUE_INDEX);
        log.info("모의투자 ACTIVE 지갑 및 대회 지갑의 유니크 인덱스를 보장함.");
    }

}
