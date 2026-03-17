package com.yogimangchi.domain.asset.entity;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
public class Assets {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AssetType type; // 1=현물, 2=선물, 3=대회

    @Column(name = "seed_money", nullable = false, precision = 19, scale = 4)
    private BigDecimal seedMoney;

    @Column(name = "current_money", nullable = false, precision = 19, scale = 4)
    private BigDecimal currentMoney;

    @Column(nullable = false)
    private String status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
