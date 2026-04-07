package com.yogimangchi.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.notification.dto.payload.OrderCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.enums.NotificationType;
import com.yogimangchi.domain.notification.repository.NotificationRepository;
import com.yogimangchi.domain.trade.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final MarketSymbolRepository marketSymbolRepository;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;

    public void notifyOrderCompleted(Member receiver, AssetType assetType, Order order) {
        // 잘못된 알림 생성 요청 방어 로직
        if (receiver == null || receiver.getId() == null || order == null || order.getId() == null) {
            log.warn("주문 체결 알림 생성이 생략되었습니다. receiver={}, order={}", receiver, order);
            return;
        }

        Long receiverId = receiver.getId();
        Long orderId = order.getId();
        String symbol = order.getSymbol();
        String orderType = order.getOrderType();
        String side = order.getSide();
        BigDecimal price = order.getAvgFilledPrice();
        BigDecimal quantity = order.getFilledQuantity();
        BigDecimal executedAmount = order.getExecutedAmount();
        BigDecimal totalFee = order.getTotalFee();
        LocalDateTime executedAt = order.getExecutedAt();

        Runnable notificationTask = () -> {
            try {
                saveAndSendOrderCompleted(
                        receiverId,
                        assetType,
                        orderId,
                        symbol,
                        orderType,
                        side,
                        price,
                        quantity,
                        executedAmount,
                        totalFee,
                        executedAt
                );
            } catch (Exception exception) {
                log.error("주문 체결 알림 처리 중 예외 발생. receiverId={}, orderId={}", receiverId, orderId, exception);
            }
        };

        // 거래 커밋 이후 알림 저장 및 전송 보장 로직
        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    notificationTask.run();
                }
            });
            return;
        }

        // 별도 트랜잭션 없이 호출된 경우 즉시 알림 처리 로직
        notificationTask.run();
    }

    private void saveAndSendOrderCompleted(Long receiverId, AssetType assetType, Long orderId, String symbol,
                                           String orderType, String side, BigDecimal price, BigDecimal quantity,
                                           BigDecimal executedAmount, BigDecimal totalFee, LocalDateTime executedAt) {
        // 알림 수신 회원 재조회 로직
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("주문 체결 알림 수신 회원을 찾을 수 없습니다. receiverId={}, orderId={}", receiverId, orderId);
            return;
        }

        // 코인 한글명 조회 및 기본값 대체 로직
        String displayNameKr = marketSymbolRepository.findById(symbol)
                .map(MarketSymbol::getDisplayNameKr)
                .orElse(symbol);

        String orderTypeName = "MARKET".equalsIgnoreCase(orderType) ? "시장가" : "지정가";
        String sideName = "BUY".equalsIgnoreCase(side) ? "매수" : "매도";

        OrderCompletedNotificationPayload payload = new OrderCompletedNotificationPayload(
                orderId,
                assetType,
                symbol,
                displayNameKr,
                orderType,
                side,
                price,
                quantity,
                executedAmount,
                totalFee,
                executedAt
        );

        // 주문 체결 알림 저장 및 실시간 전송 로직
        saveAndSend(
                Notification.create(
                        notificationReceiver,
                        null,
                        NotificationType.ORDER_COMPLETED,
                        displayNameKr + " " + orderTypeName + " " + sideName + " 주문이 체결되었습니다.",
                        "/trade/orders/" + orderId,
                        serializePayload(payload)
                )
        );
    }

    private void saveAndSend(Notification notification) {
        Notification savedNotification = notificationRepository.save(notification);
        notificationSseService.sendNotification(
                savedNotification.getReceiver().getId(),
                NotificationResponseDto.from(savedNotification, objectMapper)
        );
    }

    private String serializePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("알림 payload 직렬화에 실패했습니다.", exception);
        }
    }
}
