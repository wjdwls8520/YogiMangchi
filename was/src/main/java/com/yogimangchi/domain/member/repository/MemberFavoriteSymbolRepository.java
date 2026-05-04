package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.entity.MemberFavoriteSymbol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberFavoriteSymbolRepository extends JpaRepository<MemberFavoriteSymbol, Long> {


    @Query("SELECT mfs FROM MemberFavoriteSymbol mfs " +
           "JOIN FETCH mfs.marketSymbol " +
           "WHERE mfs.member.id = :memberId " +
           "ORDER BY mfs.createdAt DESC")
    List<MemberFavoriteSymbol> findAllByMemberIdWithSymbol(@Param("memberId") Long memberId);

    // 특정 회원이 특정 심볼을 즐겨찾기 했는지 확인하기 위해 단건 조회합니다. (주로 삭제 시 사용)
    Optional<MemberFavoriteSymbol> findByMemberIdAndMarketSymbolSymbol(Long memberId, String symbol);

    // 특정 회원이 특정 심볼을 즐겨찾기 했는지 여부를 boolean으로 반환합니다. (중복 추가 방지 시 사용)
    boolean existsByMemberIdAndMarketSymbolSymbol(Long memberId, String symbol);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM MemberFavoriteSymbol mfs WHERE mfs.member.id = :memberId AND mfs.marketSymbol.symbol = :symbol")
    void deleteFavoriteSymbol(@Param("memberId") Long memberId, @Param("symbol") String symbol);

    // PostgreSQL 전용 네이티브 쿼리: 즐겨찾기를 추가하되, 중복 데이터(따닥)가 들어오면 무시합니다.
    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "INSERT INTO member_favorite_symbol (member_id, symbol, created_at) " +
                   "VALUES (:memberId, :symbol, NOW()) " +
                   "ON CONFLICT (member_id, symbol) DO NOTHING", nativeQuery = true)
    void insertFavoriteSymbolIgnoreConflict(@Param("memberId") Long memberId, @Param("symbol") String symbol);
}
