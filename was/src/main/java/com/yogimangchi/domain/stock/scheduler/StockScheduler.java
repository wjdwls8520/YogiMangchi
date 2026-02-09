package com.yogimangchi.domain.stock.scheduler;

import com.yogimangchi.client.kis.KisClient;
import com.yogimangchi.client.kis.dto.KisStockPriceResponseDto;
import com.yogimangchi.domain.stock.constant.MajorStock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockScheduler {
    private final KisClient kisClient;

    @Scheduled(fixedRate = 1000) // 1초마 실행
    public void collectMajorStockPrices() {
        for (MajorStock stock : MajorStock.values()) {
            try {
                // 1. 가격가져오기
                KisStockPriceResponseDto response = kisClient.getStockPrice(stock.getCode());

                log.info("📢 [Scheduler] {} 현재가: {} 원", stock.getName(), response.getOutput().getCurrentPrice());

                // 한투에 너무 자주 요청하지 않게 0.1초씩 딜레이
                Thread.sleep(100);
            } catch (Exception e) {
                // 하나가 실패해도 다음 종목은 계속 수집해야 함 (멈추지 마!)
                log.error("❌ {} 수집 실패: {}", stock.getName(), e.getMessage());
            }
        }
    }
}
