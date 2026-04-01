import { cookies } from "next/headers";

export async function serverFetchClient(
  url: string,
  options: RequestInit = {}
) {
  const isFormData = options.body instanceof FormData;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`http://localhost:8080/api/v1/${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(cookieHeader && { Cookie: cookieHeader }),
      ...options.headers,
    },
    cache: "no-store",
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