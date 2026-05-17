# /web/Dockerfile

# --- 1단계: 빌드 스테이지 ---
FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json* ./
RUN npm ci

# 소스 복사 및 독립형(Standalone) 빌드 진행
COPY . .

ENV NEXT_PUBLIC_API_URL=http://13.125.99.130.nip.io

RUN npm run build


# --- 2단계: 실행 스테이지 ---
FROM node:20-alpine AS runner
WORKDIR /app

# 보안을 위한 권한 설정
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js 이미지 최적화(<Image> 태그) 사용을 위한 sharp 강제 설치
RUN npm install sharp

# 빌드 스테이지에서 필요한 파일만 쏙 골라서 가져오기
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 비루트 권한으로 실행
USER nextjs

ENV PORT=3000
EXPOSE 3000

# Standalone 모드는 server.js로 실행합니다.
CMD ["node", "server.js"]