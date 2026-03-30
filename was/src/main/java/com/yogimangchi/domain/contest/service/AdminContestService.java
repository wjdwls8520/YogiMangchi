package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminContestService {

    private final MemberReader memberReader;

    @Transactional
    public ContestSeasonDetailDto createContest(Long adminId, ContestCreateDto request) {
        memberReader.getAuthenticated(adminId);
        throw new UnsupportedOperationException("대회 생성 로직은 아직 구현 전입니다.");
    }
}
