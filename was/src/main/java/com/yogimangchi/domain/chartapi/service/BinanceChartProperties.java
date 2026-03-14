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

    private String websocketUrl;
    private List<String> trackedSymbols = new ArrayList<>();
}
