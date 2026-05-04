package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.entity.MemberFavoriteSymbol;
import com.yogimangchi.domain.member.repository.MemberFavoriteSymbolRepository;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.global.exception.market.MarketException;
import com.yogimangchi.global.exception.member.MemberException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 마켓 심볼 즐겨찾기 관련 비즈니스 로직을 담당하는 서비스 클래스
 */
@Service
@RequiredArgsConstructor
public class FavoriteSymbolService {

    private final MemberFavoriteSymbolRepository favoriteSymbolRepository;
    private final MemberRepository memberRepository;
    private final MarketSymbolRepository marketSymbolRepository;

    // 즐겨찾기 추가 로직
    @Transactional
    public void addFavorite(Long memberId, String symbol) {
        // 1. 회원 엔티티 조회 (유효한 사용자인지 검증)
        if (!memberRepository.existsById(memberId)) {
            throw MemberException.memberNotFound();
        }

        // 2. 심볼 엔티티 조회 (유효한 코인인지 검증)
        if (!marketSymbolRepository.existsById(symbol)) {
            throw MarketException.symbolNotFound();
        }

        // 3. PostgreSQL 네이티브 쿼리로 INSERT 시도 (중복 시 DB 레벨에서 무시되어 멱등성 보장 및 롤백 방지)
        favoriteSymbolRepository.insertFavoriteSymbolIgnoreConflict(memberId, symbol);
    }

    // 즐겨찾기 삭제 로직
    @Transactional
    public void removeFavorite(Long memberId, String symbol) {
        // 단건 DELETE 쿼리를 직접 수행하여 네트워크 I/O 최소화 (없어도 무시되어 멱등성 보장)
        favoriteSymbolRepository.deleteFavoriteSymbol(memberId, symbol);
    }

    // 즐겨찾기 목록 조회 로직
    @Transactional(readOnly = true)
    public List<String> getFavoriteSymbols(Long memberId) {
        // Repository에서 JOIN FETCH로 최적화된 N+1 방지 엔티티 목록을 가져옴
        return favoriteSymbolRepository.findAllByMemberIdWithSymbol(memberId).stream()
                // 프론트엔드 구조(string[])에 맞게 심볼 ID 문자열만 추출
                .map(favorite -> favorite.getMarketSymbol().getSymbol())
                .collect(Collectors.toList());
    }
}
