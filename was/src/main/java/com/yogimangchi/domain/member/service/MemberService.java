package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.member.dto.response.MyProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.NicknameDuplicationDto;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.member.repository.OAuthAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final OAuthAccountRepository oAuthAccountRepository;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public NicknameDuplicationDto isAvailableNickname(String nickname) {
        // 닉네임이 존재하지 않으면 true 존재하면 false를 리턴
        return new NicknameDuplicationDto(!memberRepository.existsByNickname(nickname));
    }

    @Transactional(readOnly = true)
    public MyProfileInfoDto getMyProfile(Long memberId) {

        MyProfileInfoDto myProfileInfo = oAuthAccountRepository.findMyProfileInfo(memberId);

        return myProfileInfo;
    }


}
