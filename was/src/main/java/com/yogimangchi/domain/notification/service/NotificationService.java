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
import com.yogimangchi.domain.notification.dto.response.NotificationStatusResponseDto;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.entity.NotificationState;
import com.yogimangchi.domain.notification.enums.NotificationType;
import com.yogimangchi.domain.notification.repository.NotificationRepository;
import com.yogimangchi.domain.notification.repository.NotificationStateRepository;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.domain.spot.entity.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
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

    @Transactional(readOnly = true)
    public CursorResponseDto<NotificationResponseDto> getNotifications(
            Long memberId,
            NotificationSearchConditionDto condition
    ) {
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 다음 페이지 존재 여부를 확인하기 위해 size + 1건을 조회한다.
        int limitSize = condition.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<Notification> notifications = notificationRepository.findAllByReceiverIdWithCursor(
                memberId,
                condition.cursorId(),
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
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 벨 아이콘용 마지막 확인 기준 ID를 회원 상태 테이블에서 조회한다.
        Long lastCheckedNotificationId = notificationStateRepository.findByMemberId(memberId)
                .map(NotificationState::getLastCheckedNotificationId)
                .orElse(null);

        // 마지막 확인 기준 이후 새 알림 수를 계산한다.
        long newCount = lastCheckedNotificationId == null
                ? notificationRepository.countByReceiverId(memberId)
                : notificationRepository.countByReceiverIdAndIdGreaterThan(memberId, lastCheckedNotificationId);

        // 읽지 않은 알림 수를 별도로 계산한다.
        long unreadCount = notificationRepository.countByReceiverIdAndIsReadFalse(memberId);

        return NotificationStatusResponseDto.of(newCount, unreadCount);
    }

    @Transactional
    public void checkNotifications(Long memberId) {
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 회원이 보유한 가장 최신 알림 ID를 확인 기준으로 사용한다.
        Long latestNotificationId = notificationRepository.findLatestNotificationIdByReceiverId(memberId);
        if (latestNotificationId == null) {
            return;
        }

        // 상태 row가 이미 있으면 최신 알림 ID만 갱신한다.
        int updated = notificationStateRepository.updateLastCheckedNotificationIdIfGreater(memberId, latestNotificationId);
        if (updated > 0) {
            return;
        }

        Member member = memberRepository.findActiveById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않거나 탈퇴한 회원입니다."));

        NotificationState notificationState = NotificationState.create(member);
        notificationState.checkLatest(latestNotificationId);

        try {
            // 상태 row가 없을 때만 새로 생성한다.
            notificationStateRepository.saveAndFlush(notificationState);
        } catch (DataIntegrityViolationException exception) {
            // 동시 insert 충돌 시 이미 생성된 row를 기준으로 다시 갱신한다.
            notificationStateRepository.updateLastCheckedNotificationIdIfGreater(memberId, latestNotificationId);
        }
    }

    @Transactional
    public void markAsRead(Long memberId, Long notificationId) {
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        Notification notification = notificationRepository.findByIdAndReceiverId(notificationId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        notification.markAsRead(LocalDateTime.now());
    }

    @Transactional
    public void markAllAsRead(Long memberId, NotificationReadRequestDto request) {
        if (memberId == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        List<Notification> notifications = notificationRepository.findAllByIdInAndReceiverId(
                request.notificationIds(),
                memberId
        );

        LocalDateTime readAt = LocalDateTime.now();
        notifications.forEach(notification -> notification.markAsRead(readAt));
    }

    public void notifyOrderCompleted(Member receiver, AssetType assetType, Order order) {
        if (receiver == null || receiver.getId() == null || order == null || order.getId() == null) {
            log.warn("주문 체결 알림 생성을 생략했습니다. receiver={}, order={}", receiver, order);
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
            throw new IllegalStateException("알림 저장 결과를 생성할 수 없습니다.");
        }

        notificationSseService.sendNotification(receiverId, response);
    }

    private String serializePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("알림 payload 직렬화에 실패했습니다.", exception);
        }
    }

    private String resolveAssetTypeDisplayName(AssetType assetType) {
        // 알림 문구와 payload 표시에 사용할 지갑 타입 표시명
        return switch (assetType) {
            case MOCK -> "(모의투자)";
            case TRADE_SPOT -> "(트레이드-현물)";
            case TRADE_FUTURE -> "(트레이드-선물)";
            case CONTEST -> "(대회)";
        };
    }
}
