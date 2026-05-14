package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.repository.AdminContestSeasonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 대회 시즌 자동 정산 스케줄러
 *
 * <p>역할: contestEndAt 이 지난 미정산 시즌을 주기적으로 탐색하고 AdminContestService 의
 * 시스템 진입점({@link AdminContestService#settleContestSeasonBySystem(Long)})을 호출해
 * Phase 1(가격 스냅샷) → Phase 2a(포지션 청산) → Phase 2b(지갑 비활성화) → Phase 3(markSettled)
 * 전체 흐름을 자동 트리거한다.</p>
 *
 * <h3>설계 원칙</h3>
 * <ul>
 *   <li><b>폴링 방식</b> — 60초 주기로 종료된 미정산 시즌을 조회. 서버 재시작 시 누락 시즌이 자연 회복됨.</li>
 *   <li><b>장애 격리</b> — 한 시즌 정산 실패가 같은 틱의 다른 시즌 처리를 막지 않도록 시즌마다 try-catch.</li>
 *   <li><b>멱등 위임</b> — 중복 호출/재시도 안전성은 AdminContestService 의 doSettleContestSeason 가드에 위임.
 *       이 스케줄러는 "트리거"만 담당.</li>
 *   <li><b>단일 인스턴스 가정</b> — 다중 인스턴스 배포 시 ShedLock 등 분산 락 도입 필요.</li>
 * </ul>
 *
 * <h3>왜 @Scheduled 인가</h3>
 * <p>FuturesLimitOrderScheduler 처럼 동적 시작/중지가 필요한 경우엔 ScheduledExecutorService 가 적합하지만,
 * 정산 폴링은 "항상 켜둠" 만으로 충분하므로 가장 단순한 @Scheduled 사용.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ContestSettlementScheduler {

    // 폴링 주기 — 60초마다 종료된 미정산 시즌을 탐색
    // contestEndAt 시각 대비 최대 60초 지연으로 자동 정산 트리거됨
    private static final long POLLING_INTERVAL_MILLIS = 60_000L;

    private final AdminContestSeasonRepository adminContestSeasonRepository;
    private final AdminContestService adminContestService;

    /**
     * 주기적으로 종료된 미정산 시즌을 자동 정산.
     *
     * <p>fixedDelay 를 사용해 이전 실행 완료 시점 기준으로 다음 실행을 예약 → 정산 작업이 길어져도
     * 동일 시즌에 대한 중복 실행을 자연 회피. (멱등 가드가 있어도 자원 낭비를 줄임)</p>
     *
     * <p>한 틱에서 처리할 시즌이 여러 개여도 시즌 단위로 직렬 처리. 각 시즌의 정산이 청크 + REQUIRES_NEW 로
     * 내부적으로 부하 분산되어 있어 직렬 처리로도 충분.</p>
     */
    @Scheduled(fixedDelay = POLLING_INTERVAL_MILLIS)
    public void autoSettleEndedSeasons() {
        LocalDateTime now = LocalDateTime.now();

        // 종료 시각이 지났고 아직 정산되지 않은 시즌 조회
        List<ContestSeason> targets = adminContestSeasonRepository.findSeasonsToAutoSettle(now);

        if (targets.isEmpty()) {
            // 정상 케이스 — 처리 대상 없음. 로그 없이 조용히 반환 (1분마다 찍히면 노이즈)
            return;
        }

        log.info("[자동 정산 스케줄러] 처리 대상 시즌 발견 — count={}, ids={}",
                targets.size(),
                targets.stream().map(ContestSeason::getId).toList());

        // 시즌마다 try-catch 로 격리 — 한 시즌 실패가 다른 시즌을 막지 않도록
        for (ContestSeason season : targets) {
            try {
                adminContestService.settleContestSeasonBySystem(season.getId());
            } catch (Exception e) {
                // 실패 시 다음 폴링 틱에서 자연 재시도 (멱등 가드로 안전)
                // 운영자가 수동 정산 버튼으로 즉시 우회 가능
                log.error("[자동 정산 스케줄러] 시즌 정산 실패 — seasonId={}, title={}",
                        season.getId(), season.getTitle(), e);
            }
        }
    }
}
