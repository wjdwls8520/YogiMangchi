import Link from "next/link";

export default function Main() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA]">
      <div className="text-center">
        <h1 className="font-bold text-4xl">
          환영합니다!
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          요기망치 메인 페이지입니다.
        </p>

        {/* 로그인 페이지로 이동하는 링크 버튼 */}
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-[#0058FF] px-8 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#0058FF] focus:ring-offset-2"
        >
          로그인하러 가기
        </Link>
      </div>
    </div>
  );
}