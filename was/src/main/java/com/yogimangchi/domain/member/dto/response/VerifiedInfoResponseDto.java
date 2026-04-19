package com.yogimangchi.domain.member.dto.response;

public record VerifiedInfoResponseDto(
        String phoneNumber,
        String addressCode,
        String address1,
        String address2,
        String verifiedEmail,
        Boolean isVeried
) {}
