package com.yogimangchi.domain.market.service;

import com.yogimangchi.domain.market.dto.response.MarketSymbolResponseDto;
import com.yogimangchi.domain.market.enums.MarketType;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarketService {

    private final MarketSymbolRepository marketSymbolRepository;

    @Transactional(readOnly = true)
    public List<MarketSymbolResponseDto> getActiveSymbols(MarketType type) {
        // Repository에서 엔티티 리스트를 가져와서 DTO 리스트로 변환
        return marketSymbolRepository.findActiveSymbolsByType(type)
                .stream()
                .map(MarketSymbolResponseDto::from)
                .toList();
    }
    @Transactional(readOnly = true)
    public List<MarketSymbolResponseDto> getActiveFutures() {
        // Repository에서 엔티티 리스트를 가져와서 DTO 리스트로 변환
        return marketSymbolRepository.findActiveFuturesSymbolsByType();
    }
}