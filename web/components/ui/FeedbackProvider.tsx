"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cs";
import Button from "./Button";
import BaseModal from "./BaseModal";

// confirm 버튼 스타일에 사용하는 톤입니다.
type ConfirmTone = "default" | "danger";

// toast 시각 표현에 사용하는 상태값입니다.
type ToastTone = "info" | "success" | "error" | "warning";

// alert 호출 시 받을 수 있는 옵션입니다.
type AlertOptions = {
  description: string;
  buttonText?: string;
};

// confirm 호출 시 받을 수 있는 옵션입니다.
type ConfirmOptions = {
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
};

// toast 호출 시 받을 수 있는 옵션입니다.
type ToastOptions = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

// alert는 문자열 또는 옵션 객체로 호출할 수 있습니다.
type AlertInput = string | AlertOptions;

// confirm은 문자열 또는 옵션 객체로 호출할 수 있습니다.
type ConfirmInput = string | ConfirmOptions;

// toast는 문자열 또는 옵션 객체로 호출할 수 있습니다.
type ToastInput = string | ToastOptions;

// alert 모달의 현재 표시 상태입니다.
type AlertState = {
  open: boolean;
  description: string;
  buttonText: string;
};

// confirm 모달의 현재 표시 상태입니다.
type ConfirmState = {
  open: boolean;
  description: string;
  confirmText: string;
  cancelText: string;
  tone: ConfirmTone;
};

// 화면에 쌓여 있는 toast 한 개의 데이터입니다.
type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

// 외부 컴포넌트가 사용할 feedback API 형태입니다.
type FeedbackContextValue = {
  alert: (input: AlertInput) => Promise<void>;
  confirm: (input: ConfirmInput) => Promise<boolean>;
  toast: (input: ToastInput) => void;
};

// feedback API를 하위 컴포넌트에 전달하는 context입니다.
const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// alert를 닫았을 때 되돌아갈 기본 상태입니다.
const defaultAlertState: AlertState = {
  open: false,
  description: "",
  buttonText: "확인",
};

// confirm을 닫았을 때 되돌아갈 기본 상태입니다.
const defaultConfirmState: ConfirmState = {
  open: false,
  description: "",
  confirmText: "확인",
  cancelText: "취소",
  tone: "default",
};

// alert 입력을 단일 형태로 정규화합니다.
const getAlertOptions = (input: AlertInput): AlertOptions => {
  if (typeof input === "string") {
    return {
      description: input,
    };
  }
  return input;
};

// confirm 입력을 단일 형태로 정규화합니다.
const getConfirmOptions = (input: ConfirmInput): ConfirmOptions => {
  if (typeof input === "string") {
    return {
      description: input,
    };
  }
  return input;
};

// toast 입력을 단일 형태로 정규화합니다.
const getToastOptions = (input: ToastInput): ToastOptions => {
  if (typeof input === "string") {
    return {
      title: input,
    };
  }
  return input;
};

// toast 상태에 맞는 아이콘을 반환합니다.
const getToastIcon = (tone: ToastTone) => {
  if (tone === "success") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  }
  if (tone === "error") {
    return <XCircle className="h-5 w-5 text-rose-400" />;
  }
  if (tone === "warning") {
    return <TriangleAlert className="h-5 w-5 text-amber-400" />;
  }
  return <Info className="h-5 w-5 text-blue-400" />;
};

