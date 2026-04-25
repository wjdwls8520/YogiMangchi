package com.yogimangchi.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.community.dto.result.PostLikeCreatedResultDto;
import com.yogimangchi.domain.community.dto.result.ReplyCreatedResultDto;
import com.yogimangchi.domain.community.dto.result.ReplyLikeCreatedResultDto;
import com.yogimangchi.domain.member.dto.result.FollowCreatedResultDto;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.notification.dto.payload.FollowCreatedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.OrderCompletedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.PostCommentCreatedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.PostLikedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.ReplyCommentCreatedNotificationPayload;
import com.yogimangchi.domain.notification.dto.payload.ReplyLikedNotificationPayload;
import com.yogimangchi.domain.notification.dto.request.NotificationIdsRequestDto;
import com.yogimangchi.domain.notification.dto.request.NotificationSearchConditionDto;
import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;
import com.yogimangchi.domain.notification.dto.response.NotificationStatusResponseDto;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.entity.NotificationState;
import com.yogimangchi.domain.notification.enums.NotificationCategory;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import com.yogimangchi.domain.notification.repository.NotificationDedupeStateRepository;
import com.yogimangchi.domain.notification.repository.NotificationRepository;
import com.yogimangchi.domain.notification.repository.NotificationStateRepository;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.domain.spot.entity.Order;
import com.yogimangchi.global.exception.notification.NotificationException;
import com.yogimangchi.domain.notification.support.NotificationPreviewUtils;
import com.yogimangchi.global.sse.enums.TradeSseEventType;
import com.yogimangchi.global.support.MemberReader;
import java.math.BigDecimal;
import java.time.Duration;
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

    private static final Duration FOLLOW_NOTIFICATION_COOLDOWN = Duration.ofDays(1);

    private final NotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final MemberRepository memberRepository;
    private final MarketSymbolRepository marketSymbolRepository;
    private final NotificationDedupeStateRepository notificationDedupeStateRepository;
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

    // 게시글 작성자에게 전달할 "새 댓글" 알림을 저장하고,
    // 이후 파사드가 SSE로 보낼 수 있도록 응답 DTO를 반환한다.
    @Transactional
    public NotificationResponseDto createPostCommentNotification(Long receiverId, ReplyCreatedResultDto createdResult) {
        Member notificationReceiver = memberRepository.findActiveById(receiverId)
                .orElse(null);

        if (notificationReceiver == null) {
            log.warn("게시글 댓글 알림 수신 회원을 찾을 수 없습니다. receiverId={}, replyId={}",
                    receiverId, createdResult.id());
            return null;
        }

        // actorMemberId는 응답 DTO와 알림 payload에서 모두 필요하므로 actor 연관관계도 함께 저장한다.
        Member actor = memberRepository.getReferenceById(createdResult.memberId());

        // 게시글 댓글 알림은 게시글 제목과 댓글 미리보기를 함께 담아 프론트가 문구를 조립할 수 있게 한다.
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

    // 부모댓글/대상댓글 작성자에게 전달할 "새 답글" 알림을 저장하고,
    // 이후 파사드가 SSE로 보낼 수 있도록 응답 DTO를 반환한다.
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

        // 답글 알림은 어떤 댓글 흐름에서 발생했는지 추적할 수 있도록 parent/target 식별자를 함께 저장한다.
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

    // 게시글 좋아요 생성 결과를 기준으로 수신자 활성 여부와 최초 1회 정책을 확인한 뒤,
    // 알림을 저장하고 이후 파사드가 SSE로 보낼 수 있도록 응답 DTO를 반환한다.
    @Transactional
    public NotificationResponseDto createPostLikedNotification(PostLikeCreatedResultDto createdResult) {
        // 멱등 요청으로 실제 좋아요 row가 새로 생기지 않았다면 알림도 만들지 않는다.
        if (!createdResult.newLikeCreated()) {
            return null;
        }

        // 자기 글 좋아요는 알림을 만들지 않는다.
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

        // 같은 사람이 같은 게시글에 대해 이미 알림을 보낸 적 있으면 최초 1회 정책에 따라 스킵한다.
        int dedupeInserted = notificationDedupeStateRepository.insertIgnore(
                NotificationType.POST_LIKED.name(),
                createdResult.actorMemberId(),
                createdResult.receiverMemberId(),
                NotificationTargetType.POST.name(),
                createdResult.postId(),
                LocalDateTime.now()
        );

        if (dedupeInserted == 0) {
            return null;
        }

        Member actor = memberRepository.getReferenceById(createdResult.actorMemberId());

        // 게시글 좋아요 알림은 게시글 id와 좋아요를 누른 회원 정보를 payload에 담는다.
        PostLikedNotificationPayload payload = new PostLikedNotificationPayload(
                createdResult.postId(),
                createdResult.actorMemberId(),
                actor.getNickname(),
                actor.getProfileImgUrl()
        );

        return saveNotification(Notification.create(
                receiver,
                actor,
                NotificationCategory.COMMUNITY,
                NotificationType.POST_LIKED,
                serializePayload(payload)
        ));
    }

    // 댓글 좋아요 생성 결과를 기준으로 수신자 활성 여부와 최초 1회 정책을 확인한 뒤,
    // 알림을 저장하고 이후 파사드가 SSE로 보낼 수 있도록 응답 DTO를 반환한다.
    @Transactional
    public NotificationResponseDto createReplyLikedNotification(ReplyLikeCreatedResultDto createdResult) {
        // 멱등 요청으로 실제 좋아요 row가 새로 생기지 않았다면 알림도 만들지 않는다.
        if (!createdResult.newLikeCreated()) {
            return null;
        }

        // 자기 댓글 좋아요는 알림을 만들지 않는다.
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

        // 같은 사람이 같은 댓글에 대해 이미 알림을 보낸 적 있으면 최초 1회 정책에 따라 스킵한다.
        int dedupeInserted = notificationDedupeStateRepository.insertIgnore(
                NotificationType.REPLY_LIKED.name(),
                createdResult.actorMemberId(),
                createdResult.receiverMemberId(),
                NotificationTargetType.REPLY.name(),
                createdResult.replyId(),
                LocalDateTime.now()
        );

        if (dedupeInserted == 0) {
            return null;
        }

        Member actor = memberRepository.getReferenceById(createdResult.actorMemberId());

        // 댓글 좋아요 알림은 게시글 id, 댓글 id와 좋아요를 누른 회원 정보를 payload에 담는다.
        ReplyLikedNotificationPayload payload = new ReplyLikedNotificationPayload(
                createdResult.postId(),
                createdResult.replyId(),
                createdResult.actorMemberId(),
                actor.getNickname(),
                actor.getProfileImgUrl()
        );

        return saveNotification(Notification.create(
                receiver,
                actor,
                NotificationCategory.COMMUNITY,
                NotificationType.REPLY_LIKED,
                serializePayload(payload)
        ));
    }

    // 팔로우 생성 결과를 기준으로 수신자 활성 여부와 쿨타임 기반 재알림 정책을 확인한 뒤,
    // 알림을 저장하고 이후 파사드가 SSE로 보낼 수 있도록 응답 DTO를 반환한다.
    @Transactional
    public NotificationResponseDto createFollowNotification(FollowCreatedResultDto createdResult) {
        // 멱등 요청으로 실제 팔로우 row가 새로 생기지 않았다면 알림도 만들지 않는다.
        if (!createdResult.newFollowCreated()) {
            return null;
        }

        // 자기 자신을 팔로우하는 경우는 서비스에서 막고 있지만, 방어적으로 한 번 더 확인한다.
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

        // 최초 알림은 insert로 기록하고, 이미 row가 있으면 쿨타임이 지난 경우에만 lastNotifiedAt을 원자적으로 갱신한다.
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

        // 팔로우 알림은 팔로우한 회원의 프로필로 이동할 수 있도록 actor 식별자와 화면 표시 정보를 담는다.
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

        // 알림 카테고리와 SSE 이벤트명은 각각 탭 분류와 실시간 분기 기준으로 사용한다.
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

    private void saveAndSend(Notification notification, String eventName) {
        Long receiverId = notification.getReceiver().getId();
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        // 주문 트랜잭션과 분리된 새 트랜잭션에서 알림을 저장한다.
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

    // 커뮤니티 알림의 공통 저장 로직이다.
    // 순차 호출 구조에서는 저장과 SSE 전송을 분리해 커넥션 점유 시간을 짧게 유지한다.
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

    private String resolveAssetTypeDisplayName(AssetType assetType) {
        // 프론트가 알림 문구를 조립할 때 사용할 지갑 표시명이다.
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

    private TradeSseEventType resolveTradeSseEventType(AssetType assetType) {
        // 프론트가 투자 탭별 체결 이벤트를 빠르게 분기할 수 있도록 SSE 이름을 구분한다.
        return switch (assetType) {
            case MOCK -> TradeSseEventType.NOTIFICATION_MOCK_ORDER_COMPLETED;
            case TRADE_SPOT, TRADE_FUTURE -> TradeSseEventType.NOTIFICATION_TRADE_ORDER_COMPLETED;
            case CONTEST -> TradeSseEventType.NOTIFICATION_CONTEST_ORDER_COMPLETED;
        };
    }
}
