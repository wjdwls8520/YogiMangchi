package com.yogimangchi.client.kis.dto;

public record KisTokenResponse(String access_token, String token_type, int expires_in) {}
