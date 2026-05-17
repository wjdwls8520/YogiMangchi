import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", //  도커 빌드를 위한 핵심 옵션 추가!
  images: {
    domains: ["localhost", "k.kakaocdn.net", "yogimangchi-project.s3.ap-northeast-2.amazonaws.com","lh3.googleusercontent.com"],
  },
  env: {
    BUILD_DATE: new Date().toISOString(),
  },
};

export default nextConfig;
