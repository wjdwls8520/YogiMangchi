package com.yogimangchi;

import com.yogimangchi.client.kis.KisProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(KisProperties.class)
public class YogiMangchiApplication {

    public static void main(String[] args) {
        SpringApplication.run(YogiMangchiApplication.class, args);
    }

}
