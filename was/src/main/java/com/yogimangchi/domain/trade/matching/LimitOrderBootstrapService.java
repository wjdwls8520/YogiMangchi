package com.yogimangchi.domain.trade.matching;

import com.yogimangchi.domain.trade.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
// 열린 지정가 주문 심볼 초기 복구 컴포넌트
public class LimitOrderBootstrapService {

    private final OrderRepository orderRepository;
    private final LimitOrderSignalRegistry signalRegistry;

    // 서버 재기동 시 열린 지정가 주문 심볼 복구
    public void loadOpenSymbols() {
        orderRepository.findDistinctOpenLimitSymbols()
                .forEach(signalRegistry::registerOpenSymbol);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        // 애플리케이션 준비 완료 후 초기 복구 실행
        loadOpenSymbols();
    }
}
