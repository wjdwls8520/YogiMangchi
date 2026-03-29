"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AddressSearchModal from "@/components/AddressSearchModal";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

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

  // 모달을 열고 닫을 스위치 상태
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // 모달에서 주소를 선택했을 때 실행될 함수
  const handleAddressSelect = (selectedZipcode: string, selectedAddress: string) => {
    setZonecode(selectedZipcode);
    setAddress(selectedAddress);
    setDetailAddress(""); // 새 주소를 찾았으니 기존 상세 주소는 초기화
  };

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
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="메인 페이지로 이동">
            <Logo className="h-12"/>
          </Link>
        </div>
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
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
            />
          </div>

          {/* 2. 휴대폰 번호 및 인증 */}
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-900">
              휴대폰 번호
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} // 숫자만 입력
                disabled={isVerified}
                placeholder="숫자만 입력해 주세요"
              />
              <Button
                type="button"
                variant="white"
                onClick={handleSendCode}
                disabled={isVerified}
              >
                {isCodeSent ? "재전송" : "인증번호 받기"}
              </Button>
            </div>

            {/* 인증번호 입력 필드 (인증번호 발송 버튼을 누른 후에만 보임) */}
            {isCodeSent && !isVerified && (
              <div className="flex gap-2 mt-2 animate-fade-in">
                <Input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="인증번호 입력"
                />
                <Button
                  type="button"
                  variant="white"
                  onClick={handleVerifyCode}
                >
                  확인
                </Button>
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
                <Input
                  type="text"
                  value={zonecode}
                  readOnly
                  placeholder="우편번호"
                />
                <Button
                  type="button"
                  variant="gray"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  우편번호 찾기
                </Button>
              </div>
              <Input
                type="text"
                value={address}
                readOnly
                placeholder="기본 주소"
              />
              <Input
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                disabled={!zonecode} //우편번호없을때 상세주소입력막기
                placeholder="상세 주소를 입력해 주세요"
              />
            </div>
          </div>

          {/* 하단 완료 버튼 */}
          <div className="pt-4">
            <Button type="submit" size="lg" fullWidth>
              인증 회원 등록 완료
            </Button>
          </div>

        </form>
      </div>

      {/* 모달 컴포넌트 마운트 */}
      <AddressSearchModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onComplete={handleAddressSelect}
      />

    </div>
  );
}