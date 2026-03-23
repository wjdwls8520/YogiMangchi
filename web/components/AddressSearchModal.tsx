"use client";

import DaumPostcode from "react-daum-postcode";

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 주소 선택 완료 시 부모에게 우편번호와 기본주소를 넘겨주는 함수
  onComplete: (zipcode: string, address: string) => void; 
}

export default function AddressSearchModal({ isOpen, onClose, onComplete }: AddressSearchModalProps) {
  if (!isOpen) return null;

  // 다음 우편번호 API에서 주소를 선택했을 때 실행되는 함수
  const handleComplete = (data: any) => {
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
    
    // 모달 닫기
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">주소 검색</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            닫기
          </button>
        </div>

        {/* 다음 우편번호 컴포넌트 */}
        <div className="h-[400px] w-full">
          <DaumPostcode 
            onComplete={handleComplete} 
            style={{ width: "100%", height: "100%" }} 
          />
        </div>

      </div>
    </div>
  );
}