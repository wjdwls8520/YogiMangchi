package com.yogimangchi.domain.member.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailSendRequestDto(
        @NotBlank @Email
        String email
) {}

