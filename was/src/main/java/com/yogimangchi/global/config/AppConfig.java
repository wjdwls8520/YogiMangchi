package com.yogimangchi.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppConfig {

    // 환경 변수나 .env(설정파일)에 정의된 값을 가져옴
    @Value("${DOMAIN_ADDRESS:http://localhost:3000}")
    private String domainAddress;

    // Getter 메서드를 통해 다른 클래스에서 값을 가져갈 수 있게 합니다.
    public String getDomainAddress() {
        return domainAddress;
    }

    // 도메인과 특정 경로를 조합하는 편의 메서드를 미리 만들어둘 수도 있습니다.
    public String getFrontUrl(String path) {
        return domainAddress + path;
    }

}
