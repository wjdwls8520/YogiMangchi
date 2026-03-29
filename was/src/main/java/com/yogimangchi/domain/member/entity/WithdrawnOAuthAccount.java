package com.yogimangchi.domain.member.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(name = "withdrawn_oauth_account")
public class WithdrawnOAuthAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "oauth_account_id", nullable = false)
    private Long oauthAccountId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 100)
    private String providerUserId;

    @Column(name = "oauth_created_at", nullable = false)
    private LocalDateTime oauthCreatedAt;

    @Column(name = "oauth_updated_at", nullable = false)
    private LocalDateTime oauthUpdatedAt;

    @CreationTimestamp
    @Column(name = "withdrawn_at", nullable = false, updatable = false)
    private LocalDateTime withdrawnAt;

    protected WithdrawnOAuthAccount() {
    }

    public static WithdrawnOAuthAccount from(OAuthAccount oauthAccount) {
        WithdrawnOAuthAccount withdrawnOAuthAccount = new WithdrawnOAuthAccount();
        withdrawnOAuthAccount.oauthAccountId = oauthAccount.getId();
        withdrawnOAuthAccount.memberId = oauthAccount.getMember().getId();
        withdrawnOAuthAccount.email = oauthAccount.getEmail();
        withdrawnOAuthAccount.provider = oauthAccount.getProvider();
        withdrawnOAuthAccount.providerUserId = oauthAccount.getProviderUserId();
        withdrawnOAuthAccount.oauthCreatedAt = oauthAccount.getCreatedAt();
        withdrawnOAuthAccount.oauthUpdatedAt = oauthAccount.getUpdatedAt();
        return withdrawnOAuthAccount;
    }
}
