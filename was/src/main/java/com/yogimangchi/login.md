# Login

## 1. 로그인 기능 한 줄 요약

이 프로젝트의 로그인은 `소셜 로그인(Google / Kakao) -> 기존 회원 / 신규 회원 분기 -> 기존 회원이면 JWT 쿠키 발급, 신규 회원이면 회원가입 진행` 흐름으로 동작한다.

---

## 2. 현재 로그인 구조

```text
브라우저 요청
-> Spring Security
-> OAuth2 로그인 성공
-> 소셜 사용자 정보 공통 DTO 변환
-> 기존 회원 / 신규 회원 판별
-> 기존 회원이면 JWT 쿠키 발급
-> 신규 회원이면 signupToken 발급 후 회원가입 페이지 이동
```

---

## 3. 패키지 구조 요약

```text
was/src/main/java/com/yogimangchi
├── global
│   ├── config
│   │   └── SecurityConfig.java
│   └── auth
│       ├── oauth
│       │   ├── dto
│       │   │   └── SocialUserInfo.java
│       │   ├── principal
│       │   │   └── CustomOAuth2User.java
│       │   ├── service
│       │   │   └── CustomOAuth2UserService.java
│       │   └── handler
│       │       └── OAuth2SuccessHandler.java
│       └── jwt
│           ├── config
│           │   └── JwtProperties.java
│           ├── service
│           │   └── JwtService.java
│           └── filter
│               └── JwtAuthenticationFilter.java
│
├── domain
│   ├── member
│   │   ├── entity
│   │   │   ├── Member.java
│   │   │   └── OAuthAccount.java
│   │   ├── repository
│   │   │   ├── MemberRepository.java
│   │   │   └── OAuthAccountRepository.java
│   │   └── enums
│   │       └── MemberRole.java
│   └── auth
│       ├── dto
│       │   ├── SocialLoginResult.java
│       │   ├── SignupRequest.java
│       │   ├── SignupInfoResponse.java
│       │   └── SignupResponse.java
│       ├── service
│       │   ├── SocialLoginService.java
│       │   ├── SignupTokenService.java
│       │   └── SignupService.java
│       └── controller
│           └── AuthController.java
```

---

## 4. 로그인 흐름

### 4-1. 기존 회원 로그인

```text
1. 사용자가 Google / Kakao 로그인
2. Spring Security가 소셜 사용자 정보를 읽음
3. CustomOAuth2UserService가 SocialUserInfo로 변환
4. OAuth2SuccessHandler가 SocialLoginService 호출
5. OAuthAccountRepository로 provider + providerUserId 조회
6. 기존 회원이면 memberId 반환
7. JwtService가 access token / refresh token 생성
8. 쿠키에 저장
9. 메인 페이지로 redirect
```

### 4-2. 신규 회원 로그인

```text
1. 사용자가 Google / Kakao 로그인
2. Spring Security가 소셜 사용자 정보를 읽음
3. CustomOAuth2UserService가 SocialUserInfo로 변환
4. OAuth2SuccessHandler가 SocialLoginService 호출
5. OAuthAccountRepository 조회 결과 없음
6. SignupTokenService가 signupToken 생성
7. SocialUserInfo를 Redis에 저장
8. /signup?token=... 으로 redirect
```

### 4-3. 신규 회원 가입 완료

```text
1. 프론트가 signupToken으로 signup-info 조회
2. 회원가입 폼 입력
3. POST /api/auth/signup 호출
4. SignupService가 Redis에서 SocialUserInfo 복원
5. Member 저장
6. OAuthAccount 저장
7. signupToken 삭제
8. JwtService가 JWT 생성
9. 쿠키 저장
10. 로그인 완료
```

---

## 5. 핵심 개념

### provider
- 어떤 소셜 로그인인지 구분하는 값
- 예: `google`, `kakao`

### providerUserId
- 그 소셜 서비스 안에서 사용자를 구분하는 고유값
- Google: `sub`
- Kakao: `id`

### signupToken
- JWT가 아님
- 신규 회원가입 진행을 위한 임시 토큰
- Redis에 저장된 `SocialUserInfo`를 찾는 키 역할

### access token
- 짧은 수명의 로그인 토큰
- 이후 API 요청 인증에 사용

### refresh token
- 더 긴 수명의 재발급용 토큰
- access token 만료 후 재발급에 사용

---

## 6. 현재 기준으로 완료된 것

- Google / Kakao 소셜 로그인
- SocialUserInfo 공통 DTO 변환
- 기존 회원 / 신규 회원 판별
- 기존 회원 JWT 쿠키 발급
- 신규 회원 signupToken 발급 + Redis 저장
- 회원가입 정보 조회 API
- 회원가입 완료 API
- JWT 쿠키 기반 인증 필터 연결

---

## 7. 현재 기준으로 아직 추가 가능한 것

- refresh token 재발급 API
- 로그아웃 API
- 현재 로그인 사용자 조회 API
- JWT 권한(role) 확장
- CSRF 전략 정교화
- refresh token 저장 / 폐기 전략 강화

---

## 8. 이 구조의 장점

- `member`와 `auth`를 분리해서 역할이 명확하다
- `oauth`와 `jwt`를 분리해서 기술 책임이 깔끔하다
- 신규 회원가입과 기존 로그인 흐름이 분리되어 있다
- 학습용으로도, 중소~중간 규모 서비스용으로도 충분히 좋은 구조다

---

## 9. 한 줄 정리

이 로그인 구조는 `소셜 로그인 -> 회원 판별 -> JWT 로그인 완료`를 단계적으로 나눈 실용적인 구조다.
