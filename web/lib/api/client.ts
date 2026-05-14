// 공통 API 클라이언트에서 객체 body도 바로 받을 수 있도록 확장한 옵션 타입
type FetchClientOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const extractApiErrorMessage = (payload: unknown) => {
  if (typeof payload === "string") {
    return payload;
  }

  if (!isRecord(payload)) {
    return "";
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  const data = isRecord(payload.data) ? payload.data : null;

  if (data && typeof data.message === "string") {
    return data.message;
  }

  return "";
};

export class FetchClientError extends Error {
  status: number;
  userMessage: string;
  payload: unknown;

  constructor(status: number, userMessage = "", payload: unknown = null) {
    // 사용자에게 노출되는 alert/toast 창을 깔끔하고 고급스럽게 유지하기 위해, 기술적인 접두사나 에러 번호 없이 정제된 메시지만 전달합니다.
    super(userMessage || `일시적인 오류가 발생했습니다. (코드: ${status})`);
    this.name = "FetchClientError";
    this.status = status;
    this.userMessage = userMessage;
    this.payload = payload;
  }
}

export async function fetchClient(
  url: string,
  options: FetchClientOptions = {}
) {
  const isFormData = options.body instanceof FormData;

  const isObject =
    options.body &&
    typeof options.body === "object" &&
    !isFormData;

  // plain object body는 fetch에 바로 넣지 못하므로 JSON 문자열로 변환
  const requestBody =
    isObject && options.body
      ? JSON.stringify(options.body)
      : (options.body as BodyInit | null | undefined);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}`}/api/v1/${url}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData || !requestBody ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    body: requestBody,
  });

  const contentType = res.headers.get("content-type");
  const isJsonResponse = contentType?.includes("application/json");
  const payload = isJsonResponse ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new FetchClientError(
      res.status,
      extractApiErrorMessage(payload),
      payload
    );
  }

  if (isJsonResponse) {
    return payload;
  }

  return null;
}
