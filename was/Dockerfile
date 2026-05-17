# ==========================================
# 1단계: 빌드 스테이지 (깨끗한 환경에서 JAR 구워내기)
# ==========================================
FROM gradle:8.5-jdk17-alpine AS builder
WORKDIR /app

# 빌드에 필요한 소스 코드와 정적 리소스(이미지 포함) 전체를 무식하게 다 복사!
COPY . .

# static 폴더 내 이미지까지 완벽하게 흡수되도록 도커 안에서 직접 빌드 수행
RUN ./gradlew bootJar --no-daemon

# ==========================================
# 2단계: 실행 스테이지 (프리티어 메모리 다이어트 가동)
# ==========================================
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# 1단계 방(builder)에서 이미지 파일까지 100% 꽉꽉 눌러 담아 완벽하게 추출된 jar만 쏙 가져옴
COPY --from=builder /app/build/libs/*SNAPSHOT.jar app.jar

# 프리티어 메모리 방어선 구축 (기존 설정 완벽 유지 👍)
ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "app.jar"]