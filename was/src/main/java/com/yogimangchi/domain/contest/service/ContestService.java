package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.entity.ContestApplicant;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.repository.ContestApplicantRepository;
import com.yogimangchi.domain.contest.repository.ContestSeasonRepository;
import com.yogimangchi.domain.contest.validator.ContestApplicationValidator;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.global.dto.CursorResponseDto;
import com.yogimangchi.global.exception.contest.ContestException;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestSeasonRepository contestSeasonRepository;
    private final ContestApplicantRepository contestApplicantRepository;
    private final ContestApplicationValidator contestApplicationValidator;

    private final MemberReader memberReader;

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonDetailDto> getRecruitingContestSeasons(ContestSeasonSearchDto request) {
        // 요청 size 를 기본값/최댓값 규칙에 맞게 정리한다.
        int limitSize = request.getOrDefaultSize();

        // 모집중인 시즌만 커서 방식으로 size + 1 개까지 조회한다.
        List<ContestSeason> contestSeasons = contestSeasonRepository.searchRecruitingContestSeasons(request);

        // 더 이상 내려줄 시즌이 없으면 빈 커서 응답을 반환한다.
        if (contestSeasons.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        // 요청 개수보다 많이 조회됐으면 다음 페이지가 있다는 뜻이다.
        boolean hasNext = contestSeasons.size() > limitSize;

        // 다음 페이지 판단용으로 더 가져온 한 건은 응답에서 제거한다.
        if (hasNext) {
            contestSeasons = new ArrayList<>(contestSeasons.subList(0, limitSize));
        }

        // 엔티티 목록을 응답 DTO 목록으로 변환한다.
        List<ContestSeasonDetailDto> content = contestSeasons.stream()
                .map(ContestSeasonDetailDto::from)
                .toList();

        // 다음 요청에 사용할 커서는 마지막 시즌 ID 로 정한다.
        Long nextCursorId = hasNext && !contestSeasons.isEmpty()
                ? contestSeasons.get(contestSeasons.size() - 1).getId()
                : null;

        // content, nextCursorId, hasNext 를 커서 응답으로 묶어 반환한다.
        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional
    public void applyContestSeason(Long loginMemberId, Long seasonId) {
        // 로그인한 회원이 실제로 존재하는지 먼저 확인한다.
        Member member = memberReader.getAuthenticated(loginMemberId);

        // 신청 대상 대회 시즌이 존재하는지 확인한다.
        ContestSeason contestSeason = contestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 현재 시즌이 모집중 상태인지 검증한다.
        contestApplicationValidator.validateRecruitingContestSeason(contestSeason);

        // 같은 회원이 같은 시즌에 이미 신청했는지 먼저 확인한다.
        if (contestApplicantRepository.existsByMemberAndContestSeason(member, contestSeason)) {
            throw ContestException.duplicateApplication();
        }

        try {
            // 검증을 통과하면 대회 신청 내역을 저장한다.
            contestApplicantRepository.save(ContestApplicant.create(contestSeason, member));
        } catch (DataIntegrityViolationException e) {
            // 동시 요청으로 유니크 제약이 걸려도 중복 신청 예외로 통일한다.
            throw ContestException.duplicateApplication();
        }
    }
}
