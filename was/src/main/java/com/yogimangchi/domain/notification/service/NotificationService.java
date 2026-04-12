package com.yogimangchi.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.notification.dto.payload.OrderCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.request.NotificationIdsRequestDto;
import com.yogimangchi.domain.notification.dto.request.NotificationSearchConditionDto;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.dto.response.NotificationStatusResponseDto;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.entity.NotificationState;
import com.yogimangchi.domain.notification.enums.NotificationCategory;
import com.yogimangchi.domain.notification.enums.NotificationType;
import com.yogimangchi.domain.notification.repository.NotificationRepository;
import com.yogimangchi.domain.notification.repository.NotificationStateRepository;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.domain.spot.entity.Order;
import com.yogimangchi.global.exception.notification.NotificationException;
import com.yogimangchi.global.support.MemberReader;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final MemberRepository memberRepository;
    private final MarketSymbolRepository marketSymbolRepository;
    private final NotificationStateRepository notificationStateRepository;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;
    private final MemberReader memberReader;

    @Transactional(readOnly = true)
    public CursorResponseDto<NotificationResponseDto> getNotifications(
            Long memberId,
            NotificationSearchConditionDto condition
    ) {
        memberReader.getAuthenticated(memberId);

        // 다음 페이지 존재 여부까지 함께 판단하기 위해 size + 1개를 조회한다.
        int limitSize = condition.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<Notification> notifications = notificationRepository.findAllByReceiverIdWithCursor(
                memberId,
                condition.cursorId(),
                condition.category(),
                condition.read(),
                pageable
        );

        boolean hasNext = notifications.size() > limitSize;
        List<Notification> pageItems = hasNext
                ? new ArrayList<>(notifications.subList(0, limitSize))
                : notifications;

        Long nextCursorId = hasNext && !pageItems.isEmpty()
                ? pageItems.get(pageItems.size() - 1).getId()
                : null;

        List<NotificationResponseDto> content = pageItems.stream()
                .map(notification -> NotificationResponseDto.from(notification, objectMapper))
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public NotificationStatusResponseDto getStatus(Long memberId) {
        memberReader.getAuthenticated(memberId);

        // 벨 아이콘의 마지막 확인 기준은 NotificationState에서 관리한다.
        Long lastCheckedNotificationId = notificationStateRepository.findByMemberId(memberId)
                .map(NotificationState::getLastCheckedNotificationId)
                .orElse(null);

        long newCount = lastCheckedNotificationId == null
                ? notificationRepository.countByReceiverId(memberId)
                : notificationRepository.countByReceiverIdAndIdGreaterThan(memberId, lastCheckedNotificationId);

        long unreadCount = notificationRepository.countByReceiverIdAndIsReadFalse(memberId);

        return NotificationStatusResponseDto.of(newCount, unreadCount);
    }

    @Transactional
    public void checkNotifications(Long memberId) {
        memberReader.getAuthenticated(memberId);

        // 현재 회원이 가진 가장 최신 알림 ID를 확인 기준으로 사용한다.
        Long latestNotificationId = notificationRepository.findLatestNotificationIdByReceiverId(memberId);
        if (latestNotificationId == null) {
            return;
        }

        // member_id 유니크 제약을 기준으로 동시에 check가 들어와도 한 번에 처리한다.
        notificationStateRepository.upsertLastCheckedNotificationId(memberId, latestNotificationId);
    }

    @Transactional
    public void markAsRead(Long memberId, Long notificationId) {
        memberReader.getAuthenticated(memberId);

        Notification notification = notificationRepository.findByIdAndReceiverId(notificationId, memberId)
                .orElseThrow(NotificationException::notificationNotFound);

        notification.markAsRead(LocalDateTime.now());
    }

    @Transactional
    public void markAllAsRead(Long memberId, NotificationIdsRequestDto request) {
        memberReader.getAuthenticated(memberId);

        LocalDateTime readAt = LocalDateTime.now();
        notificationRepository.markAllAsReadByIdsAndReceiverId(
                request.notificationIds(),
                memberId,
                readAt
        );
    }

    @Transactional
    public void markReadAll(Long memberId) {
        memberReader.getAuthenticated(memberId);

        notificationRepository.markAllAsReadByReceiverId(memberId, LocalDateTime.now());
    }

    @Transactional
    public void deleteReadNotifications(Long memberId) {
        memberReader.getAuthenticated(memberId);

        notificationRepository.deleteAllReadByReceiverId(memberId);
    }

    @Transactional
    public void deleteNotification(Long memberId, Long notificationId) {
        memberReader.getAuthenticated(memberId);

        int deletedCount = notificationRepository.deleteByIdAndReceiverId(notificationId, memberId);
        if (deletedCount == 0) {
            throw NotificationException.notificationNotFound();
        }
    }

    @Transactional
    public void deleteNotifications(Long memberId, NotificationIdsRequestDto request) {
        memberReader.getAuthenticated(memberId);

        notificationRepository.deleteAllByIdsAndReceiverId(request.notificationIds(), memberId);
    }

    public void notifyOrderCompleted(Member receiver, AssetType assetType, Order order) {
        if (receiver == null || receiver.getId() == null || order == null || order.getId() == null) {
            log.warn("주문 체결 알림 생성을 건너뜁니다. receiver={}, order={}", receiver, order);
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

        log.info("주문 체결 알림 예약. receiverId={}, orderId={}, assetType={}, symbol={}",
                receiverId, orderId, assetType, symbol);

        Runnable notificationTask = () -> {
            try {
                log.info("주문 체결 알림 처리 시작. receiverId={}, orderId={}", receiverId, orderId);
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
                log.error("주문 체결 알림 처리 중 예외가 발생했습니다. receiverId={}, orderId={}",
                        receiverId, orderId, exception);
            }
        };

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

        notificationTask.run();
    }

    private void saveAndSendOrderCompleted(
            Long receiverId,
            AssetType assetType,
            Long orderId,
            String symbol,
            String orderType,
            String side,
            BigDecimal price,
            BigDecimal quantity,
            BigDecimal executedAmount,
            BigDecimal totalFee,
            LocalDateTime executedAt
    ) {
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("주문 체결 알림 수신 회원을 찾을 수 없습니다. receiverId={}, orderId={}", receiverId, orderId);
            return;
        }

        log.info("주문 체결 알림 수신 회원 확인 완료. receiverId={}, orderId={}", receiverId, orderId);

        String displayNameKr = marketSymbolRepository.findById(symbol)
                .map(MarketSymbol::getDisplayNameKr)
                .orElse(symbol);

        log.info("주문 체결 알림 심볼 정보 확인 완료. orderId={}, symbol={}, displayNameKr={}",
                orderId, symbol, displayNameKr);

        String assetTypeDisplayName = resolveAssetTypeDisplayName(assetType);
        NotificationCategory notificationCategory = resolveNotificationCategory(assetType);
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

        log.info("주문 체결 알림 payload 생성 완료. orderId={}, assetTypeDisplayName={}",
                orderId, assetTypeDisplayName);

        saveAndSend(
                Notification.create(
                        notificationReceiver,
                        null,
                        notificationCategory,
                        NotificationType.ORDER_COMPLETED,
                        assetTypeDisplayName + " " + displayNameKr + " " + orderTypeName + " " + sideName + " 주문이 체결되었습니다.",
                        "/spot/mock/orders/" + orderId,
                        serializePayload(payload)
                )
        );
    }

    private void saveAndSend(Notification notification) {
        Long receiverId = notification.getReceiver().getId();
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        // 주문 트랜잭션과 분리된 새 트랜잭션에서 알림을 저장한다.
        NotificationResponseDto response = transactionTemplate.execute(status -> {
            log.info("알림 저장 시작. receiverId={}, type={}, message={}",
                    receiverId, notification.getType(), notification.getMessage());

            Notification savedNotification = notificationRepository.saveAndFlush(notification);

            log.info("알림 저장 완료. notificationId={}, receiverId={}",
                    savedNotification.getId(), receiverId);

            return NotificationResponseDto.from(savedNotification, objectMapper);
        });

        if (response == null) {
            throw NotificationException.notificationResponseCreationFailed();
        }

        notificationSseService.sendNotification(receiverId, response);
    }

    private String serializePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw NotificationException.notificationPayloadSerializationFailed(exception);
        }
    }

    private String resolveAssetTypeDisplayName(AssetType assetType) {
        // 알림 문구와 payload에서 함께 사용할 지갑 표시명이다.
        return switch (assetType) {
            case MOCK -> "(모의투자)";
            case TRADE_SPOT -> "(트레이딩-현물)";
            case TRADE_FUTURE -> "(트레이딩-선물)";
            case CONTEST -> "(대회)";
        };
    }

    private NotificationCategory resolveNotificationCategory(AssetType assetType) {
        // 지갑 유형을 알림 탭 카테고리로 매핑한다.
        return switch (assetType) {
            case MOCK -> NotificationCategory.MOCK;
            case TRADE_SPOT, TRADE_FUTURE -> NotificationCategory.TRADE;
            case CONTEST -> NotificationCategory.CONTEST;
        };
    }
}
