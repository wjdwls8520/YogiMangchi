"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AddressSearchModal from "@/components/AddressSearchModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import type { MemberInfo } from "@/types/member";
import { FetchClientError } from "@/lib/api/client";
import {
  getMyVerifiedInfo,
  getMyMemberProfile,
  type MyMemberProfileResponse,
  updateMyProfileInfo,
  updateMyVerifiedInfo,
} from "@/lib/api/member";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/utils/phone";

const DEFAULT_PROFILE_PREVIEW_IMAGE = "/user_default.png";

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof FetchClientError) {
    return error.userMessage || fallbackMessage;
  }

  return fallbackMessage;
};

const logUnexpectedApiError = (label: string, error: unknown) => {
  if (error instanceof FetchClientError && error.status < 500) {
    return;
  }

  console.error(label, error);
};

const getVerifiedPhone = (profile: MyMemberProfileResponse | null) =>
  profile?.phone_number || profile?.phoneNumber || "";

const getVerifiedAddressCode = (profile: MyMemberProfileResponse | null) =>
  profile?.address_code || profile?.addressCode || "";

const getVerifiedEmail = (
  profile:
    | {
        email?: string;
        verifiedEmail?: string;
      }
    | null
) => profile?.verifiedEmail || profile?.email || "";

const normalizeMemberRole = (role: string | null | undefined): MemberInfo["role"] => {
  const normalizedRole = role?.toUpperCase() || "";

  if (normalizedRole.includes("ADMIN")) {
    return "ADMIN";
  }

  if (normalizedRole.includes("VERIFIED")) {
    return "VERIFIED_USER";
  }

  return "USER";
};

