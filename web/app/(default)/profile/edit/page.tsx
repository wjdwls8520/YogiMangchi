"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AddressSearchModal from "@/components/AddressSearchModal";

interface MemberProfile {
  memberId: number;
  provider: string;
  nickname: string;
  profileImgUrl: string | null;
  profileMsg: string | null;
  role: string; // "USER" | "VERIFIED_USER" | "ADMIN"

  // 인증회원 정보예상
  phone_number?: string;
  address_code?: string;
  address1?: string;
  address2?: string;
}

export default function ProfileEditPage() {
  const router = useRouter();

  // API 데이터
  const [isLoading, setIsLoading] = useState(true);
  const [originalNickname, setOriginalNickname] = useState("");
  const [role, setRole] = useState("USER");

  // 폼
  const [nickname, setNickname] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(true);

  // 프로필 이미지
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<"CUSTOM" | "DEFAULT">("CUSTOM"); // 서버에 보낼 이미지 타입 플래그
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false); // 이미지 옵션 모달 상태
  const fileInputRef = useRef<HTMLInputElement>(null);


  // 초기 데이터 호출
  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/member/me/info", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) throw new Error("데이터 로드 실패");

        const text = await response.text();
        if (!text || text.trim() === "") throw new Error("빈 데이터 응답");

        const data: MemberProfile = JSON.parse(text);

        // 상태 초기화
        setOriginalNickname(data.nickname);
        setNickname(data.nickname);
        setProfileMsg(data.profileMsg || "");
        setPreviewImg(data.profileImgUrl);
        setRole(data.role || "USER");

        // 향후 추가될 인증 정보 세팅 (데이터가 있다면)
        setPhone(data.phone_number || "");
        setZonecode(data.address_code || "");
        setAddress(data.address1 || "");
        setDetailAddress(data.address2 || "");

        //sns프로필 원본주소 저장
        // setSnsOriginalUrl(data.profileImgUrl || "");

      } catch (err) {
        console.error("멤버 정보 로드 실패:", err);
        alert("로그인이 필요하거나 정보를 불러올 수 없습니다.");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemberInfo();
  }, [router]);


  // 닉네임 중복 체크 로직
  const validateNickname = (name: string) => /^[가-힣a-zA-Z0-9]{2,12}$/.test(name);

  const handleCheckDuplication = async () => {
    if (nickname === originalNickname) {
      alert("현재 사용 중인 닉네임입니다.");
      setIsNicknameChecked(true);
      return;
    }

    if (!validateNickname(nickname)) {
      alert("닉네임은 공백 없는 한글, 영문, 숫자만 사용 가능하며 2~12자여야 합니다.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/member/nickname/duplication?nickname=${encodeURIComponent(nickname)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("서버 오류");
      const data = await response.json();
      
      if (data.available === true || data === true) { 
        alert("사용 가능한 닉네임입니다! 😊");
        setIsNicknameChecked(true);
      } else {
        alert("이미 사용 중인 닉네임입니다.");
        setIsNicknameChecked(false);
      }
    } catch (error) {
      console.error("중복체크 에러:", error);
      alert("중복 확인 중 오류가 발생했습니다.");
    }
  };


  // 프로필 이미지 핸들러
  const handleImageOptionSelect = (type: "CUSTOM" | "DEFAULT") => {
    setImageType(type);
    setIsImageMenuOpen(false);

    if (type === "CUSTOM") {
      fileInputRef.current?.click();
    } else if (type === "DEFAULT") {
      setPreviewImg("assdsss.png"); // 화면에 보여줄 기본 이미지 썸네일
      setUploadFile(null); // 커스텀 파일이 있었다면 비워줌
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddressSelect = (selectedZipcode: string, selectedAddress: string) => {
    setZonecode(selectedZipcode);
    setAddress(selectedAddress);
    setDetailAddress(""); // 새로운 기본 주소를 검색했으니 기존 상세주소는 싹 비워줍니다.
  };


  // 최종 전송 (PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nickname !== originalNickname && !isNicknameChecked) {
      alert("닉네임 중복 확인을 해주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nickname", nickname);
      formData.append("profileMsg", profileMsg);
      
      // 타입에 따라 다르게
      if (imageType === "CUSTOM" && uploadFile) {
        // 커스텀: 진짜 파일(File) 전송
        formData.append("profileImage", uploadFile); 
      } else if (imageType === "DEFAULT") {
        // 기본 이미지: 텍스트(URL) 전송 
        formData.append("profileImage", "assdsss.png"); 
      }

      console.log("전송 직전 FormData 내용:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch("http://localhost:8080/api/v1/member/me/info", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        alert("정보가 성공적으로 수정되었습니다!");
        router.push("/profile");
      } else {
        const errData = await response.json().catch(() => null);
        console.error("서버 응답 에러:", errData);
        alert(errData?.message || "정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("수정 에러:", error);
      alert("서버와 통신 중 에러가 발생했습니다.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8 pb-24 relative">
      <div className="mx-auto max-w-2xl space-y-6">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">내 정보 수정</h1>
          <p className="mt-2 text-sm text-gray-400 font-medium">프로필과 인증 정보를 관리할 수 있습니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/*  섹션 1: 기본 프로필 정보 */}
          <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#0058FF] rounded-full inline-block"></span>
              기본 정보
            </h2>
            
            <div className="space-y-8">
              {/* 프사 수정 영역 */}
              <div className="flex flex-col items-center justify-center relative">
                <div 
                  className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 shadow-inner cursor-pointer group"
                  onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
                >
                  {previewImg && previewImg !== "assdsss.png" && previewImg !== "SNS_IMAGE_PREVIEW_URL" ? (
                    <img src={previewImg} alt="profile" className="h-full w-full object-cover group-hover:opacity-70 transition-opacity" />
                  ) : (
                    <UserIcon className="h-20 w-20 text-gray-300 group-hover:opacity-70 transition-opacity" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] font-bold">변경</span>
                  </div>
                </div>

                {/* 이미지 옵션 드롭다운 메뉴 */}
                {isImageMenuOpen && (
                  <div className="absolute top-26 z-20 w-48 rounded-2xl bg-white shadow-lg border border-gray-100 p-2 flex flex-col gap-1">
                    <button type="button" onClick={() => handleImageOptionSelect("CUSTOM")} className="text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      📸 앨범에서 사진 선택
                    </button>
                    <button type="button" onClick={() => alert("백엔드 API 준비 중입니다!")} className="text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      💬 SNS 프로필로 동기화
                    </button>
                    <button type="button" onClick={() => handleImageOptionSelect("DEFAULT")} className="text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      🗑️ 기본 이미지로 변경
                    </button>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                />
                <p className="mt-3 text-[11px] text-gray-400 font-bold">이미지를 클릭하여 변경</p>
              </div>

              {/* 닉네임 수정 */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">닉네임</label>
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    value={nickname} 
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setIsNicknameChecked(e.target.value === originalNickname);
                    }} 
                    maxLength={12} 
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant={isNicknameChecked ? "gray" : "sky"} 
                    className="shrink-0 w-24 rounded-2xl font-bold"
                    onClick={handleCheckDuplication}
                  >
                    {isNicknameChecked ? "확인 완료" : "중복 확인"}
                  </Button>
                </div>
              </div>

              {/* 상태 메시지 수정 */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">프로필 메시지</label>
                <Input 
                  type="text" 
                  value={profileMsg} 
                  onChange={(e) => setProfileMsg(e.target.value)} 
                  maxLength={30} 
                  placeholder="나를 표현할 한 줄 메시지를 적어주세요." 
                />
              </div>
            </div>
          </div>

          {/* 섹션 2: 인증 회원 정보 */}
          <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block"></span>
              인증 회원 정보
            </h2>

            {role === "USER" && (
              <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-[32px]">
                <p className="text-sm font-bold text-gray-800 mb-3">인증 회원만 입력할 수 있습니다.</p>
                <Button type="button" size="sm" className="rounded-xl px-6">인증하러 가기</Button>
              </div>
            )}

            <div className={`space-y-6 ${role === "USER" ? 'opacity-30' : ''}`}>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">휴대폰 번호</label>
                <Input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))} 
                  disabled={role === "USER"} 
                  placeholder="010-0000-0000" 
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">배송지 주소 (경품 수령용)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input type="text" value={zonecode} readOnly placeholder="우편번호" className="w-24 bg-gray-50" />
                    <Button type="button" variant="white" className="shrink-0 border-gray-200" onClick={() => setIsAddressModalOpen(true)} disabled={role === "USER"}>
                      주소 찾기
                    </Button>
                  </div>
                  <Input type="text" value={address} readOnly placeholder="기본 주소" className="bg-gray-50" />
                  <Input type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} disabled={!zonecode || role === "USER"} placeholder="상세 주소를 입력해 주세요" />
                </div>
              </div>
            </div>
          </div>

          {/* 하단 고정 버튼 */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0">
            <div className="mx-auto max-w-2xl flex gap-3">
              <Button type="button" variant="white" size="lg" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" size="lg" className="flex-1 h-14 rounded-2xl font-bold bg-[#0058FF] hover:bg-blue-700">
                변경사항 저장
              </Button>
            </div>
          </div>

        </form>
      </div>

      <AddressSearchModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onComplete={handleAddressSelect}
      />
    </div>
  );
}