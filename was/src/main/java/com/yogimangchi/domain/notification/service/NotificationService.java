package com.yogimangchi.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.community.dto.result.PostLikeCreatedResultDto;
import com.yogimangchi.domain.community.dto.result.ReplyCreatedResultDto;
import com.yogimangchi.domain.community.dto.result.ReplyLikeCreatedResultDto;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.dto.result.FollowCreatedResultDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.notification.dto.payload.FollowCreatedNotificationPayload;
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
