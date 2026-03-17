package com.yogimangchi.domain.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SignupTokenService {

    // Redis 에 문자열 기반으로 값을 저장하고 조회할 때 사용하는 스프링 도구입니다.
    // 지금은 signupToken -> SocialUserInfo JSON 문자열 구조로 저장합니다.
    private final StringRedisTemplate stringRedisTemplate;

    // 자바 객체를 JSON 문자열로 바꾸거나, JSON 문자열을 다시 자바 객체로 복원할 때 사용합니다.
    // SocialUserInfo 를 Redis 에 넣으려면 문자열 형태로 직렬화해야 해서 필요합니다.
    private final ObjectMapper objectMapper;

    // signup token 의 유효시간입니다.
    // 신규 회원이 회원가입 화면으로 넘어간 뒤 너무 오래 방치하면 만료되게 만들기 위해 둡니다.
    // 실무적으로 10분~30분 사이를 많이 사용합니다.
    private static final Duration SIGNUP_TOKEN_TTL = Duration.ofMinutes(10); // 10분 타임제한

    // 신규 회원용 signup token 을 생성하는 메서드입니다.
    // 소셜 로그인 직후 받은 SocialUserInfo 를 Redis 에 잠시 저장해두고,
    // 프론트에는 그 데이터를 직접 넘기지 않고 token 만 넘겨서 회원가입 화면으로 이동시키는 용도입니다.
    public String createSignupToken(SocialUserInfo socialUserInfo) throws JsonProcessingException {
        // 가입 진행을 식별할 임시 난수 토큰입니다.
        String token = UUID.randomUUID().toString();

        // Redis key 이름입니다.
        // prefix 를 붙이는 이유는 Redis 안에서 이 값이 어떤 용도의 데이터인지 바로 구분하기 위함입니다.
        String key = "auth:signup:" + token;

        // SocialUserInfo 는 자바 객체라 Redis 에 그대로 못 넣으므로 JSON 문자열로 바꿉니다.
        String value = objectMapper.writeValueAsString(socialUserInfo);

        // key-value 형태로 저장하면서 TTL 도 같이 설정합니다.
        // 즉, 일정 시간이 지나면 Redis 에서 자동 삭제됩니다.
        stringRedisTemplate.opsForValue().set(key, value, SIGNUP_TOKEN_TTL);

        // 프론트에는 이 token 만 전달합니다.
        // 나중에 회원가입 완료 API 에서 이 token 으로 Redis 값을 다시 조회합니다.
        return token;
    }

    // 프론트가 들고 온 signup token 으로 SocialUserInfo 를 다시 꺼내오는 메서드입니다.
    // 회원가입 완료 시점에 "방금 어떤 소셜 계정으로 로그인했는지"를 다시 복원하는 역할입니다.
    public SocialUserInfo getSocialUserInfo(String token) throws JsonProcessingException {
        String key = "auth:signup:" + token;

        // Redis 에서 JSON 문자열을 가져옵니다.
        String value = stringRedisTemplate.opsForValue().get(key);

        // 값이 없다는 뜻은:
        // 1. 토큰이 잘못되었거나
        // 2. 이미 사용했거나
        // 3. TTL 이 지나 만료되었거나
        // 셋 중 하나일 가능성이 큽니다.
        if (value == null) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 signup token 입니다.");
        }

        // JSON 문자열을 다시 SocialUserInfo 객체로 복원해서 반환합니다.
        return objectMapper.readValue(value, SocialUserInfo.class);
    }

    // 회원가입이 끝난 뒤 더 이상 필요 없는 signup token 을 정리하는 메서드입니다.
    // 즉, Redis 에 남아 있는 임시 가입 정보를 삭제하는 역할입니다.
    public void removeSignupToken(String token) {
        String key = "auth:signup:" + token;
        stringRedisTemplate.delete(key);
    }
}
