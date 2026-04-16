package com.yogimangchi.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync // 스프링 프레임워크의 비동기 처리 기능을 활성화합니다. (@Async 어노테이션 사용 가능)
public class AsyncConfig {

    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 기본적으로 유지할 스레드 수, 항상 5개의 스레드는 대기 상태로 유지됩니다.
        executor.setCorePoolSize(5);

        // 최대 스레드 수, 작업이 몰릴 때 최대 10개까지 스레드를 늘릴 수 있습니다.
        executor.setMaxPoolSize(10);

        // 큐 대기 용량, 5개의 스레드가 모두 일하고 있을 때, 추가 요청이 오면 100개까지 Queue)에 대기합니다. 큐까지 꽉 차면 그때 MaxPoolSize(10개)까지 스레드가 늘어납니다.
        executor.setQueueCapacity(100);

        // 스레드 이름 접두사, 로그를 볼 때 비동기 스레드임을 식별하기 쉽게 "email-async-1" 식으로 이름을 붙입니다.
        executor.setThreadNamePrefix("email-async-");

        // 종료 시 작업 완료 대기 설정, 서버가 꺼질 때(Shutdown), 진행 중인 비동기 작업이 있다면 바로 종료하지 않고 기다려줍니다.
        executor.setWaitForTasksToCompleteOnShutdown(true);

        // 최대 대기 시간, 위 5번 설정에 의해 기다릴 때, 최대 30초까지만 기다려줍니다. (30초 지나면 강제 종료)
        executor.setAwaitTerminationSeconds(30);

        // 설정을 적용하며 초기화합니다.
        executor.initialize();

        return executor;
    }
}
