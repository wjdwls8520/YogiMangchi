
// fetch 요청 함수
export async function fetchClient(
  url: string,
  options: RequestInit = {}
) {

    const isFormData = options.body instanceof FormData;        

    const res = await fetch(`http://localhost:8080/api/v1/${url}`, {
        ...options,
        credentials: "include",
        headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
        },
    });

    if (!res.ok) {
        throw new Error(`API 에러: ${res.status}`);
    }

    return res.json();
}