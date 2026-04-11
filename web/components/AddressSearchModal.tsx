"use client";

import { useCallback, useEffect, useRef } from "react";
import { useKakaoPostcodePopup } from "react-daum-postcode";

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 주소 선택 완료 시 부모에게 우편번호와 기본주소를 넘겨주는 함수
  onComplete: (zipcode: string, address: string) => void; 
}

type AddressSearchResult = {
  zonecode: string;
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
};

let isAddressSearchWindowOpening = false;

export default function AddressSearchModal({ isOpen, onClose, onComplete }: AddressSearchModalProps) {
  const openPostcodePopup = useKakaoPostcodePopup();
  const hasOpenedRef = useRef(false);

  const handleComplete = useCallback((data: AddressSearchResult) => {
    let fullAddress = data.address; // 기본 주소
    let extraAddress = ""; // 참고 항목 (동, 건물명 등)

    // 도로명 주소일 경우 참고 항목을 추가해 줍니다 (실무 디테일!)
    if (data.addressType === "R") {
      if (data.bname !== "") extraAddress += data.bname;
      if (data.buildingName !== "") {
        extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    // 부모 컴포넌트로 우편번호(zonecode)와 완성된 주소 전달
    onComplete(data.zonecode, fullAddress);
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen || hasOpenedRef.current || isAddressSearchWindowOpening) {
      return;
    }

    hasOpenedRef.current = true;
    isAddressSearchWindowOpening = true;

    const openPopup = async () => {
      try {
        onClose();

        await openPostcodePopup({
          onComplete: handleComplete,
          popupTitle: "주소 검색",
          autoClose: true,
        });
      } catch (error) {
        console.error("주소 검색 창 열기 실패:", error);
        alert("주소 검색 창을 열지 못했습니다. 브라우저 팝업 차단 설정을 확인해 주세요.");
      } finally {
        isAddressSearchWindowOpening = false;
      }
    };

    void openPopup();
  }, [handleComplete, isOpen, onClose, openPostcodePopup]);

  return null;
}
