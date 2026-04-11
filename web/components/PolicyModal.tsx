import TermsContent from "./policy/TermsContent";
import PrivacyContent from "./policy/PrivacyContent"
import Button from "./ui/Button";
import BaseModal from "./ui/BaseModal";

interface PolicyModalProps {
  // terms면 이용약관, privacy면 개인정보, null이면 닫힘 상태
  type: "terms" | "privacy" | null; 
  onClose: () => void;
}

export default function PolicyModal({ type, onClose }: PolicyModalProps) {
  if (!type) return null; // type이 없으면 아무것도 안 그림 (모달 닫힘)

  // type에 따라 모달 제목 설정
  const title = type === "terms" ? "이용약관" : "개인정보 처리방침";

  return (
    <BaseModal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>확인</Button>
        </div>
      }
    >
      {type === "terms" && <TermsContent />}
      {type === "privacy" && <PrivacyContent />}
    </BaseModal>
  );
}
