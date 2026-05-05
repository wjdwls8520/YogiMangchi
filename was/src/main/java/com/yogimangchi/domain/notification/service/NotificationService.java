package com.yogimangchi.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.community.dto.result.PostLikeCreatedResultDto;
import com.yogimangchi.domain.community.dto.result.ReplyCreatedResultDto;
import com.yogimangchi.domain.community.dto.result.ReplyLikeCreatedResultDto;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.dto.result.FollowCreatedResultDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.notification.dto.payload.FollowCreatedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.FuturesLiquidationCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.FuturesOrderCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.NotificationActorPreviewPayload;
import com.yogimangchi.domain.notification.dto.payload.OrderCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.PostCommentCreatedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.PostLikedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.ReplyCommentCreatedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.ReplyLikedNotificationPayload;
import com.yogimangchi.domain.notification.dto.request.NotificationIdsRequestDto;
import com.yogimangchi.domain.notification.dto.request.NotificationSearchConditionDto;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.dto.response.NotificationStatusResponseDto;
import com.yogimangchi.domain.notification.dto.result.NotificationDispatchResultDto;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.entity.NotificationGroupState;
import com.yogimangchi.domain.notification.entity.NotificationState;
import com.yogimangchi.domain.notification.enums.NotificationCategory;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import com.yogimangchi.domain.notification.repository.NotificationDedupeStateRepository;
import com.yogimangchi.domain.notification.repository.NotificationGroupStateRepository;
import com.yogimangchi.domain.notification.repository.NotificationRepository;
import com.yogimangchi.domain.notification.repository.NotificationStateRepository;
import com.yogimangchi.domain.notification.support.NotificationPreviewUtils;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.domain.spot.entity.Order;
import com.yogimangchi.global.exception.notification.NotificationException;
import com.yogimangchi.global.sse.enums.CommunitySseEventType;
import com.yogimangchi.global.sse.enums.TradeSseEventType;
import com.yogimangchi.global.support.MemberReader;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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

    private static final Duration FOLLOW_NOTIFICATION_COOLDOWN = Duration.ofDays(1);

    private final NotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final MemberRepository memberRepository;
    private final MarketSymbolRepository marketSymbolRepository;
    private final NotificationDedupeStateRepository notificationDedupeStateRepository;
    private final NotificationGroupStateRepository notificationGroupStateRepository;
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

        Long latestNotificationId = notificationRepository.findLatestNotificationIdByReceiverId(memberId);
        if (latestNotificationId == null) {
            return;
        }

        notificationStateRepository.upsertLastCheckedNotificationId(memberId, latestNotificationId);
        sendStatusAfterCommit(memberId);
    }

    @Transactional
    public void markAsRead(Long memberId, Long notificationId) {
        memberReader.getAuthenticated(memberId);

        Notification notification = notificationRepository.findByIdAndReceiverId(notificationId, memberId)
                .orElseThrow(NotificationException::notificationNotFound);

        notification.markAsRead(LocalDateTime.now());
        sendStatusAfterCommit(memberId);
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
        sendStatusAfterCommit(memberId);
    }

    @Transactional
    public void markReadAll(Long memberId) {
        memberReader.getAuthenticated(memberId);

        notificationRepository.markAllAsReadByReceiverId(memberId, LocalDateTime.now());
        sendStatusAfterCommit(memberId);
    }

    @Transactional
    public void deleteReadNotifications(Long memberId) {
        memberReader.getAuthenticated(memberId);

        // 묶음 그룹의 닫힘 기준은 read가 아니라 check다.
        // 따라서 삭제 대상도 "이미 확인까지 끝난 read 알림"으로 제한해 group 경계를 흔들지 않는다.
        Long lastCheckedNotificationId = notificationStateRepository.findByMemberId(memberId)
                .map(NotificationState::getLastCheckedNotificationId)
                .orElse(null);

        if (lastCheckedNotificationId == null) {
            return;
        }

        notificationGroupStateRepository.deleteAllReadCheckedGroupsByReceiverId(memberId, lastCheckedNotificationId);
        notificationRepository.deleteAllReadCheckedByReceiverId(memberId, lastCheckedNotificationId);
        sendStatusAfterCommit(memberId);
    }

    @Transactional
    public void deleteNotification(Long memberId, Long notificationId) {
        memberReader.getAuthenticated(memberId);

        notificationGroupStateRepository.deleteByNotificationIdAndReceiverId(notificationId, memberId);
        int deletedCount = notificationRepository.deleteByIdAndReceiverId(notificationId, memberId);
        if (deletedCount == 0) {
            throw NotificationException.notificationNotFound();
        }

        sendStatusAfterCommit(memberId);
    }

    @Transactional
    public void deleteNotifications(Long memberId, NotificationIdsRequestDto request) {
        memberReader.getAuthenticated(memberId);

        notificationGroupStateRepository.deleteAllByNotificationIdsAndReceiverId(request.notificationIds(), memberId);
        notificationRepository.deleteAllByIdsAndReceiverId(request.notificationIds(), memberId);
        sendStatusAfterCommit(memberId);
    }

    @Transactional
    public NotificationResponseDto createPostCommentNotification(Long receiverId, ReplyCreatedResultDto createdResult) {
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("게시글 댓글 알림 수신 회원을 찾을 수 없습니다. receiverId={}, replyId={}",
                    receiverId, createdResult.id());
            return null;
        }

        Member actor = memberRepository.getReferenceById(createdResult.memberId());

        PostCommentCreatedNotificationPayload payload = new PostCommentCreatedNotificationPayload(
                createdResult.postId(),
                createdResult.id(),
                createdResult.postTitle(),
                createdResult.memberId(),
                createdResult.nickname(),
                createdResult.profileImgUrl(),
                NotificationPreviewUtils.createReplyContentPreview(createdResult.content())
        );

        return saveNotification(Notification.create(
                notificationReceiver,
                actor,
                NotificationCategory.COMMUNITY,
                NotificationType.POST_COMMENT_CREATED,
                serializePayload(payload)
        ));
    }

    @Transactional
    public NotificationResponseDto createReplyCommentNotification(Long receiverId, ReplyCreatedResultDto createdResult) {
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("답글 알림 수신 회원을 찾을 수 없습니다. receiverId={}, replyId={}",
                    receiverId, createdResult.id());
            return null;
        }

        Member actor = memberRepository.getReferenceById(createdResult.memberId());

        ReplyCommentCreatedNotificationPayload payload = new ReplyCommentCreatedNotificationPayload(
                createdResult.postId(),
                createdResult.id(),
                createdResult.parentReplyId(),
                createdResult.targetReplyId(),
                createdResult.memberId(),
                createdResult.nickname(),
                createdResult.profileImgUrl(),
                NotificationPreviewUtils.createReplyContentPreview(createdResult.content())
        );

        return saveNotification(Notification.create(
                notificationReceiver,
                actor,
                NotificationCategory.COMMUNITY,
                NotificationType.REPLY_COMMENT_CREATED,
                serializePayload(payload)
        ));
    }

    @Transactional
    public NotificationDispatchResultDto createPostLikedNotification(PostLikeCreatedResultDto createdResult) {
        if (!createdResult.newLikeCreated()) {
            return null;
        }

        if (createdResult.receiverMemberId().equals(createdResult.actorMemberId())) {
            return null;
        }

        Member receiver = memberRepository.findActiveById(createdResult.receiverMemberId())
                .orElse(null);

        if (receiver == null) {
            log.warn("게시글 좋아요 알림 수신 회원을 찾을 수 없습니다. receiverId={}, postId={}",
                    createdResult.receiverMemberId(), createdResult.postId());
            return null;
        }

        Member actor = memberRepository.getReferenceById(createdResult.actorMemberId());

        return createGroupedLikeNotification(
                receiver,
                actor,
                NotificationType.POST_LIKED,
                NotificationTargetType.POST,
                createdResult.postId(),
                () -> createInitialPostLikedPayload(createdResult, actor),
                payloadJson -> createUpdatedPostLikedPayload(payloadJson, createdResult, actor)
        );
    }

    @Transactional
    public NotificationDispatchResultDto createReplyLikedNotification(ReplyLikeCreatedResultDto createdResult) {
        if (!createdResult.newLikeCreated()) {
            return null;
        }

        if (createdResult.receiverMemberId().equals(createdResult.actorMemberId())) {
            return null;
        }

        Member receiver = memberRepository.findActiveById(createdResult.receiverMemberId())
                .orElse(null);

        if (receiver == null) {
            log.warn("댓글 좋아요 알림 수신 회원을 찾을 수 없습니다. receiverId={}, replyId={}",
                    createdResult.receiverMemberId(), createdResult.replyId());
            return null;
        }

        Member actor = memberRepository.getReferenceById(createdResult.actorMemberId());

        return createGroupedLikeNotification(
                receiver,
                actor,
                NotificationType.REPLY_LIKED,
                NotificationTargetType.REPLY,
                createdResult.replyId(),
                () -> createInitialReplyLikedPayload(createdResult, actor),
                payloadJson -> createUpdatedReplyLikedPayload(payloadJson, createdResult, actor)
        );
    }

    @Transactional
    public NotificationResponseDto createFollowNotification(FollowCreatedResultDto createdResult) {
        if (!createdResult.newFollowCreated()) {
            return null;
        }

        if (createdResult.receiverMemberId().equals(createdResult.actorMemberId())) {
            return null;
        }

        Member receiver = memberRepository.findActiveById(createdResult.receiverMemberId())
                .orElse(null);

        if (receiver == null) {
            log.warn("팔로우 알림 수신 회원을 찾을 수 없습니다. receiverId={}, actorMemberId={}",
                    createdResult.receiverMemberId(), createdResult.actorMemberId());
            return null;
        }

        LocalDateTime notifiedAt = LocalDateTime.now();
        Long receiverId = createdResult.receiverMemberId();
        Long actorId = createdResult.actorMemberId();

        int dedupeInserted = notificationDedupeStateRepository.insertIgnore(
                NotificationType.FOLLOW_CREATED.name(),
                actorId,
                receiverId,
                NotificationTargetType.MEMBER.name(),
                receiverId,
                notifiedAt
        );

        if (dedupeInserted == 0) {
            int dedupeUpdated = notificationDedupeStateRepository.updateLastNotifiedAtIfBefore(
                    NotificationType.FOLLOW_CREATED.name(),
                    actorId,
                    receiverId,
                    NotificationTargetType.MEMBER.name(),
                    receiverId,
                    notifiedAt.minus(FOLLOW_NOTIFICATION_COOLDOWN),
                    notifiedAt
            );

            if (dedupeUpdated == 0) {
                return null;
            }
        }

        Member actor = memberRepository.getReferenceById(actorId);

        FollowCreatedNotificationPayload payload = new FollowCreatedNotificationPayload(
                actorId,
                actor.getNickname(),
                actor.getProfileImgUrl()
        );

        return saveNotification(Notification.create(
                receiver,
                actor,
                NotificationCategory.COMMUNITY,
                NotificationType.FOLLOW_CREATED,
                serializePayload(payload)
        ));
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

    // 선물주문 체결시 클라이언트로 보내질 페이로드 값 ( json으로 공통적으로 응답하는 값 밑에 트레이드 전용 페이로드 값이 작성됩니다. )
    // ( 비즈니스 로직을 분리하고 싶으면 TransactionSynchronizationManager가 아닌 @TransactionalEventListener를 사용하여 분리시도 )
    public void notifyFuturesOrderCompleted(Member receiver, AssetType assetType, FuturesOrder futuresOrder, BigDecimal realizedPnl) {
        // 혹시나 모를 상황에 서버가 다운 될 수 있음을 방어함
        if (receiver == null || receiver.getId() == null || futuresOrder == null || futuresOrder.getId() == null) {
            log.warn("주문 체결 알림 생성을 건너뜁니다. receiver={}, order={}", receiver, futuresOrder);
            return;
        }

        // 알람 내용 및 포지션 생성에 필요한 필드
        // *값을 미리 꺼내두는 이유 : 트랜잭션 종류 후에는 지연로딩(LAZY)으로 연관 엔티티 접근 불가
        Long receiverId = receiver.getId();                             // 알람을 받는 멤버 id
        Long orderId = futuresOrder.getId();
        String symbol = futuresOrder.getSymbol();
        PositionStatus positionStatus = futuresOrder.getPositionAction();
        OrderType orderType = futuresOrder.getOrderType();              // MARKET, LIMIT
        PositionSide positionSide = futuresOrder.getPositionSide();     // LONG, SHORT
        BigDecimal price = futuresOrder.getAvgFilledPrice();            // 이 주문에서 체결된 [코인] 가격의 평균
        BigDecimal quantity = futuresOrder.getFilledQuantity();         // 누적 체결된 [코인] 수량
        BigDecimal executedAmount = futuresOrder.getExecutedAmount();   // 레버리지를 포함한 포지션 전체 가격중 체결된 가격
        BigDecimal totalFee = futuresOrder.getTotalFee();               // 누적 체결된 수수료
        LocalDateTime executedAt = futuresOrder.getExecutedAt();        // 주문의 최종 체결 완료 시각

        BigDecimal executedMargin = futuresOrder.getOrderMargin();      // 체결 증거금(마진) 금액

        log.info("주문 체결 알림 예약. receiverId={}, orderId={}, assetType={}, symbol={}",
                receiverId, orderId, assetType, symbol);

        // 커밋 후 실행할 알림 로직을 Runnable(나중에 이 코드를 실행해줘)에 담아둔다.
        // 람다식 () -> {} 는 new Runnable() { public void run() {} } 의 축약형
        // *값을 미리 꺼내두는 이유 : 트랜잭션 종류 후에는 지연로딩(LAZY)으로 연관 엔티티 접근 불가
        Runnable notificationTask = () -> {
            try {
                // 선물 주문 체결 알림을 DB에 저장하고 SSE로 전송하는 메서드 호출.
                // 파파라미터를 직접 넘기는 이유: Runnable 실행 시점엔 트랜잭션이 이미 끝났으므로
                // futuresOrder.getXxx() 같은 엔티티 접근이 불가능해서 미리 꺼낸 값을 사용한다.
                saveAndSendFuturesOrderCompleted(
                        receiverId,     // 알림 받을 멤버 ID (wallet.getMember().getId())
                        assetType,      // TRADE or CONTEST (wallet.getType())
                        orderId,        // 체결된 선물 주문 ID
                        symbol,         // 코인 심볼 (예: BTCUSDT)
                        orderType,      // MARKET or LIMIT
                        positionSide,   // LONG or SHORT
                        positionStatus, // OPEN(진입) or CLOSE(청산)
                        price,          // 체결 평균가 (avgFilledPrice)
                        quantity,       // 체결 수량 (filledQuantity)
                        executedAmount, // 레버리지 포함 체결 명목금액
                        executedMargin, // 체결 증거금(마진) 금액
                        totalFee,       // 누적 거래 수수료
                        realizedPnl,    // 실현손익 (진입은 null, 청산은 확정 손익)
                        executedAt      // 체결 완료 시각
                );
            } catch (Exception e) {
                // 알림 실패가 주문 체결 결과에 영향을 주면 안 되므로 예외를 던지지 않고 로그만 남긴다.
                log.error("선물 주문 체결 알림 처리 중 예외. receiverId={}, orderId={}", receiverId, orderId, e);
            }
        };

        // 현재 스레드에 활성화된 프랜잭션이 있는지 확인한다.
        // 시장가: HTTP 요청 스레드의 @Transactional 안에서 호출되므로 true, 지정가: LimitOrderScheduler 백그라운드 스레드의 @Transactional 안에서 호출되므로 true.
        // *TransactionSynchronizationManager.isActualTransactionActive() = 스프링 클래스로 트랜잭션이 존재하는지 여부를 확인 할 수 있음
        if( TransactionSynchronizationManager.isActualTransactionActive()
                // *TransactionSynchronizationManager.isSynchronizationActive() = afterCommit 같은 콜백을 등록할 수 있는 상태인지 확인합니다. ( 특수한 트랜잭션의 경우 동기화가 비활성화된 경우가 있음 )
                && TransactionSynchronizationManager.isSynchronizationActive() ) { // 안전장치용

            // 트랜잭션 존재 여부가 true?, DB 커밋이 확정된 후에만 알림을 보냄
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() { // afterCommit 콜백으로 등록,
                @Override
                public void afterCommit() {
                    // 커밋 완료 시점에 위에서 만든 Runnable을 실행한다.
                    // 별도 스레드가 아니라 커밋한 그 스레드에서 동기적으로 실행된다.
                    notificationTask.run();
                }
            });
            // afterCommit에 등록했으므로 여기서 return, 아래 즉시 실행 코드는 건너뜀.
            return;
        }
        // 트랜잭션 없이 호출된 경우 — 알림을 보내지 않고 경고 로그만 남김
        log.warn("선물 주문 체결 알림이 트랜잭션 없이 호출되었습니다. orderId={}", orderId);
    }

    // 강제청산이 완료되었을 때 클라이언트에 전송할 알람
    public void notifyFuturesLiquidationCompleted(
            Member receiver,
            AssetType assetType,
            String symbol,
            PositionSide positionSide,
            BigDecimal liquidationPrice,
            BigDecimal closeQuantity,
            BigDecimal realizedPnl
    ) {
        if (receiver == null || receiver.getId() == null) {
            log.warn("강제청산 알림 생성을 건너뜁니다. receiver={}", receiver);
            return;
        }

        Long receiverId = receiver.getId();

        Runnable notificationTask = () -> {
            try {
                saveAndSendFuturesLiquidationCompleted(
                        receiverId,
                        assetType,
                        symbol,
                        positionSide,
                        liquidationPrice,
                        closeQuantity,
                        realizedPnl
                );
            } catch (Exception e) {
                log.error("강제청산 알림 처리 중 예외. receiverId={}, symbol={}", receiverId, symbol, e);
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

        log.warn("강제청산 알림이 트랜잭션 없이 호출되었습니다. symbol={}", symbol);
    }





    private NotificationDispatchResultDto createGroupedLikeNotification(
            Member receiver,
            Member actor,
            NotificationType notificationType,
            NotificationTargetType targetType,
            Long targetId,
            PayloadSupplier initialPayloadSupplier,
            PayloadUpdater payloadUpdater
    ) {
        LocalDateTime notifiedAt = LocalDateTime.now();

        // 같은 actor의 같은 target 좋아요는 최초 1회만 묶음 알림에 반영한다.
        // 여기서 막히면 group_state를 볼 필요 없이 즉시 종료한다.
        int dedupeInserted = notificationDedupeStateRepository.insertIgnore(
                notificationType.name(),
                actor.getId(),
                receiver.getId(),
                targetType.name(),
                targetId,
                notifiedAt
        );

        if (dedupeInserted == 0) {
            return null;
        }

        // 같은 receiver/type/target 조합의 그룹 생성 경쟁을 직렬화해
        // 동시에 여러 좋아요가 들어와도 notification row가 두 개 생기지 않게 한다.
        notificationGroupStateRepository.lockGroupKey(
                receiver.getId(),
                notificationType.name(),
                targetType.name(),
                targetId
        );

        Long lastCheckedNotificationId = notificationStateRepository.findByMemberId(receiver.getId())
                .map(NotificationState::getLastCheckedNotificationId)
                .orElse(null);

        Optional<NotificationGroupState> groupStateOptional =
                notificationGroupStateRepository.findByReceiverIdAndNotificationTypeAndTargetTypeAndTargetId(
                        receiver.getId(),
                        notificationType,
                        targetType,
                        targetId
                );

        // 아직 check되지 않은 그룹이면 기존 notification row를 갱신한다.
        // check 이후에는 같은 target이라도 새 알림으로 취급해야 하므로 update하지 않는다.
        if (groupStateOptional.isPresent() && isUncheckedGroup(groupStateOptional.get(), lastCheckedNotificationId)) {
            NotificationGroupState groupState = groupStateOptional.get();
            Notification notification = groupState.getNotification();
            String updatedPayloadJson = payloadUpdater.update(notification.getPayloadJson());

            notification.updateGroupedNotification(actor, updatedPayloadJson, notifiedAt);
            groupState.incrementGroup(notifiedAt);

            return new NotificationDispatchResultDto(
                    NotificationResponseDto.from(notification, objectMapper),
                    resolveLikeGroupedEventName(notificationType, false)
            );
        }

        // 열린 그룹이 없거나 이미 check로 닫힌 그룹이면 새 notification row를 만든다.
        Notification notification = Notification.create(
                receiver,
                actor,
                NotificationCategory.COMMUNITY,
                notificationType,
                serializePayload(initialPayloadSupplier.get())
        );

        NotificationResponseDto response = saveNotification(notification);

        if (groupStateOptional.isPresent()) {
            // 기존 그룹 키는 유지하되, check 이후 시작된 새 notification row를 가리키도록 교체한다.
            groupStateOptional.get().restartGroup(notification, notifiedAt);
        } else {
            notificationGroupStateRepository.save(NotificationGroupState.create(
                    receiver,
                    notificationType,
                    targetType,
                    targetId,
                    notification,
                    notifiedAt
            ));
        }

        return new NotificationDispatchResultDto(
                response,
                resolveLikeGroupedEventName(notificationType, true)
        );
    }

    private boolean isUncheckedGroup(NotificationGroupState groupState, Long lastCheckedNotificationId) {
        if (groupState == null || groupState.getNotification() == null || groupState.getNotification().getId() == null) {
            return false;
        }

        // 묶음 경계는 read가 아니라 마지막 check 기준 notificationId다.
        return lastCheckedNotificationId == null
                || groupState.getNotification().getId() > lastCheckedNotificationId;
    }

    private PostLikedNotificationPayload createInitialPostLikedPayload(PostLikeCreatedResultDto createdResult, Member actor) {
        return new PostLikedNotificationPayload(
                createdResult.postId(),
                NotificationPreviewUtils.createPostTitlePreview(createdResult.postTitle()),
                1L,
                List.of(toActorPreview(actor))
        );
    }

    private String createUpdatedPostLikedPayload(
            String payloadJson,
            PostLikeCreatedResultDto createdResult,
            Member actor
    ) {
        PostLikedNotificationPayload currentPayload = deserializePayload(payloadJson, PostLikedNotificationPayload.class);

        return serializePayload(new PostLikedNotificationPayload(
                createdResult.postId(),
                NotificationPreviewUtils.createPostTitlePreview(createdResult.postTitle()),
                currentPayload.groupCount() + 1L,
                mergeActorPreviews(actor)
        ));
    }

    private ReplyLikedNotificationPayload createInitialReplyLikedPayload(ReplyLikeCreatedResultDto createdResult, Member actor) {
        return new ReplyLikedNotificationPayload(
                createdResult.postId(),
                createdResult.replyId(),
                NotificationPreviewUtils.createPostTitlePreview(createdResult.postTitle()),
                NotificationPreviewUtils.createReplyContentPreview(createdResult.replyContent()),
                1L,
                List.of(toActorPreview(actor))
        );
    }

    private String createUpdatedReplyLikedPayload(
            String payloadJson,
            ReplyLikeCreatedResultDto createdResult,
            Member actor
    ) {
        ReplyLikedNotificationPayload currentPayload = deserializePayload(payloadJson, ReplyLikedNotificationPayload.class);

        return serializePayload(new ReplyLikedNotificationPayload(
                createdResult.postId(),
                createdResult.replyId(),
                NotificationPreviewUtils.createPostTitlePreview(createdResult.postTitle()),
                NotificationPreviewUtils.createReplyContentPreview(createdResult.replyContent()),
                currentPayload.groupCount() + 1L,
                mergeActorPreviews(actor)
        ));
    }

    private NotificationActorPreviewPayload toActorPreview(Member actor) {
        return new NotificationActorPreviewPayload(
                actor.getId(),
                actor.getNickname(),
                actor.getProfileImgUrl()
        );
    }

    private List<NotificationActorPreviewPayload> mergeActorPreviews(Member actor) {
        // 프론트 문구 조립에는 최근 1명만 있으면 충분하므로 preview 크기를 1로 제한한다.
        return List.of(toActorPreview(actor));
    }

    private String resolveLikeGroupedEventName(NotificationType notificationType, boolean created) {
        // 프론트가 "새 카드 추가"와 "기존 카드 갱신"을 구분할 수 있도록 create/update event를 분리한다.
        if (notificationType == NotificationType.POST_LIKED) {
            return created
                    ? CommunitySseEventType.NOTIFICATION_COMMUNITY_POST_LIKED_CREATED.name()
                    : CommunitySseEventType.NOTIFICATION_COMMUNITY_POST_LIKED_UPDATED.name();
        }

        return created
                ? CommunitySseEventType.NOTIFICATION_COMMUNITY_REPLY_LIKED_CREATED.name()
                : CommunitySseEventType.NOTIFICATION_COMMUNITY_REPLY_LIKED_UPDATED.name();
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
        TradeSseEventType tradeSseEventType = resolveTradeSseEventType(assetType);

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
                        serializePayload(payload)
                ),
                tradeSseEventType.name()
        );
    }

    // 선물 미체결주문 체결 완료시 페이로드 조립 메서드
    private void saveAndSendFuturesOrderCompleted(
            Long receiverId,
            AssetType assetType,
            Long orderId,
            String symbol,
            OrderType orderType,
            PositionSide positionSide,
            PositionStatus positionAction,
            BigDecimal price,
            BigDecimal quantity,
            BigDecimal executedAmount,
            BigDecimal executedMargin,
            BigDecimal totalFee,
            BigDecimal realizedPnl,
            LocalDateTime executedAt
    ) {
        // 수신자 조회 — 탈퇴 또는 비활성 회원이면 알림을 보내지 않는다
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("선물 주문 체결 알림 수신 회원을 찾을 수 없습니다. receiverId={}, orderId={}", receiverId, orderId);
            return;
        }

        // 심볼 한국어 이름 조회 — 없으면 심볼 그대로 사용 (예: BTCUSDT → 비트코인)
        String displayNameKr = marketSymbolRepository.findById(symbol)
                .map(MarketSymbol::getDisplayNameKr)
                .orElse(symbol);

        // AssetType 기반으로 표시명, 알림 카테고리, SSE 이벤트명 결정
        String assetTypeDisplayName = resolveAssetTypeDisplayName(assetType);
        NotificationCategory notificationCategory = resolveNotificationCategory(assetType);
        TradeSseEventType tradeSseEventType = resolveTradeSseEventType(assetType);

        // 프론트에 전달할 선물 주문 체결 정보 페이로드 조립
        FuturesOrderCompletedNotificationPayload payload = new FuturesOrderCompletedNotificationPayload(
                orderId,
                assetType,
                assetTypeDisplayName,
                symbol,
                displayNameKr,
                orderType,
                positionSide,
                positionAction,
                price,
                quantity,
                executedAmount,
                executedMargin,
                totalFee,
                realizedPnl,
                executedAt
        );

        log.info("선물 주문 체결 알림 payload 생성 완료. orderId={}, assetTypeDisplayName={}, positionSide={}, positionAction={}",
                orderId, assetTypeDisplayName, positionSide, positionAction);

        // REQUIRES_NEW 트랜잭션으로 알림 DB 저장 후 SSE 이벤트 전송
        saveAndSend(
                Notification.create(
                        notificationReceiver,
                        null,
                        notificationCategory,
                        NotificationType.ORDER_COMPLETED,
                        serializePayload(payload)
                ),
                tradeSseEventType.name()
        );
    }

    // 선물 강제청산 완료시 페이로드 조립 메서드
    private void saveAndSendFuturesLiquidationCompleted(
            Long receiverId,
            AssetType assetType,
            String symbol,
            PositionSide positionSide,
            BigDecimal liquidationPrice,
            BigDecimal closeQuantity,
            BigDecimal realizedPnl
    ) {
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("강제청산 알림 수신 회원을 찾을 수 없습니다. receiverId={}, symbol={}", receiverId, symbol);
            return;
        }

        String displayNameKr = marketSymbolRepository.findById(symbol)
                .map(MarketSymbol::getDisplayNameKr)
                .orElse(symbol);

        String assetTypeDisplayName = resolveAssetTypeDisplayName(assetType);
        NotificationCategory notificationCategory = resolveNotificationCategory(assetType);
        TradeSseEventType tradeSseEventType = resolveLiquidationSseEventType(assetType);

        FuturesLiquidationCompletedNotificationPayload payload = new FuturesLiquidationCompletedNotificationPayload(
                assetType,
                assetTypeDisplayName,
                symbol,
                displayNameKr,
                positionSide,
                liquidationPrice,
                closeQuantity,
                realizedPnl
        );

        log.info("강제청산 알림 payload 생성 완료. receiverId={}, symbol={}, side={}, pnl={}",
                receiverId, symbol, positionSide, realizedPnl);

        saveAndSend(
                Notification.create(
                        notificationReceiver,
                        null,
                        notificationCategory,
                        NotificationType.LIQUIDATION_COMPLETED,
                        serializePayload(payload)
                ),
                tradeSseEventType.name()
        );
    }

    private TradeSseEventType resolveLiquidationSseEventType(AssetType assetType) {
        return switch (assetType) {
            case TRADE_FUTURE -> TradeSseEventType.NOTIFICATION_TRADE_LIQUIDATION_COMPLETED;
            case CONTEST -> TradeSseEventType.NOTIFICATION_CONTEST_LIQUIDATION_COMPLETED;
            default -> throw new IllegalArgumentException("강제청산 알림을 지원하지 않는 자산 유형입니다: " + assetType);
        };
    }

    private void saveAndSend(Notification notification, String eventName) {
        Long receiverId = notification.getReceiver().getId();
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        NotificationResponseDto response = transactionTemplate.execute(status -> {
            log.info("알림 저장 시작. receiverId={}, category={}, type={}",
                    receiverId, notification.getCategory(), notification.getType());

            Notification savedNotification = notificationRepository.saveAndFlush(notification);

            log.info("알림 저장 완료. notificationId={}, receiverId={}",
                    savedNotification.getId(), receiverId);

            return NotificationResponseDto.from(savedNotification, objectMapper);
        });

        if (response == null) {
            throw NotificationException.notificationResponseCreationFailed();
        }

        notificationSseService.sendNotification(receiverId, eventName, response);
    }

    private void sendStatusAfterCommit(Long memberId) {
        if (memberId == null) {
            return;
        }

        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    notificationSseService.sendStatus(memberId);
                }
            });
            return;
        }

        notificationSseService.sendStatus(memberId);
    }

    private NotificationResponseDto saveNotification(Notification notification) {
        Long receiverId = notification.getReceiver().getId();
        log.info("알림 저장 시작. receiverId={}, category={}, type={}",
                receiverId, notification.getCategory(), notification.getType());

        Notification savedNotification = notificationRepository.saveAndFlush(notification);

        log.info("알림 저장 완료. notificationId={}, receiverId={}",
                savedNotification.getId(), receiverId);

        return NotificationResponseDto.from(savedNotification, objectMapper);
    }

    private String serializePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw NotificationException.notificationPayloadSerializationFailed(exception);
        }
    }

    private <T> T deserializePayload(String payloadJson, Class<T> payloadType) {
        try {
            return objectMapper.readValue(payloadJson, payloadType);
        } catch (JsonProcessingException exception) {
            throw NotificationException.notificationPayloadSerializationFailed(exception);
        }
    }

    private String resolveAssetTypeDisplayName(AssetType assetType) {
        return switch (assetType) {
            case MOCK -> "(모의투자)";
            case TRADE_SPOT -> "(트레이딩-현물)";
            case TRADE_FUTURE -> "(트레이딩-선물)";
            case CONTEST -> "(대회)";
        };
    }

    private NotificationCategory resolveNotificationCategory(AssetType assetType) {
        return switch (assetType) {
            case MOCK -> NotificationCategory.MOCK;
            case TRADE_SPOT, TRADE_FUTURE -> NotificationCategory.TRADE;
            case CONTEST -> NotificationCategory.CONTEST;
        };
    }

    private TradeSseEventType resolveTradeSseEventType(AssetType assetType) {
        return switch (assetType) {
            case MOCK -> TradeSseEventType.NOTIFICATION_MOCK_ORDER_COMPLETED;
            case TRADE_SPOT, TRADE_FUTURE -> TradeSseEventType.NOTIFICATION_TRADE_ORDER_COMPLETED;
            case CONTEST -> TradeSseEventType.NOTIFICATION_CONTEST_ORDER_COMPLETED;
        };
    }

    @FunctionalInterface
    private interface PayloadSupplier {
        Object get();
    }

    @FunctionalInterface
    private interface PayloadUpdater {
        String update(String payloadJson);
    }
}
