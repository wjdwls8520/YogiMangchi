"use client";

import { useState } from "react";
import Link from "next/link"; // 페이지 이동을 위해 추가
import Button from "@/components/ui/Button";
// 사용할 아이콘들 (경로에 맞게 수정)
import { FlameIcon, UserIcon, GoogleIcon } from "@/components/icons"; 
import { RiImageEditLine } from "react-icons/ri";
// ⭐️ 프사 수정 모달 컴포넌트 (아래에서 만들 예정)
//import ProfileImageModal from "@/components/ProfileImageModal"; 

export default function ProfilePage() {
  // DB에서 불러온 유저 데이터 (가상 세팅)
  const userData = {
    email: "user@example.com",
    nickname: "망치",
    profile_msg: "정진똥꼬(냄시~)",
    role: "VERIFIED_USER",
    follow_count: 120,
    best_count: 45,
    // ... 기타 정보들
  };

  // ⭐️ 프사 수정 모달 스위치
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        
        {/* 페이지 타이틀 & ⭐️ 회원정보 수정 버튼 */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              내 프로필
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              나의 활동 정보와 프로필을 관리할 수 있습니다.
            </p>
          </div>
          {/* ⭐️ 회원정보 수정 페이지로 이동하는 버튼 */}
          <Link href="/profile/edit">
            <Button variant="white" size="sm" className="flex items-center gap-1.5">
              회원정보 수정
            </Button>
          </Link>
        </div>

        {/* 1. 상단 상태 요약 카드 (통계 & 프로필 이미지) */}
        <div className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
            
            {/* 프로필 이미지 영역 */}
            <div className="relative mb-4 shrink-0 sm:mb-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden">
                {/* TODO: userData.profile_img가 있으면 img 태그 렌더링, 없으면 기본 아이콘 */}
                <span className="text-3xl text-gray-400"><UserIcon className="w-30"/></span>
              </div>
              {/* ⭐️ 카메라 버튼 클릭 시 모달 열기 */}
              <button 
                onClick={() => setIsImageModalOpen(true)}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm transition-colors hover:bg-gray-50 text-gray-600 cursor-pointer"
              >
                <RiImageEditLine />
              </button>
            </div>

            {/* 유저 정보 요약 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{userData.nickname}</h2>
                {/* 권한 뱃지 (인증회원) */}
                {userData.role === "VERIFIED_USER" && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0058FF]">
                    인증 회원
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-2"><GoogleIcon className="inline-block w-4 mr-1"/>{userData.email}</p>
              {/* 프로필 메시지 */}
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 inline-block">
                {userData.profile_msg}
              </p>
              
              {/* 통계 지표 (팔로우, 인기도) */}
              <div className="flex items-center justify-center sm:justify-start gap-6 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <UserIcon className="w-4 h-4" /> 팔로워
                  </span>
                  <span className="text-lg font-bold text-gray-900">{userData.follow_count}</span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <FlameIcon className="w-4 h-4 text-orange-500" /> 인기도 (망치)
                  </span>
                  <span className="text-lg font-bold text-gray-900">{userData.best_count}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex justify-center gap-4 pt-6 border-t border-gray-100">
          <button type="button" className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
            로그아웃
          </button>
          <span className="text-gray-300">|</span>
          <button type="button" className="text-sm text-red-400 hover:text-red-600 underline underline-offset-2">
            회원 탈퇴
          </button>
        </div>

      </div>

      {/* ⭐️ 프사 수정 모달 컴포넌트 마운트 */}
      {/* <ProfileImageModal 
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      /> */}

    </div>
  );
}