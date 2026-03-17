"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AddressSearchModal from "@/components/AddressSearchModal";
// import { ArrowLeftIcon } from "@/components/icons"; // 뒤로가기 아이콘

export default function ProfileEditPage() {
  const router = useRouter();

  // DB에서 불러온 유저 초기 데이터 (가상 세팅)
  const initialData = {
    nickname: "망치",
    profile_msg: "정진똥꼬(냄시~)",
    role: "VERIFIED_USER",
    phone_number: "010-3333-4444",
    address_code: "14332",
    address1: "경기도 고양시 덕양구 성신로",
    address2: "201동 20호",
  };

  // 폼 상태 관리
  const [nickname, setNickname] = useState(initialData.nickname);
  const [profileMsg, setProfileMsg] = useState(initialData.profile_msg);
  const [phone, setPhone] = useState(initialData.phone_number);
  const [zonecode, setZonecode] = useState(initialData.address_code);
  const [address, setAddress] = useState(initialData.address1);
  const [detailAddress, setDetailAddress] = useState(initialData.address2);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // 주소 선택 핸들러
  const handleAddressSelect = (selectedZipcode: string, selectedAddress: string) => {
    setZonecode(selectedZipcode);
    setAddress(selectedAddress);
    setDetailAddress("");
  };

  // 폼 제출 (저장)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 백엔드 API로 수정된 정보 전송
    console.log("수정된 정보:", { nickname, profileMsg, phone, address: `${address} ${detailAddress}` });
    alert("정보가 성공적으로 수정되었습니다! 🎉");
    router.push("/profile"); // 완료 후 프로필 메인으로 이동
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              회원정보 수정
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              안전한 거래를 위해 정확한 정보를 입력해 주세요.
            </p>
          </div>
        </div>

        {/* 정보 수정 폼 카드 */}
        <div className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 닉네임 수정 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">닉네임</label>
              <div className="flex gap-2">
                <Input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={10} />
                <Button type="button" variant="gray" className="shrink-0">중복확인</Button>
              </div>
            </div>

            {/* 상태 메시지 수정 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">프로필 메시지</label>
              <Input type="text" value={profileMsg} onChange={(e) => setProfileMsg(e.target.value)} maxLength={30} placeholder="나를 표현할 한 줄 메시지를 적어주세요." />
            </div>

            {/* 휴대폰 번호 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">휴대폰 번호</label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))} disabled={initialData.role === "VERIFIED_USER"} placeholder="010-0000-0000" />
              {initialData.role === "VERIFIED_USER" && (
                <p className="mt-1 text-xs text-gray-500">인증이 완료된 번호는 임의로 변경할 수 없습니다.</p>
              )}
            </div>

            {/* 배송지(주소) 수정 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">배송지 주소 (경품 수령용)</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input type="text" value={zonecode} readOnly placeholder="우편번호" className="w-24 focus:outline-none" />
                  <Button type="button" variant="white" className="shrink-0" onClick={() => setIsAddressModalOpen(true)}>
                    주소 찾기
                  </Button>
                </div>
                <Input type="text" value={address} readOnly placeholder="기본 주소" className="focus:outline-none" />
                <Input type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} disabled={!zonecode} placeholder="상세 주소를 입력해 주세요" />
              </div>
            </div>

            {/* 하단 완료 버튼 */}
            <div className="pt-6 flex gap-3 w-full">
                <Button type="button" variant="white" size="lg" className="flex-1" onClick={() => router.back()}>
                    취소
                </Button>
                <Button type="submit" size="lg" className="flex-1">
                    변경사항 저장하기
                </Button>
            </div>

          </form>
        </div>

      </div>

      {/* 주소 검색 모달 */}
      <AddressSearchModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onComplete={handleAddressSelect}
      />
    </div>
  );
}