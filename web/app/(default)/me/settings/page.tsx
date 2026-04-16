"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AddressSearchModal from "@/components/AddressSearchModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import type { MemberInfo } from "@/types/member";

interface MemberProfile {
  memberId: number;
  provider: string;
  nickname: string;
  profileImgUrl: string | null;
  profileMsg: string | null;
  bestCount: number;
  followerCount: number;
  followingCount: number;
  term_agree: boolean;
  private_agree: boolean;
  role: string;
  phone_number?: string;
  address_code?: string;
  address1?: string;
  address2?: string;
}

const DEFAULT_PROFILE_PREVIEW_IMAGE = "/user_default.png";

export default function MeSettingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const login = useAuthStore((state) => state.login);
  const { alert, toast } = useFeedback();

  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originalNickname, setOriginalNickname] = useState("");
  const [role, setRole] = useState("USER");

  const [nickname, setNickname] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(true);

  const [previewImg, setPreviewImg] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<"CUSTOM" | "DEFAULT" | null>(null);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/member/me/info", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("데이터 로드 실패");
        }

        const data: MemberProfile = await response.json();

        setMemberProfile(data);
        setOriginalNickname(data.nickname);
        setNickname(data.nickname);
        setProfileMsg(data.profileMsg || "");
        setRole(data.role || "USER");

        setPhone(data.phone_number || "");
        setZonecode(data.address_code || "");
        setAddress(data.address1 || "");
        setDetailAddress(data.address2 || "");

        setPreviewImg(data.profileImgUrl || "");
        setUploadFile(null);
        setImageType(null);
      } catch (err) {
        console.error("멤버 정보 로드 실패:", err);
        await alert("로그인이 필요하거나 정보를 불러올 수 없습니다.");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberInfo();
  }, [alert, router]);

  const validateNickname = (name: string) => /^[가-힣a-zA-Z0-9]{2,12}$/.test(name);

  const handleCheckDuplication = async () => {
    if (nickname === originalNickname) {
      await alert("현재 사용 중인 닉네임입니다.");
      setIsNicknameChecked(true);
      return;
    }

    if (!validateNickname(nickname)) {
      await alert(
        "닉네임은 공백 없는 한글, 영문, 숫자만 사용 가능하며 2~12자여야 합니다."
      );
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/member/nickname/duplication?nickname=${encodeURIComponent(nickname)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("서버 오류");
      }

      const data = await response.json();

      if (data.available === true || data === true) {
        toast({ title: "사용 가능한 닉네임입니다!", tone: "success" });
        setIsNicknameChecked(true);
      } else {
        await alert("이미 사용 중인 닉네임입니다.");
        setIsNicknameChecked(false);
      }
    } catch (error) {
      console.error("중복 체크 에러:", error);
      await alert("중복 확인 중 오류가 발생했습니다.");
    }
  };

  const handleImageOptionSelect = (type: "CUSTOM" | "DEFAULT") => {
    setIsImageMenuOpen(false);

    if (type === "CUSTOM") {
      fileInputRef.current?.click();
      return;
    }

    setImageType("DEFAULT");
    setUploadFile(null);

    // 저장 전에는 없는 로컬 경로로 바꾸지 않고,
    // 현재 서버 URL을 유지해서 엑박이 나지 않게 처리
    setPreviewImg(DEFAULT_PROFILE_PREVIEW_IMAGE);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadFile(file);
    setImageType("CUSTOM");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImg(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddressSelect = (selectedZipcode: string, selectedAddress: string) => {
    setZonecode(selectedZipcode);
    setAddress(selectedAddress);
    setDetailAddress("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nickname !== originalNickname && !isNicknameChecked) {
      await alert("닉네임 중복 확인을 해주세요.");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("nickname", nickname.trim());
      params.set("profileMsg", profileMsg);

      if (imageType === "DEFAULT") {
        params.set("type", "reset");
      }

      const formData = new FormData();

      if (imageType === "CUSTOM" && uploadFile) {
        formData.append("profileImage", uploadFile);
      }

      const response = await fetch(
        `http://localhost:8080/api/v1/member/me/info?${params.toString()}`,
        {
          method: "PATCH",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        console.error("서버 응답 에러:", errData);
        await alert(errData?.message || "정보 수정에 실패했습니다.");
        return;
      }

      const updatedData: MemberProfile | null = await response.json().catch(() => null);

      if (updatedData) {
        setMemberProfile(updatedData);
        setPreviewImg(updatedData.profileImgUrl || "");
        setUploadFile(null);
        setImageType(null);

        const nextRole: MemberInfo["role"] =
          updatedData.role === "ADMIN" || updatedData.role === "VERIFIED_USER"
            ? updatedData.role
            : "USER";

        const nextAuthUser: MemberInfo = {
          memberId: updatedData.memberId,
          provider: updatedData.provider,
          nickname: updatedData.nickname,
          profileImgUrl: updatedData.profileImgUrl || "",
          profileMsg: updatedData.profileMsg || "",
          bestCount: updatedData.bestCount,
          followerCount: updatedData.followerCount,
          followingCount: updatedData.followingCount,
          term_agree: updatedData.term_agree,
          private_agree: updatedData.private_agree,
          role: nextRole,
        };

        login(nextAuthUser);
      }

      toast({ title: "정보가 성공적으로 수정되었습니다.", tone: "success" });
      router.push("/profile");
    } catch (error) {
      console.error("수정 에러:", error);
      await alert("서버와 통신 중 에러가 발생했습니다.");
    }
  };

  const isDefaultPreview = imageType === "DEFAULT";
  const currentProfileImg =
    previewImg || memberProfile?.profileImgUrl || DEFAULT_PROFILE_PREVIEW_IMAGE;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8 pb-24 relative">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            회원정보 수정
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-medium">
            프로필과 인증 정보를 관리할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#0058FF] rounded-full inline-block"></span>
              기본 정보
            </h2>

            <div className="space-y-8">
              <div className="flex flex-col items-center justify-center relative">
                <div
                  className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 shadow-inner cursor-pointer group"
                  onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
                >
                  <img
                    src={currentProfileImg}
                    alt="profile"
                    className={`h-full w-full object-cover transition-opacity ${
                      isDefaultPreview ? "opacity-60" : "group-hover:opacity-70"
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] font-bold">변경</span>
                  </div>
                </div>

                {isImageMenuOpen && (
                  <div className="absolute top-26 z-20 w-48 rounded-2xl bg-white shadow-lg border border-gray-100 p-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleImageOptionSelect("CUSTOM")}
                      className="text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      앨범에서 사진 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImageOptionSelect("DEFAULT")}
                      className="text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      기본 이미지로 변경
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
                <p className="mt-3 text-[11px] text-gray-400 font-bold">
                  이미지를 클릭하여 변경
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  닉네임
                </label>
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

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  프로필 메시지
                </label>
                <Input
                  type="text"
                  value={profileMsg}
                  onChange={(e) => setProfileMsg(e.target.value)}
                  maxLength={30}
                  placeholder="나를 표현하는 한 줄 메시지를 적어주세요"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block"></span>
              인증 회원 정보
            </h2>

            {role === "USER" && (
              <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-[32px]">
                <p className="text-sm font-bold text-gray-800 mb-3">
                  인증 회원만 입력할 수 있습니다.
                </p>
                <Button type="button" size="sm" className="rounded-xl px-6">
                  인증하러 가기
                </Button>
              </div>
            )}

            <div className={`space-y-6 ${role === "USER" ? "opacity-30" : ""}`}>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  휴대폰 번호
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
                  disabled={role === "USER"}
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  배송지 주소 (경품 수령용)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={zonecode}
                      readOnly
                      placeholder="우편번호"
                      className="w-24 bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="white"
                      className="shrink-0 border-gray-200"
                      onClick={() => setIsAddressModalOpen(true)}
                      disabled={role === "USER"}
                    >
                      주소 찾기
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={address}
                    readOnly
                    placeholder="기본 주소"
                    className="bg-gray-50"
                  />
                  <Input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    disabled={!zonecode || role === "USER"}
                    placeholder="상세 주소를 입력해 주세요"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0">
            <div className="mx-auto max-w-2xl flex gap-3">
              <Button
                type="button"
                variant="white"
                size="lg"
                className="flex-1 h-14 rounded-2xl font-bold"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-1 h-14 rounded-2xl font-bold bg-[#0058FF] hover:bg-blue-700"
              >
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
