package com.yogimangchi.client.kis;

import com.yogimangchi.client.kis.dto.KisStockPriceResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class KisClient {

    private final WebClient kisWebClient;   // 공용 트럭
    private final KisTokenManager kisTokenManager; // 토큰 관리자
    private final KisProperties kisProperties; // 앱키, 시크릿키

    // API 주소랑 ID는 상수로 관리 (오타 방지)
    private static final String TR_ID_CURRENT_PRICE = "FHKST01010100";
    private static final String URL_INQUIRE_PRICE = "/uapi/domestic-stock/v1/quotations/inquire-price";

    // 주식 현재가 조회 메서드
    public KisStockPriceResponseDto getStockPrice(String stockCode) {

        // 1. 토큰 꺼내오기 (Redis에서)
        String accessToken = kisTokenManager.getAccessToken();

        // 2. 한투 서버에 요청 쏘기
        return kisWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(URL_INQUIRE_PRICE)
                        .queryParam("FID_COND_MRKT_DIV_CODE", "J") // 시장 구분 (J: 주식)
                        .queryParam("FID_INPUT_ISCD", stockCode)   // 종목 코드 (예: 005930)
                        .build())
                .header("authorization", "Bearer " + accessToken)
                .header("appkey", kisProperties.appKey())
                .header("appsecret", kisProperties.appSecret())
                .header("tr_id", TR_ID_CURRENT_PRICE)
                .header("custtype", "P") // 개인 고객(P)
                .retrieve()
                .bodyToMono(KisStockPriceResponseDto.class) // 결과를 우리 DTO로 변신
                .block(); // 결과 올 때까지 기다림 (동기 방식)
    }
}