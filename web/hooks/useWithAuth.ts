import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export const useWithAuth = () => {
  const router = useRouter();

  return (callback: () => void) => {
    return () => {
      const { isLogin } = useAuthStore.getState();

      if (!isLogin) {
        const goLogin = confirm("로그인이 필요합니다. \n로그인 페이지로 이동하시겠습니까?");
        if (goLogin) router.replace("/login");
        return;
      }

      callback();
    };
  };
};