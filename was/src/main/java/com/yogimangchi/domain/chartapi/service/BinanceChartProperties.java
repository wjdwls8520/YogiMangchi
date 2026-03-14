package com.yogimangchi.domain.chartapi.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "binance")
public class BinanceChartProperties {

    // 바이낸스 공개 웹소켓 서버 주소
    private String websocketUrl;

    // 우리가 추적할 종목 목록
    private List<String> trackedSymbols = new ArrayList<>();
}
