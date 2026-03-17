package com.yogimangchi.domain.auth.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SignupRequest(
        String signupToken,
        String nickname,
        Integer profileImg,
        boolean termAgree,
        boolean privateAgree,
        String profileMsg
) {
}
