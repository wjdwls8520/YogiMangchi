package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.entity.UserQuest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserQuestRepository extends JpaRepository<UserQuest, Long> {

    // 회원 ID로 퀘스트 진행 정보를 조회
    Optional<UserQuest> findByMemberId(Long memberId);
}
