package com.yogimangchi.domain.chartist.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "차티스트 대회 순위 정보 응답")
public record ChartistRankingDto(
        @Schema(description = "순위", example = "1")
        Integer rank,

        @Schema(description = "대회 참가자 ID (커서용)", example = "10")
        Long participantId,

        @Schema(description = "회원 ID", example = "101")
        Long memberId,

        @Schema(description = "회원 닉네임", example = "요기망치")
        String nickname,

        @Schema(description = "회원 프로필 이미지 URL", example = "https://example.com/profile.png", nullable = true)
        String profileImgUrl,

        @Schema(description = "최종 실현 손익", example = "1500.50")
        BigDecimal realizedPnl,

        @Schema(description = "최종 수익률 (%)", example = "15.25")
        BigDecimal profitRate
) {
}
