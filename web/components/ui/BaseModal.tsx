"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cs";

// BaseModal이 받는 공통 props입니다.
type BaseModalProps = {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "default" | "compact";
  chrome?: "default" | "minimal";
};

// 동시에 열린 모달 수를 추적해 body 스크롤 잠금을 안전하게 관리합니다.
let openedModalCount = 0;

// 여러 화면에서 공통으로 쓰는 모달 껍데기입니다.
// 실제 폼/내용은 children으로 받고, 오버레이/스크롤/헤더/푸터만 공통 처리합니다.
export default function BaseModal({
  title,
  onClose,
  children,
  footer,
  size = "default",
  chrome = "default",
}: BaseModalProps) {
  // 모달이 하나라도 열려 있으면 body 스크롤을 막고, 마지막 모달이 닫히면 복구합니다.
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
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm">
      {/* 바깥 영역 클릭 시 모달 닫기 */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative flex h-full items-center justify-center p-4 py-6 sm:p-8 sm:py-10">
        <div
          className={cn(
            "relative flex max-h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 sm:max-h-[calc(100dvh-5rem)]",
            size === "compact"
              ? "min-h-[240px] max-w-md sm:min-h-[260px]"
              : "min-h-[320px] max-w-2xl sm:min-h-[360px]"
          )}
        >
          <div
            className={cn(
              "shrink-0 flex items-center dark:border-zinc-700",
              chrome === "minimal"
                ? "px-5 pb-1 pt-5"
                : "border-b border-gray-200 px-8 py-6",
              title ? "justify-between" : "justify-end"
            )}
          >
            {title ? (
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {title}
              </h2>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <X className={chrome === "minimal" ? "h-5 w-5" : "h-6 w-6"} />
            </button>
          </div>

          {/* 헤더/푸터는 고정하고, 본문 영역만 스크롤되도록 둡니다. */}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              chrome === "minimal" ? "px-6 pb-6 pt-1" : "px-8 py-8"
            )}
          >
            {children}
          </div>

          {footer ? (
            // 액션 버튼이 필요한 모달만 footer를 내려줍니다.
            <div
              className={cn(
                "shrink-0 border-t border-gray-200 dark:border-zinc-700",
                chrome === "minimal" ? "px-6 py-5" : "px-8 py-6"
              )}
            >
              {footer}
            </div>
          ) : null}
        </div>
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
