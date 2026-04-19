package com.yogimangchi.domain.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompleteVerificationRequestDto(
    @NotBlank
    @Pattern(regexp = "^\\d{10,11}$", message = "전화번호는 10~11자리 숫자만 입력해주세요.")
    String phoneNumber,

    @NotBlank @Size(max = 5)
    String addressCode,

    @NotBlank @Size(max = 255)
    String address1,

    @Size(max = 255)
    String address2
) {}
