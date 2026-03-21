package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.member.dto.MemberResponseDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public MemberResponseDto.myProfileInfo getMyProfile(Long memberId) {

        Member findMember = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        MemberResponseDto.myProfileInfo responseDto = new MemberResponseDto.myProfileInfo(
                findMember.getId(),
                "google",
                findMember.getNickname(),
                findMember.getProfileImgUrl(),
                findMember.isTermAgree(),
                findMember.isPrivateAgree()
        );

        return responseDto;
    }
}
