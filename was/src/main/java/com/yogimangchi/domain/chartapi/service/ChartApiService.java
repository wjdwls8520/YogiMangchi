package com.yogimangchi.domain.chartapi.service;

import com.yogimangchi.domain.chartapi.dto.CandleDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChartApiService {

    @Qualifier("binanceWebClient")
    final private WebClient webClient;

    /**
     * 바이낸스에서 과거 캔들 데이터를 가져와 CandleDto 리스트로 변환합니다.
     */
    public List<CandleDto> getPastCandles(String symbol, String interval, int limit) {

        // 1. WebClient로 바이낸스 REST API 호출 (비동기 객체를 block()으로 동기 처리)
        Object[][] response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v3/klines")
                        .queryParam("symbol", symbol.toUpperCase())
                        .queryParam("interval", interval)
                        .queryParam("limit", limit)
                        .build())
                .retrieve()  // 통신 시작 명령어
                .bodyToMono(Object[][].class)
                .block(); // 프론트에서 바로 값을 받아야하기에 동기로 진행

        // 2. 응답이 없거나 비어있으면 빈 리스트 반환
        if (response == null || response.length == 0) {
            return List.of();
        }

        // 3. 바이낸스의 2차원 배열 데이터를 CandleDto로 매핑
        return Arrays.stream(response)
                .map(candleData -> CandleDto.builder()
                        .time(Long.parseLong(candleData[0].toString()))
                        .open(Double.parseDouble(candleData[1].toString()))
                        .high(Double.parseDouble(candleData[2].toString()))
                        .low(Double.parseDouble(candleData[3].toString()))
                        .close(Double.parseDouble(candleData[4].toString()))
                        .volume(Double.parseDouble(candleData[5].toString()))
                        .build())
                .collect(Collectors.toList());
    }
}
