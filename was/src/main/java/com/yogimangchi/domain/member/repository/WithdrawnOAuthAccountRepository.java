package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.entity.WithdrawnOAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawnOAuthAccountRepository extends JpaRepository<WithdrawnOAuthAccount, Long> {
}
