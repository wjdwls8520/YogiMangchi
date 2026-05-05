package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.entity.UserQuest;
import com.yogimangchi.domain.member.enums.MemberRole;
import com.yogimangchi.domain.member.repository.UserQuestRepository;
import com.yogimangchi.domain.member.event.MemberVerifiedEvent;
import com.yogimangchi.domain.spot.event.SpotOrderExecutedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserQuestService {

    private final UserQuestRepository userQuestRepository;
    private final AssetRepository assetRepository;

    // 현물 주문 체결 이벤트 리스너
    // 주문 트랜잭션이 성공적으로 커밋된 후(AFTER_COMMIT)에만 실행되어 데이터 정합성을 보장합니다.
    // SpEL(condition)을 사용하여 불필요한 프록시 호출 없이 MOCK 이벤트일 때만 수신합니다.
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT,
            condition = "#event.assetType == T(com.yogimangchi.domain.asset.enums.AssetType).MOCK"
    )
    public void onSpotOrderExecuted(SpotOrderExecutedEvent event) {
        Long memberId = event.memberId();
        
        try {
            processQuestUnlock(memberId, true); // 체결 이벤트이므로 카운트 증가 처리(true)
        } catch (Exception e) {
            log.error("[퀘스트 해금 실패] memberId={}: {}", memberId, e.getMessage(), e);
        }
    }

    // 회원 인증 완료 이벤트 리스너
    // 인증이 늦게 완료되었을 때 퀘스트 해금 조건이 충족되었는지 다시 한번 확인합니다.
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMemberVerified(MemberVerifiedEvent event) {
        Long memberId = event.memberId();
        
        try {
            processQuestUnlock(memberId, false); // 인증 이벤트이므로 카운트 증가는 하지 않음(false)
        } catch (Exception e) {
            log.error("[인증 후 퀘스트 해금 실패] memberId={}: {}", memberId, e.getMessage(), e);
        }
    }

    // 퀘스트 해금 조건을 검사하고, 조건 충족 시 본투자 지갑을 활성화합니다.
    private void processQuestUnlock(Long memberId, boolean shouldIncreaseCount) {
        UserQuest quest = userQuestRepository.findByMemberId(memberId)
                .orElseThrow(() -> new IllegalStateException("해당 유저의 퀘스트 정보를 찾을 수 없습니다. memberId=" + memberId));

        if (quest.isUnlocked()) {
            return; // 이미 해금되었다면 스킵
        }

        if (shouldIncreaseCount) {
            quest.increaseCount();
        }

        boolean isAdmin = quest.getMember().getRole() == MemberRole.ADMIN;
        boolean isQualifiedUser = quest.canUnlock() && isVerifiedUser(quest.getMember());

        // 해금 조건 검사: 어드민(프리패스)이거나, (카운트 3회 이상 & 인증 회원)인 경우
        if (isAdmin || isQualifiedUser) {
            unlockRealInvestment(quest);
        } else {
            // 상태만 저장
            userQuestRepository.save(quest);
            if (shouldIncreaseCount) {
                log.info("[퀘스트 카운트 증가] memberId={}, count={}/3", memberId, quest.getPracticeOrderCount());
            }
        }
    }

    // 회원이 휴대폰/주소 인증을 완료한 VERIFIED_USER 인지 확인합니다.
    private boolean isVerifiedUser(Member member) {
        return member.getRole() == MemberRole.VERIFIED_USER;
    }

    // 퀘스트를 해금 처리하고, 유저의 본투자 현물 및 선물 지갑을 ACTIVE 상태로 변경합니다.
    private void unlockRealInvestment(UserQuest quest) {
        Long memberId = quest.getMember().getId();

        // 1. 퀘스트 상태 변경
        quest.unlock();
        userQuestRepository.save(quest);

        // 2. 본투자 지갑 활성화 (TRADE_SPOT, TRADE_FUTURE)
        List<Assets> realWallets = assetRepository.findAllByMemberIdAndTypeIn(
                memberId, 
                List.of(AssetType.TRADE_SPOT, AssetType.TRADE_FUTURE)
        );

        for (Assets wallet : realWallets) {
            if ("INACTIVE".equals(wallet.getStatus())) {
                wallet.activate();
                log.info("[지갑 해금] memberId={}, type={}", memberId, wallet.getType());
            }
        }
        
        assetRepository.saveAll(realWallets);
        log.info("[본투자 해금 완료] memberId={}", memberId);
    }
}
