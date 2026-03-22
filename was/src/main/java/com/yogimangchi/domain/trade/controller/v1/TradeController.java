package com.yogimangchi.domain.trade.controller.v1;

import com.yogimangchi.domain.trade.service.TradeHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trade")
@RequiredArgsConstructor
public class TradeController {

    private final TradeHistoryService tradeHistoryService;
}
