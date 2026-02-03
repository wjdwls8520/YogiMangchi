package com.yogimangchi.client.kis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@ToString
@NoArgsConstructor
public class KisTokenResponse {

    @JsonProperty("access_token") // JSON의 "access_token"을
    private String accessToken;   // 자바의 "accessToken"에 담아라!

    @JsonProperty("token_type")
    private String tokenType;

    @JsonProperty("expires_in")
    private int expiresIn;
}