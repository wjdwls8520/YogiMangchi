// 공통 API 클라이언트에서 객체 body도 바로 받을 수 있도록 확장한 옵션 타입
type FetchClientOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

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

  const res = await fetch(`http://localhost:8080/api/v1/${url}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    body: requestBody,
  });

  if (!res.ok) {
    throw new Error(`API 에러: ${res.status}`);
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return res.json();
  }

  return null;
}