export default function MeSettingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const login = useAuthStore((state) => state.login);
  const { alert, toast } = useFeedback();

  const [memberProfile, setMemberProfile] = useState<MyMemberProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originalNickname, setOriginalNickname] = useState("");
  const [role, setRole] = useState<MemberInfo["role"]>("USER");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const [nickname, setNickname] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(true);

  const [previewImg, setPreviewImg] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<"CUSTOM" | "DEFAULT" | null>(null);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const canEditVerifiedInfo = role === "VERIFIED_USER" || role === "ADMIN";

  const syncMemberProfile = useCallback(async () => {
    const profileData = await getMyMemberProfile();

    const nextRole = normalizeMemberRole(profileData.role);

    let verifiedData = null;

    if (nextRole !== "USER") {
      try {
        verifiedData = await getMyVerifiedInfo();
      } catch (error) {
        logUnexpectedApiError("인증회원 정보 로드 실패:", error);
      }
    }

    const mergedProfile: MyMemberProfileResponse = {
      ...profileData,
      ...(verifiedData || {}),
    };

    setMemberProfile(mergedProfile);
    setOriginalNickname(mergedProfile.nickname);
    setNickname(mergedProfile.nickname);
    setProfileMsg(mergedProfile.profileMsg || "");

    setRole(nextRole);
    setVerifiedEmail(getVerifiedEmail(verifiedData));
    setPhone(formatPhoneNumber(getVerifiedPhone(mergedProfile)));
    setZonecode(getVerifiedAddressCode(mergedProfile));
    setAddress(mergedProfile.address1 || "");
    setDetailAddress(mergedProfile.address2 || "");
    setPreviewImg(mergedProfile.profileImgUrl || "");
    setUploadFile(null);
    setImageType(null);
    setIsNicknameChecked(true);

    const nextAuthUser: MemberInfo = {
      memberId: mergedProfile.memberId,
      provider: mergedProfile.provider,
      nickname: mergedProfile.nickname,
      profileImgUrl: mergedProfile.profileImgUrl || "",
      profileMsg: mergedProfile.profileMsg || "",
      bestCount: mergedProfile.bestCount,
      followerCount: mergedProfile.followerCount,
      followingCount: mergedProfile.followingCount,
      term_agree: mergedProfile.term_agree,
      private_agree: mergedProfile.private_agree,
      role: nextRole,
    };

    login(nextAuthUser);

    return mergedProfile;
  }, [login]);

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        await syncMemberProfile();
      } catch (error) {
        logUnexpectedApiError("멤버 정보 로드 실패:", error);
        await alert("로그인이 필요하거나 정보를 불러올 수 없습니다.");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMemberInfo();
  }, [alert, router, syncMemberProfile]);

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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/member/nickname/duplication?nickname=${encodeURIComponent(nickname)}`,
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

    const trimmedNickname = nickname.trim();
    const trimmedDetailAddress = detailAddress.trim();
    const normalizedPhone = normalizePhoneNumber(phone);

    if (trimmedNickname !== originalNickname && !isNicknameChecked) {
      await alert("닉네임 중복 확인을 해주세요.");
      return;
    }

    if (canEditVerifiedInfo) {
      if (!/^\d{10,11}$/.test(normalizedPhone)) {
        await alert("휴대폰 번호는 숫자 10~11자리로 입력해 주세요.");
        return;
      }

      if (!zonecode || !address) {
        await alert("주소를 입력해 주세요.");
        return;
      }
    }

    const hasProfileChanges =
      trimmedNickname !== originalNickname ||
      profileMsg !== (memberProfile?.profileMsg || "") ||
      imageType !== null;

    const hasVerifiedChanges =
      canEditVerifiedInfo &&
      (normalizedPhone !== getVerifiedPhone(memberProfile) ||
        zonecode !== getVerifiedAddressCode(memberProfile) ||
        address !== (memberProfile?.address1 || "") ||
        trimmedDetailAddress !== (memberProfile?.address2 || ""));

    if (!hasProfileChanges && !hasVerifiedChanges) {
      toast({ title: "변경된 내용이 없습니다.", tone: "warning" });
      return;
    }

    try {
      setIsSubmitting(true);

      if (hasProfileChanges) {
        await updateMyProfileInfo({
          nickname: trimmedNickname,
          profileMsg,
          type: imageType === "DEFAULT" ? "reset" : undefined,
          profileImage: imageType === "CUSTOM" ? uploadFile || undefined : undefined,
        });
      }

      if (hasVerifiedChanges) {
        await updateMyVerifiedInfo({
          phoneNumber: normalizedPhone,
          addressCode: zonecode,
          address1: address,
          address2: trimmedDetailAddress || undefined,
        });
      }

      await syncMemberProfile();

      toast({ title: "정보가 성공적으로 수정되었습니다.", tone: "success" });
      router.push("/me");
    } catch (error) {
      logUnexpectedApiError("회원정보 수정 실패:", error);
      await alert(
        getApiErrorMessage(
          error,
          "서버와 통신 중 에러가 발생했습니다."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDefaultPreview = imageType === "DEFAULT";
  const currentProfileImg =
    previewImg || memberProfile?.profileImgUrl || DEFAULT_PROFILE_PREVIEW_IMAGE;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            회원정보 수정
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="inline-block h-4 w-1.5 rounded-full bg-brand-primary"></span>
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
                    <span className="text-white text-xxs font-bold">변경</span>
                  </div>
                </div>

                {isImageMenuOpen && (
                  <div className="absolute top-full z-20 mt-2 flex w-48 flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
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
                <p className="mt-3 text-xxs text-gray-400 font-bold">
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

          <div className="card relative overflow-hidden">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="inline-block h-4 w-1.5 rounded-full bg-orange-500"></span>
              인증 회원 정보
            </h2>

            {!canEditVerifiedInfo && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                <p className="text-sm font-bold text-gray-800 mb-3">
                  인증 회원만 입력할 수 있습니다.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl px-6"
                  onClick={() => router.push("/verify?source=me")}
                >
                  인증하러 가기
                </Button>
              </div>
            )}

            <div className={`space-y-6 ${!canEditVerifiedInfo ? "opacity-30" : ""}`}>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  인증 이메일
                </label>
                <Input
                  type="email"
                  value={verifiedEmail}
                  readOnly
                  disabled={!canEditVerifiedInfo}
                  placeholder="인증 이메일"
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  휴대폰 번호
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  maxLength={13}
                  disabled={!canEditVerifiedInfo}
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">
                  주소
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
                      disabled={!canEditVerifiedInfo}
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
                    disabled={!zonecode || !canEditVerifiedInfo}
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
                className="flex-1 rounded-2xl font-bold"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1 rounded-2xl font-bold"
              >
                {isSubmitting ? "저장 중..." : "변경사항 저장"}
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
