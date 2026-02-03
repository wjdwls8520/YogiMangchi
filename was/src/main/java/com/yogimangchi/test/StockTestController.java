package com.yogimangchi.test;

import com.yogimangchi.client.kis.KisClient;
import com.yogimangchi.client.kis.dto.KisStockPriceResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class StockTestController {

    private final KisClient kisClient;

    @GetMapping("/stock")
    public KisStockPriceResponseDto.Output getSamsungPrice() {
        // 삼성전자 코드: 005930
        KisStockPriceResponseDto response = kisClient.getStockPrice("005930");

        // 전체 봉투에서 알맹이(Output)만 꺼내서 보여주기
        return response.getOutput();
    }
}