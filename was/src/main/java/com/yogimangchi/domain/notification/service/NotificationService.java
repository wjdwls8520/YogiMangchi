package com.yogimangchi.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.notification.dto.payload.OrderCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.request.NotificationSearchConditionDto;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.dto.response.NotificationUnreadCountResponseDto;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.enums.NotificationScope;
import com.yogimangchi.domain.notification.enums.NotificationType;
import com.yogimangchi.domain.notification.repository.NotificationRepository;
import com.yogimangchi.domain.trade.entity.Order;
import com.yogimangchi.global.dto.CursorResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final MarketSymbolRepository marketSymbolRepository;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public NotificationUnreadCountResponseDto getUnreadCount(Long memberId) {
        // 로그인 회원 검증 로직
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 읽지 않은 알림 개수 조회 로직
        long unreadCount = notificationRepository.countByReceiverIdAndIsReadFalse(memberId);
        return NotificationUnreadCountResponseDto.from(unreadCount);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<NotificationResponseDto> getNotifications(Long memberId, NotificationSearchConditionDto condition) {
        // 로그인 회원 검증 로직
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        int limitSize = condition.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);
        NotificationScope scope = condition.scope() == null ? NotificationScope.ALL : condition.scope();
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;

        if (scope == NotificationScope.TODAY) {
            // 오늘 탭 조회 범위 계산 로직
            LocalDate today = LocalDate.now();
            startDateTime = today.atStartOfDay();
            endDateTime = today.plusDays(1).atStartOfDay();
        }

        // 회원 기준 커서/읽음/범위 조건 알림 목록 조회 로직
        List<Notification> notifications = notificationRepository.findAllByReceiverIdWithCursor(
                memberId,
                condition.cursorId(),
                condition.read(),
                startDateTime,
                endDateTime,
                pageable
        );

        if (notifications.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = notifications.size() > limitSize;
        if (hasNext) {
            notifications = notifications.subList(0, limitSize);
        }

        Long nextCursorId = notifications.get(notifications.size() - 1).getId();
        List<NotificationResponseDto> content = notifications.stream()
                .map(notification -> NotificationResponseDto.from(notification, objectMapper))
                .toList();

        return new CursorResponseDto<>(content, hasNext ? nextCursorId : null, hasNext);
    }

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

        // 지갑 타입 한글명 변환 로직
        String assetTypeDisplayName = switch (assetType) {
            case MOCK -> "(모의투자)";
            case TRADE_SPOT -> "(트레이딩-현물)";
            case TRADE_FUTURE -> "(트레이딩-선물)";
            case CONTEST -> "(대회)";
        };

        String orderTypeName = "MARKET".equalsIgnoreCase(orderType) ? "시장가" : "지정가";
        String sideName = "BUY".equalsIgnoreCase(side) ? "매수" : "매도";

        OrderCompletedNotificationPayload payload = new OrderCompletedNotificationPayload(
                orderId,
                assetType,
                assetTypeDisplayName,
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
                        assetTypeDisplayName + " " + displayNameKr + " " + orderTypeName + " " + sideName + " 주문이 체결되었습니다.",
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
