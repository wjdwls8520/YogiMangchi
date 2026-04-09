package com.yogimangchi.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.notification.dto.payload.OrderCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.request.NotificationReadRequestDto;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final MarketSymbolRepository marketSymbolRepository;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

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

    @Transactional
    public void markAsRead(Long memberId, Long notificationId) {
        // 로그인 회원 검증 로직
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 본인 알림 단건 조회 로직
        Notification notification = notificationRepository.findByIdAndReceiverId(notificationId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("읽음 처리할 알림을 찾을 수 없습니다."));

        // 알림 단건 읽음 처리 로직
        notification.markAsRead(LocalDateTime.now());
    }

    @Transactional
    public void markAllAsRead(Long memberId, NotificationReadRequestDto request) {
        // 로그인 회원 검증 로직
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 중복 요청 ID 제거 로직
        Set<Long> notificationIds = new LinkedHashSet<>(request.notificationIds());

        // 본인 알림 다건 조회 로직
        List<Notification> notifications = notificationRepository.findAllByIdInAndReceiverId(
                List.copyOf(notificationIds),
                memberId
        );

        if (notifications.isEmpty()) {
            return;
        }

        LocalDateTime readAt = LocalDateTime.now();

        // 현재 화면에 노출된 알림 다건 읽음 처리 로직
        notifications.forEach(notification -> notification.markAsRead(readAt));
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
        List<Notification> notifications;

        if (scope == NotificationScope.TODAY) {
            // 오늘 탭 날짜 범위 계산 로직
            LocalDate today = LocalDate.now();
            LocalDateTime startDateTime = today.atStartOfDay();
            LocalDateTime endDateTime = today.plusDays(1).atStartOfDay();

            // 오늘 알림 목록 조회 로직
            notifications = notificationRepository.findAllTodayByReceiverIdWithCursor(
                    memberId,
                    condition.cursorId(),
                    condition.read(),
                    startDateTime,
                    endDateTime,
                    pageable
            );
        } else {
            // 전체 알림 목록 조회 로직
            notifications = notificationRepository.findAllByReceiverIdWithCursor(
                    memberId,
                    condition.cursorId(),
                    condition.read(),
                    pageable
            );
        }

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

        // 주문 체결 알림 후처리 예약 로직
        log.info("주문 체결 알림 예약. receiverId={}, orderId={}, assetType={}, symbol={}",
                receiverId, orderId, assetType, symbol);

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
        // 알림 수신 회원 재조회 시작 로그
        log.info("주문 체결 알림 처리 시작. receiverId={}, orderId={}", receiverId, orderId);

        // 알림 수신 회원 재조회 로직
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("주문 체결 알림 수신 회원을 찾을 수 없습니다. receiverId={}, orderId={}", receiverId, orderId);
            return;
        }

        // 코인 한글명 조회 시작 로그
        log.info("주문 체결 알림 수신 회원 확인 완료. receiverId={}, orderId={}", receiverId, orderId);

        // 코인 한글명 조회 및 기본값 대체 로직
        String displayNameKr = marketSymbolRepository.findById(symbol)
                .map(MarketSymbol::getDisplayNameKr)
                .orElse(symbol);

        // 코인 한글명 조회 완료 로그
        log.info("주문 체결 알림 심볼 정보 확인 완료. orderId={}, symbol={}, displayNameKr={}",
                orderId, symbol, displayNameKr);

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

        // payload 직렬화 직전 로그
        log.info("주문 체결 알림 payload 생성 완료. orderId={}, assetTypeDisplayName={}",
                orderId, assetTypeDisplayName);

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
        // 알림 저장 시작 로그
        log.info("알림 저장 시작. receiverId={}, type={}, message={}",
                notification.getReceiver().getId(), notification.getType(), notification.getMessage());

        // afterCommit 이후 새 트랜잭션 분리 저장 로직
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        NotificationResponseDto response = transactionTemplate.execute(status -> {
            Notification savedNotification = notificationRepository.saveAndFlush(notification);

            // 알림 저장 완료 로그
            log.info("알림 저장 완료. notificationId={}, receiverId={}",
                    savedNotification.getId(), savedNotification.getReceiver().getId());

            return NotificationResponseDto.from(savedNotification, objectMapper);
        });

        if (response == null) {
            throw new IllegalStateException("알림 저장 결과를 생성할 수 없습니다.");
        }

        notificationSseService.sendNotification(
                notification.getReceiver().getId(),
                response
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
