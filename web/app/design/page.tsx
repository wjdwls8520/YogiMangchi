// app/design/page.tsx
import * as Icons from "@/components/icons";

export default function DesignSystemPage() {
  // Icons 객체 안에 있는 모든 아이콘들을 배열로 변환합니다.
  const iconList = Object.entries(Icons);

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
          요기망치 디자인 시스템 🎨
        </h1>
        <p className="mb-10 text-gray-500">
          팀원들을 위한 공통 아이콘 및 UI 컴포넌트 갤러리입니다. (실제 유저에게는 노출되지 않습니다.)
        </p>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-4">
            Icons ({iconList.length}개)
          </h2>
          
          {/* 아이콘들을 바둑판 모양으로 쫙 뿌려줍니다 */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
            {iconList.map(([iconName, IconComponent]) => (
              <div 
                key={iconName} 
                className="group flex flex-col items-center justify-center rounded-xl border border-gray-100 p-4 transition-all hover:border-[#0058FF] hover:bg-blue-50 hover:shadow-md"
              >
                {/* 아이콘 렌더링 (기본 크기 w-8 h-8 지정) */}
                <div className="mb-3 flex items-center justify-center text-gray-600 transition-colors group-hover:text-[#0058FF]">
                  <IconComponent className="h-8 w-8" />
                </div>
                {/* 아이콘 이름 (복사하기 쉽게 만들어줌) */}
                <span className="text-[11px] font-medium text-gray-500 group-hover:text-[#0058FF]">
                  {iconName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}