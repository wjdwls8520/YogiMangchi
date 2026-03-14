1. 의존성 추가
2. oauth app key 생성
3. yml에 추가( 환경변수 )
[프로젝트구조]
was/src/main/java/com/yogimangchi
├── global
│   ├── config (보안 설정 자체)
│   │   └── SecurityConfig.java
│   └── auth
│       └── oauth
│           ├── dto (구글/카카오에서 받은 사용자 정보를 담는 객체)
│           │   └── SocialUserInfo.java
│           ├── principal (Spring Security가 인증 객체로 들고 다닐 사용자 객체)
│           │   └── CustomOAuth2User.java
│           └── service (실제로 구글/카카오 응답을 해석하는 서비스)
│               └── CustomOAuth2UserService.java

4. SecurityConfig.java 작성 (보안 설정) 
5. SocialUserInfo.java 작성 ( 구글/카카오 사용자 정보를 공통 형식으로 담는 DTO ) 
6. CustomOAuth2User.java 작성 ( Spring Security가 인증 성공 후 들고 다닐 사용자 객체 ) 
7. CustomOAuth2UserService.java 작성 ( 구글/카카오 응답을 읽어서 SocialUserInfo로 바꾸는 서비스 )
8. SecurityConfig.java 수정 ( oauth2Login() 수정 ) 
9. OAuth2SuccessHandler.java 작성 ( 소셜로그인완료 후 처음회원인지 우리회원인지 판단 )
10. SecurityConfig.java 수정 ( successHandler() 수정 )
11. 


   
   JWT 발급
   signup token 발급
   회원가입 API 연결