package com.yogimangchi.domain.real.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.real.dto.request.TransferRequestDto;
import com.yogimangchi.domain.real.entity.TransferHistory;
import com.yogimangchi.domain.real.enums.TransferStatus;
import com.yogimangchi.domain.real.enums.TransferType;
import com.yogimangchi.domain.real.repository.TransferHistoryRepository;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetTransferService {

    private final AssetRepository assetRepository;
    private final TransferHistoryRepository transferHistoryRepository;
    private final MemberReader memberReader;

    // 현물과 선물 본투자 지갑 간의 자산을 이체합니다. 데드락 방지 락과 멱등성 검증이 포함되어 있습니다.
    @Transactional
    public void transferAsset(Long memberId, TransferRequestDto request) {
        Member member = memberReader.getAuthenticated(memberId);

        // 1. 멱등성 검증 (따닥 방지)
        // 똑같은 requestId가 이미 DB에 존재하는지 확인하여 중복 처리 방지
        if (transferHistoryRepository.findByRequestId(request.requestId()).isPresent()) {
            throw new IllegalArgumentException("이미 처리 진행 중이거나 완료된 이체 요청입니다.");
        }

        // 2. 출발/도착 지갑 타입 검증
        if (request.fromType() == request.toType()) {
            throw new IllegalArgumentException("같은 지갑으로 이체할 수 없습니다.");
        }
        
        // 본투자 지갑(TRADE_SPOT, TRADE_FUTURE) 간의 이체만 허용
        if (!isRealTradingWallet(request.fromType()) || !isRealTradingWallet(request.toType())) {
            throw new IllegalArgumentException("이체는 본투자 지갑 간에만 가능합니다.");
        }

        // 3. 지갑 조회 (락 없이 먼저 조회하여 검증)
        Assets fromAsset = assetRepository.findByMemberIdAndTypeAndStatus(memberId, request.fromType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 출금 지갑을 찾을 수 없습니다. (퀘스트 완료 필요)"));
        Assets toAsset = assetRepository.findByMemberIdAndTypeAndStatus(memberId, request.toType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 입금 지갑을 찾을 수 없습니다. (퀘스트 완료 필요)"));

        // 잔고 사전 검증 (락을 걸기 전에 미리 걸러내어 DB 락 부하 감소)
        if (fromAsset.getCurrentMoney().compareTo(request.amount()) < 0) {
            throw new IllegalArgumentException("출금 지갑의 잔고가 부족합니다.");
        }

        // 4. 데드락 방지를 위한 락 획득 순서 정렬
        // 지갑 ID(PK)가 작은 것부터 먼저 락을 획득하도록 보장하여 교착 상태(Deadlock)를 원천 차단
        Assets lockedFromAsset;
        Assets lockedToAsset;

        if (fromAsset.getId() < toAsset.getId()) {
            lockedFromAsset = assetRepository.findByIdForUpdate(fromAsset.getId()).get();
            lockedToAsset = assetRepository.findByIdForUpdate(toAsset.getId()).get();
        } else {
            lockedToAsset = assetRepository.findByIdForUpdate(toAsset.getId()).get();
            lockedFromAsset = assetRepository.findByIdForUpdate(fromAsset.getId()).get();
        }

        // 락을 얻은 후 한 번 더 잔고 검증 (그 사이에 다른 트랜잭션이 잔고를 변경했을 수 있음)
        if (lockedFromAsset.getCurrentMoney().compareTo(request.amount()) < 0) {
            throw new IllegalArgumentException("출금 지갑의 잔고가 부족합니다.");
        }

        // 5. 자산 차감 및 증가
        lockedFromAsset.subtractMoney(request.amount());
        lockedToAsset.addMoney(request.amount());

        // 6. 이체 타입 결정
        TransferType transferType = determineTransferType(request.fromType(), request.toType());

        // 7. 이체 내역(TransferHistory) 저장 및 스냅샷 기록
        TransferHistory history = TransferHistory.builder()
                .member(member)
                .fromAsset(lockedFromAsset)
                .toAsset(lockedToAsset)
                .transferType(transferType)
                .amount(request.amount())
                .fromBalanceAfter(lockedFromAsset.getCurrentMoney())
                .toBalanceAfter(lockedToAsset.getCurrentMoney())
                .status(TransferStatus.SUCCESS)
                .requestId(request.requestId())
                .build();

        try {
            transferHistoryRepository.save(history);
        } catch (DataIntegrityViolationException e) {
            // DB Unique 제약 조건 위반 시 (동시에 2개의 스레드가 락 획득 전에 이체 시도한 경우)
            log.warn("[이체 중복 요청 차단] memberId={}, requestId={}", memberId, request.requestId());
            throw new IllegalArgumentException("이미 처리 진행 중이거나 완료된 이체 요청입니다.");
        }

        log.info("[자산 이체 성공] memberId={}, type={}, amount={}", memberId, transferType, request.amount());
    }

    // 주어진 지갑 타입이 본투자(현물 또는 선물) 지갑인지 확인합니다.
    private boolean isRealTradingWallet(AssetType type) {
        return type == AssetType.TRADE_SPOT || type == AssetType.TRADE_FUTURE;
    }

    // 출발 지갑과 도착 지갑의 타입에 따라 TransferType Enum 값을 결정합니다.
    private TransferType determineTransferType(AssetType from, AssetType to) {
        if (from == AssetType.TRADE_SPOT && to == AssetType.TRADE_FUTURE) {
            return TransferType.SPOT_TO_FUTURE;
        } else if (from == AssetType.TRADE_FUTURE && to == AssetType.TRADE_SPOT) {
            return TransferType.FUTURE_TO_SPOT;
        }
        throw new IllegalArgumentException("지원하지 않는 이체 방향입니다.");
    }
}