// alert, confirm, toast를 전역에서 사용할 수 있게 제공하는 provider입니다.
export default function FeedbackProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>(defaultAlertState);
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // alert가 닫힐 때 resolve할 Promise 핸들러를 보관합니다.
  const alertResolverRef = useRef<(() => void) | null>(null);

  // confirm이 닫힐 때 resolve할 Promise 핸들러를 보관합니다.
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  // toast 고유 id를 순차적으로 발급합니다.
  const toastIdRef = useRef(0);

  // 등록된 toast 타이머를 추적해 정리 시 해제합니다.
  const toastTimeoutsRef = useRef<number[]>([]);

  // provider가 사라질 때 남아 있는 toast 타이머를 모두 정리합니다.
  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  // 특정 toast를 목록에서 제거합니다.
  const removeToast = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  // alert 분기: 상태를 열고, 닫힐 때 Promise를 resolve합니다.
  const openAlert = useCallback((input: AlertInput) => {
    const options = getAlertOptions(input);

    setAlertState({
      open: true,
      description: options.description,
      buttonText: options.buttonText ?? "확인",
    });

    return new Promise<void>((resolve) => {
      alertResolverRef.current = resolve;
    });
  }, []);

  // alert를 닫고 대기 중인 Promise를 완료합니다.
  const closeAlert = useCallback(() => {
    setAlertState(defaultAlertState);
    alertResolverRef.current?.();
    alertResolverRef.current = null;
  }, []);

  // confirm 분기: 상태를 열고, 확인/취소 결과를 Promise로 반환합니다.
  const openConfirm = useCallback((input: ConfirmInput) => {
    const options = getConfirmOptions(input);

    setConfirmState({
      open: true,
      description: options.description,
      confirmText: options.confirmText ?? "확인",
      cancelText: options.cancelText ?? "취소",
      tone: options.tone ?? "default",
    });

    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  // confirm을 닫고 확인/취소 결과를 Promise에 전달합니다.
  const closeConfirm = useCallback((confirmed: boolean) => {
    setConfirmState(defaultConfirmState);
    confirmResolverRef.current?.(confirmed);
    confirmResolverRef.current = null;
  }, []);

  // toast 분기: 큐에 추가하고, 일정 시간 뒤 자동 제거합니다.
  const pushToast = useCallback(
    (input: ToastInput) => {
      const options = getToastOptions(input);
      const toastId = ++toastIdRef.current;

      setToasts((prev) => [
        ...prev,
        {
          id: toastId,
          title: options.title,
          description: options.description,
          tone: options.tone ?? "info",
        },
      ]);

      const timeoutId = window.setTimeout(() => {
        removeToast(toastId);
        toastTimeoutsRef.current = toastTimeoutsRef.current.filter(
          (currentId) => currentId !== timeoutId
        );
      }, options.duration ?? 3000);

      toastTimeoutsRef.current.push(timeoutId);
    },
    [removeToast]
  );

  // context로 내보낼 feedback API를 묶어 캐싱합니다.
  const value = useMemo<FeedbackContextValue>(
    () => ({
      alert: openAlert,
      confirm: openConfirm,
      toast: pushToast,
    }),
    [openAlert, openConfirm, pushToast]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* alert UI - 상하좌우 정중앙 */}
      {alertState.open ? (
        <BaseModal
          onClose={closeAlert}
          size="compact"
          chrome="minimal"
          footer={
            <div className="flex w-full justify-center">
              <Button type="button" onClick={closeAlert} className="w-full sm:w-auto min-w-[100px]">
                {alertState.buttonText}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center gap-4 pb-4 text-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              <Info className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <p className="max-w-[240px] whitespace-pre-line text-[16px] font-medium leading-relaxed tracking-tight text-zinc-800 dark:text-zinc-100">
              {alertState.description}
            </p>
          </div>
        </BaseModal>
      ) : null}

      {/* confirm UI - 상하좌우 정중앙 */}
      {confirmState.open ? (
        <BaseModal
          onClose={() => closeConfirm(false)}
          size="compact"
          chrome="minimal"
          footer={
            <div className="flex w-full justify-center gap-2">
              <Button type="button" variant="white" onClick={() => closeConfirm(false)} className="flex-1 sm:flex-none sm:min-w-[100px]">
                {confirmState.cancelText}
              </Button>
              <Button
                type="button"
                variant={confirmState.tone === "danger" ? "red" : "blue"}
                onClick={() => closeConfirm(true)}
                className="flex-1 sm:flex-none sm:min-w-[100px]"
              >
                {confirmState.confirmText}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center gap-4 pb-4 text-center">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]",
                confirmState.tone === "danger"
                  ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                  : "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
              )}
            >
              <CircleAlert className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <p className="max-w-[240px] whitespace-pre-line text-[16px] font-medium leading-relaxed tracking-tight text-zinc-800 dark:text-zinc-100">
              {confirmState.description}
            </p>
          </div>
        </BaseModal>
      ) : null}

      {/* toast UI - 고정 다크 스타일 */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 flex-col gap-3 sm:bottom-auto sm:top-[84px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full items-start gap-3.5 rounded-[20px] bg-zinc-900/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/10 backdrop-blur-xl transition-all"
            role="status"
            aria-live="polite"
          >
            <div className="mt-0.5 shrink-0">{getToastIcon(toast.tone)}</div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[14px] font-semibold tracking-tight text-white">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              onClick={() => removeToast(toast.id)}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

// feedback context에 안전하게 접근하는 기본 훅입니다.
export const useFeedback = () => {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }

  return context;
};

// toast 함수만 간단히 꺼내 쓰는 전용 훅입니다.
export const useToast = () => {
  return useFeedback().toast;
};

// alert 함수만 간단히 꺼내 쓰는 전용 훅입니다.
export const useAlertDialog = () => {
  return useFeedback().alert;
};

// confirm 함수만 간단히 꺼내 쓰는 전용 훅입니다.
export const useConfirmDialog = () => {
  return useFeedback().confirm;
};
