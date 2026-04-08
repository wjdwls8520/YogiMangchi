package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.participant.dto.response.ContestParticipationSeasonDto;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.application.dto.response.MyContestPendingApplicationDto;
import com.yogimangchi.domain.contest.application.dto.response.MyContestLatestRejectedApplicationDto;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonStatusResponseDto;
import com.yogimangchi.domain.contest.application.dto.query.MyContestPendingApplicationQueryDto;
import com.yogimangchi.domain.contest.application.dto.query.MyContestLatestRejectedApplicationQueryDto;
import com.yogimangchi.domain.contest.application.entity.ContestApplicant;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.enums.ContestSeasonDisplayStatus;
import com.yogimangchi.domain.contest.application.repository.ContestApplicantRepository;
import com.yogimangchi.domain.contest.participant.repository.ContestParticipantRepository;
import com.yogimangchi.domain.contest.application.repository.ContestRejectedApplicantRepository;
import com.yogimangchi.domain.contest.season.repository.ContestSeasonRepository;
import com.yogimangchi.domain.contest.application.validator.ContestApplicationValidator;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.global.dto.CursorResponseDto;
import com.yogimangchi.global.exception.contest.ContestException;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestSeasonRepository contestSeasonRepository;
    private final ContestApplicantRepository contestApplicantRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final ContestRejectedApplicantRepository contestRejectedApplicantRepository;
    private final ContestApplicationValidator contestApplicationValidator;

    private final MemberReader memberReader;

    @Transactional(readOnly = true)
    public List<ContestSeasonStatusResponseDto> getContestSeasonStatuses() {
        return List.of(ContestSeasonDisplayStatus.values()).stream()
                .map(ContestSeasonStatusResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MyContestLatestRejectedApplicationDto getMyLatestRejectedContestApplication(Long loginMemberId) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        MyContestLatestRejectedApplicationQueryDto latestRejectedApplication =
                contestRejectedApplicantRepository.findLatestRejectedApplication(member.getId());

        if (latestRejectedApplication == null) {
            return null;
        }

        return latestRejectedApplication.toResponseDto(now);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<MyContestPendingApplicationDto> getMyPendingContestApplications(
            Long loginMemberId,
            ContestCursorSearchDto request
    ) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        List<MyContestPendingApplicationQueryDto> pendingApplications =
                contestApplicantRepository.searchPendingContestApplications(member.getId(), request);

        int limitSize = request.getOrDefaultSize();

        if (pendingApplications.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = pendingApplications.size() > limitSize;

        if (hasNext) {
            pendingApplications = new ArrayList<>(pendingApplications.subList(0, limitSize));
        }

        List<MyContestPendingApplicationDto> content = pendingApplications.stream()
                .map(application -> application.toResponseDto(now))
                .toList();

        Long nextCursorId = hasNext
                ? pendingApplications.get(pendingApplications.size() - 1).applicantId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestParticipationSeasonDto> getMyParticipatingContestSeasons(
            Long loginMemberId,
            ContestCursorSearchDto request
    ) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        List<ContestParticipationSeasonQueryDto> participationSeasons =
                contestParticipantRepository.searchParticipatingContestSeasons(member.getId(), request, now);

        return toContestParticipationCursorResponse(participationSeasons, request.getOrDefaultSize(), now);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestParticipationSeasonDto> getMemberContestParticipationSeasons(
            Long memberId,
            ContestCursorSearchDto request
    ) {
        Member member = memberReader.getFindMember(memberId);
        LocalDateTime now = LocalDateTime.now();

        List<ContestParticipationSeasonQueryDto> participationSeasons =
                contestParticipantRepository.searchContestParticipationSeasons(member.getId(), request, now);

        return toContestParticipationCursorResponse(participationSeasons, request.getOrDefaultSize(), now);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonDetailDto> getApplicableContestSeasons(Long loginMemberId, ContestSeasonSearchDto request) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        int limitSize = request.getOrDefaultSize();

        List<ContestSeason> contestSeasons = contestSeasonRepository.searchApplicableContestSeasons(request, now);

        if (contestSeasons.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = contestSeasons.size() > limitSize;

        if (hasNext) {
            contestSeasons = new ArrayList<>(contestSeasons.subList(0, limitSize));
        }

        List<Long> seasonIds = contestSeasons.stream()
                .map(ContestSeason::getId)
                .toList();
        List<Long> pendingSeasonIds = contestApplicantRepository.findPendingSeasonIds(member.getId(), seasonIds);

        List<Long> participatingSeasonIds = contestParticipantRepository.findParticipatingSeasonIds(member.getId(), seasonIds);

        List<ContestSeasonDetailDto> content = contestSeasons.stream()
                .map(contestSeason -> ContestSeasonDetailDto.from(
                        contestSeason,
                        pendingSeasonIds.contains(contestSeason.getId())
                                || participatingSeasonIds.contains(contestSeason.getId()),
                        now
                ))
                .toList();

        Long nextCursorId = hasNext && !contestSeasons.isEmpty()
                ? contestSeasons.get(contestSeasons.size() - 1).getId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional
    public void applyContestSeason(Long loginMemberId, Long seasonId) {
        Member member = memberReader.getAuthenticated(loginMemberId);

        ContestSeason contestSeason = contestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        contestApplicationValidator.validateApplicableContestSeason(contestSeason);

        if (contestApplicantRepository.existsByMemberAndContestSeason(member, contestSeason)) {
            throw ContestException.duplicateApplication();
        }

        if (contestParticipantRepository.existsByMemberAndContestSeason(member, contestSeason)) {
            throw ContestException.alreadyParticipating();
        }

        try {
            contestApplicantRepository.save(ContestApplicant.create(contestSeason, member));
        } catch (DataIntegrityViolationException e) {
            throw ContestException.duplicateApplication();
        }
    }

    private CursorResponseDto<ContestParticipationSeasonDto> toContestParticipationCursorResponse(
            List<ContestParticipationSeasonQueryDto> participationSeasons,
            int limitSize,
            LocalDateTime now
    ) {
        if (participationSeasons.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = participationSeasons.size() > limitSize;

        if (hasNext) {
            participationSeasons = new ArrayList<>(participationSeasons.subList(0, limitSize));
        }

        List<ContestParticipationSeasonDto> content = participationSeasons.stream()
                .map(participationSeason -> participationSeason.toResponseDto(now))
                .toList();

        Long nextCursorId = hasNext
                ? participationSeasons.get(participationSeasons.size() - 1).participantId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }
}
