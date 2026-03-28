package com.yogimangchi.domain.community.support;

import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommunityMemberReader {

    private final MemberRepository memberRepository;

    public Member getAuthenticated(Long loginMemberId) {
        if (loginMemberId == null) {
            throw new IllegalArgumentException("로그인 이후 이용할 수 있습니다.");
        }

        return memberRepository.findById(loginMemberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
    }
}
