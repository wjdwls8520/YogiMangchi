"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyDetailPage() {
  const router = useRouter();

  // 폼 상태 관리
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false); // 인증번호 발송 여부
  const [isVerified, setIsVerified] = useState(false); // 인증 완료 여부
  
  // 주소 상태 관리 (카카오 주소 API 연동 시 사용)
  const [zonecode, setZonecode] = useState(""); // 우편번호
  const [address, setAddress] = useState(""); // 기본주소
  const [detailAddress, setDetailAddress] = useState(""); // 상세주소

  // 인증번호 발송 로직
  const handleSendCode = () => {
    if (phone.length < 10) return alert("올바른 휴대폰 번호를 입력해주세요.");
    // TODO: 실제 SMS 발송 API 연동
    setIsCodeSent(true);
    alert("인증번호가 발송되었습니다. (테스트용: 아무 숫자나 입력하세요)");
  };

  // 인증번호 확인 로직
  const handleVerifyCode = () => {
    if (verifyCode.length === 0) return;
    // TODO: 실제 인증번호 확인 API 연동
    setIsVerified(true);
    alert("인증이 완료되었습니다.");
  };

  // 카카오 우편번호 API 호출 (임시 가짜 함수)
  const handleSearchAddress = () => {
    // TODO: react-daum-postcode 라이브러리 연동
    console.log("카카오 주소 검색 창 띄우기");
    // 임시 데이터 세팅
    setZonecode("12345");
    setAddress("서울시 강남구 테헤란로 123");
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return alert("휴대폰 본인인증을 완료해주세요.");
    if (!name || !address || !detailAddress) return alert("모든 정보를 입력해주세요.");

    // TODO: 백엔드에 인증 회원 정보 저장 API 호출
    console.log("인증 회원 정보 제출:", { name, phone, address: `${address} ${detailAddress}` });
    alert("인증 회원 업그레이드가 완료되었습니다!🎉");
    router.push("/"); // 메인 홈으로 이동
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10">
        
        {/* 타이틀 영역 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            인증 회원 정보 입력
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            경품 수령을 위해 정확한 정보를 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. 수령인 이름 */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-900">
              이름 (실명)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0058FF] focus:outline-none focus:ring-1 focus:ring-[#0058FF] sm:text-sm"
              placeholder="예: 홍길동"
            />
          </div>

          {/* 2. 휴대폰 번호 및 인증 */}
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-900">
              휴대폰 번호
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} // 숫자만 입력
                disabled={isVerified}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0058FF] focus:outline-none focus:ring-1 focus:ring-[#0058FF] sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="숫자만 입력해 주세요"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isVerified}
                className="shrink-0 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              >
                {isCodeSent ? "재전송" : "인증번호 받기"}
              </button>
            </div>

            {/* 인증번호 입력 필드 (인증번호 발송 버튼을 누른 후에만 보임) */}
            {isCodeSent && !isVerified && (
              <div className="flex gap-2 mt-2 animate-fade-in">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0058FF] focus:outline-none focus:ring-1 focus:ring-[#0058FF] sm:text-sm"
                  placeholder="인증번호 입력"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  className="shrink-0 rounded-xl bg-[#0058FF] px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                >
                  확인
                </button>
              </div>
            )}
            {/* 인증 완료 메시지 */}
            {isVerified && (
              <p className="mt-2 text-sm font-medium text-[#0058FF]">휴대폰 인증이 완료되었습니다.</p>
            )}
          </div>

          {/* 3. 배송지 주소 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              주소
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={zonecode}
                  readOnly
                  className="block w-24 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 sm:text-sm"
                  placeholder="우편번호"
                />
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  우편번호 찾기
                </button>
              </div>
              <input
                type="text"
                value={address}
                readOnly
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 sm:text-sm"
                placeholder="기본 주소"
              />
              <input
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0058FF] focus:outline-none focus:ring-1 focus:ring-[#0058FF] sm:text-sm"
                placeholder="상세 주소를 입력해 주세요"
              />
            </div>
          </div>

          {/* 하단 완료 버튼 */}
          <div className="pt-4">
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-[#0058FF] px-5 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#0058FF] focus:ring-offset-2"
            >
              인증 회원 등록 완료
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}