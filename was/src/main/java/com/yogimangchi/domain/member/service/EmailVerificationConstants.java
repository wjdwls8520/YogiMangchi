package com.yogimangchi.domain.member.service;

import java.time.Duration;

public final class EmailVerificationConstants {

    private EmailVerificationConstants() {}

    public static final String EMAIL_VERIFY_PREFIX = "email:verify:";
    public static final String EMAIL_VERIFIED_PREFIX = "email:verified:";
    public static final Duration CODE_TTL = Duration.ofMinutes(5);
    public static final long RESEND_COOLDOWN_SECONDS = 60;
    public static final Duration VERIFIED_FLAG_TTL = Duration.ofHours(1);
}
