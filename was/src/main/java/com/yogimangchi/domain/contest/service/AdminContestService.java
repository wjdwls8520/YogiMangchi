package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.dto.query.ContestSeasonQueryDto;
import com.yogimangchi.domain.contest.dto.query.ContestApplicantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantStatusUpdateDto;
import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonStatusUpdateDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonUpdateDto;
import com.yogimangchi.domain.contest.dto.response.ContestApplicantDto;
import com.yogimangchi.domain.contest.dto.response.ContestApplicantStatusResponseDto;
import com.yogimangchi.domain.contest.entity.ContestApplicant;
import com.yogimangchi.domain.contest.enums.ContestApplicantStatus;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonStatusResponseDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.repository.AdminContestSeasonRepository;
import com.yogimangchi.domain.contest.repository.ContestApplicantRepository;
import com.yogimangchi.domain.contest.validator.ContestSeasonValidator;
import com.yogimangchi.global.dto.CursorResponseDto;
import com.yogimangchi.global.exception.contest.ContestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminContestService {

    private final AdminContestSeasonRepository adminContestRepository;
    private final ContestApplicantRepository contestApplicantRepository;
    private final ContestSeasonValidator contestSeasonValidator;

    @Transactional
    public ContestSeasonDetailDto createContest(Long adminId, ContestCreateDto request) {
        contestSeasonValidator.validateCreateRequest(request);

        ContestSeason contestSeason = ContestSeason.create(
                request.title(),
                request.description(),
                request.recruitmentStartAt(),
                request.recruitmentEndAt(),
                request.contestStartAt(),
                request.contestEndAt()
        );
        ContestSeason savedContestSeason = adminContestRepository.save(contestSeason);

        return ContestSeasonDetailDto.from(savedContestSeason);
    }

    @Transactional
    public ContestSeasonDetailDto updateContestSeason(Long adminId, Long seasonId, ContestSeasonUpdateDto request) {
        contestSeasonValidator.validateUpdateRequest(request);

        ContestSeason contestSeason = adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        contestSeason.updateSeasonInfo(
                request.title(),
                request.description(),
                request.recruitmentStartAt(),
                request.recruitmentEndAt(),
                request.contestStartAt(),
                request.contestEndAt()
        );

        return ContestSeasonDetailDto.from(contestSeason);
    }

    @Transactional
    public ContestSeasonDetailDto updateContestSeasonStatus(Long adminId, Long seasonId, ContestSeasonStatusUpdateDto request) {
        ContestSeason contestSeason = adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        contestSeason.updateStatus(request.status());

        return ContestSeasonDetailDto.from(contestSeason);

    }

    @Transactional(readOnly = true)
    public List<ContestApplicantStatusResponseDto> getContestApplicantStatuses() {
        return List.of(ContestApplicantStatus.values()).stream()
                .map(ContestApplicantStatusResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestApplicantDto> getContestApplicants(Long seasonId, ContestApplicantSearchDto request) {
        adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        List<ContestApplicantQueryDto> applicants = contestApplicantRepository.searchContestApplicants(seasonId, request);

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = applicants.size() > limitSize;

        if (hasNext) {
            applicants.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!applicants.isEmpty()) {
            nextCursorId = applicants.get(applicants.size() - 1).applicantId();
        }

        List<ContestApplicantDto> content = applicants.stream()
                .map(applicant -> new ContestApplicantDto(
                        applicant.applicantId(),
                        applicant.memberId(),
                        applicant.nickname(),
                        applicant.profileImgUrl(),
                        applicant.createdAt(),
                        applicant.updatedAt(),
                        ContestApplicantStatusResponseDto.from(applicant.status())
                ))
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional
    public ContestApplicantDto updateContestApplicantStatus(
            Long adminId,
            Long seasonId,
            Long applicantId,
            ContestApplicantStatusUpdateDto request
    ) {
        ContestApplicant contestApplicant = contestApplicantRepository.findByIdAndContestSeasonId(applicantId, seasonId)
                .orElseThrow(ContestException::contestApplicantNotFound);

        contestApplicant.updateStatus(request.status());

        return ContestApplicantDto.from(contestApplicant);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonDetailDto> getContestSeasons(ContestSeasonSearchDto request) {
        List<ContestSeasonQueryDto> seasons = adminContestRepository.searchContestSeasons(request);

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = seasons.size() > limitSize;

        if (hasNext) {
            seasons.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!seasons.isEmpty()) {
            nextCursorId = seasons.get(seasons.size() - 1).id();
        }

        List<ContestSeasonDetailDto> content = seasons.stream()
            .map(season -> new ContestSeasonDetailDto(
                    season.id(),
                    season.title(),
                    season.description(),
                    season.recruitmentStartAt(),
                    season.recruitmentEndAt(),
                    season.contestStartAt(),
                    season.contestEndAt(),
                    season.createdAt(),
                    season.updatedAt(),
                    ContestSeasonStatusResponseDto.from(season.status()),
                    false
            ))
            .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }
}
