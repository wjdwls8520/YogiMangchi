package com.yogimangchi.domain.notification.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
// 알림 조회 성능 보강용 인덱스 초기화 컴포넌트
public class NotificationIndexInitializer {

    // 회원별 최신순 알림 목록 조회와 최신 알림 ID 조회를 위한 기본 인덱스
    private static final String CREATE_RECEIVER_ID_DESC_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_notification_receiver_id_desc
            ON notification (receiver_member_id, id DESC)
            """;

    // 회원별 읽음 여부 필터 조회와 읽음/삭제 벌크 처리 대상을 빠르게 찾기 위한 인덱스
    private static final String CREATE_RECEIVER_READ_ID_DESC_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_notification_receiver_read_id_desc
            ON notification (receiver_member_id, is_read, id DESC)
            """;

    // 회원별 카테고리 탭 최신순 조회를 위한 인덱스
    private static final String CREATE_RECEIVER_CATEGORY_ID_DESC_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_notification_receiver_category_id_desc
            ON notification (receiver_member_id, category, id DESC)
            """;

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void initialize() {
        // 애플리케이션 기동 완료 후 알림 인덱스를 보장하는 로직
        jdbcTemplate.execute(CREATE_RECEIVER_ID_DESC_INDEX);
        jdbcTemplate.execute(CREATE_RECEIVER_READ_ID_DESC_INDEX);
        jdbcTemplate.execute(CREATE_RECEIVER_CATEGORY_ID_DESC_INDEX);

        log.info("Notification indexes ensured");
    }
}
