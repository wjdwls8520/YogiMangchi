// 관리자 인증/권한 실패 문구를 한 곳에서 통일합니다.
export const ADMIN_LOGIN_REQUIRED_MESSAGE =
  "로그인이 필요한 관리자 기능입니다.";

// 관리자 권한 부족 문구는 공통 접두어를 유지하고 액션만 주입합니다.
export const getAdminForbiddenMessage = (detail: string) => {
  return `관리자 권한이 없어 ${detail}`;
};
