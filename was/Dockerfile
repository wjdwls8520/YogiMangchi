# /was/Dockerfile

# 1. Java 17 Alpine(경량화) 이미지 사용
FROM openjdk:17-jdk-alpine

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 빌드된 jar 파일 복사 (로컬에서 ./gradlew build를 먼저 실행해야 함,  -plain.jar 제외)
ARG JAR_FILE=build/libs/*SNAPSHOT.jar
COPY ${JAR_FILE} app.jar

# 4. 프리티어 메모리 방어선 구축 (최소 256MB, 최대 512MB 제한)
ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "app.jar"]