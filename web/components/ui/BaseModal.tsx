"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type BaseModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  bodyClassName?: string;
};

let openedModalCount = 0;

// 여러 화면에서 공통으로 쓰는 모달 껍데기입니다.
// 실제 폼/내용은 children으로 받고, 오버레이/스크롤/헤더/푸터만 공통 처리합니다.
export default function BaseModal({
  title,
  onClose,
  children,
  footer,
  maxWidthClassName = "max-w-2xl",
  bodyClassName = "px-8 py-8",
}: BaseModalProps) {
  useEffect(() => {
    openedModalCount += 1;

    if (openedModalCount === 1) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.dataset.modalOverflow = document.body.style.overflow;
      document.body.dataset.modalPaddingRight = document.body.style.paddingRight;
      document.body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      openedModalCount = Math.max(0, openedModalCount - 1);

      if (openedModalCount === 0) {
        document.body.style.overflow = document.body.dataset.modalOverflow ?? "";
        document.body.style.paddingRight =
          document.body.dataset.modalPaddingRight ?? "";
        delete document.body.dataset.modalOverflow;
        delete document.body.dataset.modalPaddingRight;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-6 backdrop-blur-sm sm:items-center sm:py-10">
      {/* 바깥 영역 클릭 시 모달 닫기 */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className={`relative my-auto flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-5rem)] ${maxWidthClassName}`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
          <h2 className="text-2xl font-black text-gray-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 화면이 작은 경우에도 본문만 내부 스크롤되도록 처리 */}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>

        {footer ? (
          // 액션 버튼이 필요한 모달만 footer를 내려줍니다.
          <div className="border-t border-gray-200 px-8 py-6">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

/*
사용 예시 1) 페이지에서 전용 모달 열기

const [isOpen, setIsOpen] = useState(false);

{isOpen ? (
  <ContestCreateModal
    onClose={() => setIsOpen(false)}
    onCreated={handleCreated}
  />
) : null}

사용 예시 2) 전용 모달 내부에서 BaseModal 감싸기

<BaseModal
  title="대회 생성"
  onClose={onClose}
  footer={
    <div className="flex justify-end gap-3">
      <Button type="button" variant="white" onClick={onClose}>
        취소
      </Button>
      <Button type="submit" form={formId}>
        생성
      </Button>
    </div>
  }
>
  <form id={formId}>
    ...모달 내용...
  </form>
</BaseModal>
*/
