import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", //  도커 빌드를 위한 핵심 옵션 추가!
  images: {
    domains: [
      "localhost", 
      "k.kakaocdn.net", 
      "yogimangchi-project.s3.ap-northeast-2.amazonaws.com",
      "lh3.googleusercontent.com"
    ],
  },
  env: {
    BUILD_DATE: new Date().toISOString(),
  },
  
  // 로컬 개발 환경(npm run dev)에서만 작동하는 프록시입니다.
  // EC2에서는 브라우저 요청을 Nginx가 먼저 가로채기 때문에 이 설정이 무시됩니다.
  async rewrites() {
    return [
      // 1. API 프록시 (로컬용)
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/:path*`, 
      },
      // 2. 소셜 로그인 프록시 (로컬용)
      {
        source: "/oauth2/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/oauth2/:path*`, 
      }
    ];
  },
};

export default nextConfig;