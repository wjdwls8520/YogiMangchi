package com.yogimangchi.domain.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_quest")
@Comment("사용자별 본투자 해금 퀘스트 관리")
public class UserQuest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @Comment("회원 ID")
    private Member member;

    @Column(name = "practice_order_count", nullable = false)
    @Comment("모의투자 체결 완료 횟수")
    private int practiceOrderCount = 0;

    @Column(name = "is_unlocked", nullable = false)
    @Comment("본투자 기능 해금 여부 (TRUE: 해금됨, FALSE: 잠김)")
    private boolean isUnlocked = false;

    // 가입 시 최초 생성을 위한 정적 팩토리 메서드
    public static UserQuest createInitialQuest(Member member) {
        UserQuest quest = new UserQuest();
        quest.member = member;
        quest.practiceOrderCount = 0;
        quest.isUnlocked = false;
        return quest;
    }

    // 체결 횟수 증가 로직 (이미 해금된 상태라면 카운트를 올리지 않음)
    public void increaseCount() {
        if (this.isUnlocked) {
            return;
        }
        this.practiceOrderCount++;
    }

    // 해금 가능 여부 확인 (체결 3회 이상)
    public boolean canUnlock() {
        return this.practiceOrderCount >= 3;
    }

    // 해금 처리 실행
    public void unlock() {
        if (canUnlock()) {
            this.isUnlocked = true;
        }
    }
}
