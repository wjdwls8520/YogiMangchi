package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.dto.response.MyContestLatestRejectedApplicationDto;
import com.yogimangchi.domain.contest.service.ContestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/contest")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
@Tag(name = "99 - A1 - Contest (me)", description = "내 대회 관련 api")
public class MyContestController {

    private final ContestService contestService;

    @Operation(
            summary = "내 최근 반려된 대회 신청 이력 조회",
            description = "알림함이나 메시지함 기능이 생기기 전까지 사용하는 예비 조회 api 입니다. 로그인한 회원의 가장 최근 반려된 대회 신청 이력 1건을 조회합니다."
    )
    @GetMapping("/rejected-applications/latest")
    public ResponseEntity<MyContestLatestRejectedApplicationDto> getMyLatestRejectedContestApplication(
            @AuthenticationPrincipal Long loginMemberId
    ) {
        MyContestLatestRejectedApplicationDto latestRejectedApplication =
                contestService.getMyLatestRejectedContestApplication(loginMemberId);

        if (latestRejectedApplication == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(latestRejectedApplication);
    }
}
