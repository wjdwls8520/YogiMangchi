package com.yogimangchi.domain.member.entity;

import com.yogimangchi.domain.market.entity.MarketSymbol;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 스펙상 기본 생성자가 필요하며, 외부에서 무분별한 생성을 막기 위해 PROTECTED 사용
@Table(
        name = "member_favorite_symbol",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_member_favorite_symbol",
                        columnNames = {"member_id", "symbol"}
                )
        }
)
@Comment("회원 마켓 심볼 즐겨찾기 관리")
public class MemberFavoriteSymbol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @Comment("회원 ID")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "symbol", nullable = false)
    @Comment("즐겨찾기한 마켓 심볼")
    private MarketSymbol marketSymbol;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("즐겨찾기 추가 일시")
    private LocalDateTime createdAt;

    @Builder
    protected MemberFavoriteSymbol(Member member, MarketSymbol marketSymbol) {
        this.member = member;
        this.marketSymbol = marketSymbol;
    }
}
