package com.yogimangchi.domain.report.controller.v1;

import com.yogimangchi.domain.report.dto.response.ReportReasonTypeResponseDto;
import com.yogimangchi.domain.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/report")
@RequiredArgsConstructor
@Tag(name = "Report", description = "커뮤니티 신고 관련 API")
public class ReportTypeController {

    private final ReportService reportService;

    @Operation(
            summary = "신고 enum 리스트",
            description = "신고 사유 코드와 한글명을 함께 조회합니다. [ 셀렉박스용 ]"
    )
    @GetMapping("/type/community")
    public ResponseEntity<List<ReportReasonTypeResponseDto>> getResponseReportTypeByCommunity() {
        List<ReportReasonTypeResponseDto> response = reportService.getResponseReportTypeByCommunity();

        return ResponseEntity.ok(response);
    }
}
