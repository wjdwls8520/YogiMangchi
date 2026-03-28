package com.yogimangchi.global.support;

import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MemberReader {

    private final MemberRepository memberRepository;

    // 로그인 정보를 가져와 존재하는 회원인지 체크 존재한다면 반환
    public Member getAuthenticated(Long loginMemberId) {
        if (loginMemberId == null) {
            throw new IllegalArgumentException("로그인 이후 이용할 수 있습니다.");
        }

        return memberRepository.findById(loginMemberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
    }

    // 파라미터로 받은 authorMemberId를 가져와 존재하는 회원인지 체크 존재한다면 반환
    public Member getFindMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
    }
}
