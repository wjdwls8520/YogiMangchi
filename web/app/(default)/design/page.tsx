"use client";

import { useState } from "react";
import * as Icons from "@/components/icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Tabs from "@/components/ui/Tabs";

export default function DesignSystemPage() {
  // Icons 객체 안에 있는 모든 아이콘들을 배열로 변환합니다.
  const iconList = Object.entries(Icons);

  // 셀렉트박스 테스트용 상태값
  const [selectedValue, setSelectedValue] = useState<string | number>("");

  // 셀렉트박스에 들어갈 옵션 데이터
  const sampleOptions = [
    { label: "1분봉 실시간", value: "1m" },
    { label: "15분봉", value: "15m" },
    { label: "1시간봉", value: "1h" },
    { label: "1일봉", value: "1d" },
  ];

  //탭상태
  const [currentTab, setCurrentTab] = useState("buy");


  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
          요기망치 디자인 시스템 🎨
        </h1>
        <p className="mb-10 text-gray-500">
          팀원들을 위한 공통 아이콘 및 UI 컴포넌트 갤러리입니다. (실제 유저에게는 노출되지 않습니다.)
        </p>


        {/* 아이콘섹션 */}
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 mb-10">
          <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-4">
            svgIcons ({iconList.length}개)(아이콘이름 태그로 사용) - import * as Icons from "@/components/icons";
          </h2>
          
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

        {/* 버튼섹션 */}
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-4">
            버튼 스타일(Button 태그로 사용) - import Button from "@/components/ui/Button";
          </h2>
          <div className="mb-10">
            <div className="font-bold text-xl">색상별</div>
            <div className="mb-2 font-bold">사용예시/ variant="색 이름" </div>
            <Button>blue(기본값)</Button>
            <Button variant="gray">gray</Button>
            <Button variant="white">white</Button>
            <Button variant="red">red</Button>
            <Button variant="sky">sky</Button>
            <Button variant="ghost">ghost</Button>
          </div>

          <div className="mb-10">
            <div className="font-bold text-xl">크기별</div>
            <div className="mb-2 font-bold">사용예시/ size="sm", size="md"(기본값), size="lg" </div>
              <Button size="sm">sm</Button> <Button>md(기본값)</Button> <Button size="lg">lg</Button>
          </div>

          <div className="mb-10">
            <div className="font-bold text-xl">풀사이즈</div>
            <div className="mb-2 font-bold">사용예시/ fullWidth</div>
              <Button className="w-full">fullWidth</Button> 
          </div>

          <div className="mb-10">
            <div className="font-bold text-xl">비활성화</div>
            <div className="mb-2 font-bold">사용예시/ disabled</div>
              <Button disabled>disabled</Button> 
          </div>
        </div>

        {/* 인풋 섹션*/}
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-4">
            입력창 스타일(Input 태그로 사용) - import Input from "@/components/ui/Input";
          </h2>
          
          <div className="mb-10 max-w-md">
            <div className="font-bold text-xl">상태별 (기본 / 에러)</div>
            <div className="mb-4 text-sm text-gray-500">사용예시/ variant="error"</div>
            <div className="space-y-4">
              <Input placeholder="기본 입력창입니다. (클릭해서 포커스 확인)" />
              <Input variant="error" placeholder="에러가 발생한 입력창입니다." />
            </div>
          </div>

          <div className="mb-10 max-w-md">
            <div className="font-bold text-xl">크기별</div>
            <div className="mb-4 text-sm text-gray-500">사용예시/ size="sm", size="md"(기본), size="lg"</div>
            <div className="space-y-4">
              <Input size="sm" placeholder="sm 사이즈 (h-9)" />
              <Input size="md" placeholder="md 사이즈 (h-11, 기본값)" />
              <Input size="lg" placeholder="lg 사이즈 (h-14)" />
            </div>
          </div>

          <div className="mb-10 max-w-md">
            <div className="font-bold text-xl">비활성화</div>
            <div className="mb-4 text-sm text-gray-500">사용예시/ disabled</div>
            <Input disabled value="비활성화된(disabled) 입력창입니다." />
          </div>

          <div className="mb-10 max-w-2xl">
            <div className="font-bold text-xl">응용: 버튼과 나란히 쓰기 (높이 일치)</div>
            <div className="mb-4 text-sm text-gray-500">Input과 Button의 size를 똑같이 맞춰주면 완벽하게 일직선이 됩니다.</div>
            <div className="flex gap-2">
              {/* 둘 다 size="lg"로 맞춘 예시 */}
              <Input size="lg" placeholder="휴대폰 번호 입력" />
              <Button variant="gray" size="lg" className="shrink-0">인증번호 받기</Button>
            </div>
          </div>
        </div>

        {/* 셀렉트박스 섹션 */}
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 mt-10">
          <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-4">
            커스텀 셀렉트박스 (options 배열 방식)
          </h2>
          
          <div className="mb-10 max-w-md">
            <div className="font-bold text-xl">상태별 (기본 / 에러)</div>
            <div className="space-y-4 mt-4">
              <Select 
                options={sampleOptions} 
                value={selectedValue} 
                onChange={setSelectedValue} 
                placeholder="간격" 
              />
              <Select 
                options={sampleOptions} 
                variant="error" 
                placeholder="에러 상태 (필수 선택)" 
              />
            </div>
          </div>

          <div className="mb-10 max-w-md">
            <div className="font-bold text-xl">크기별</div>
            <div className="space-y-4 mt-4">
              <Select size="sm" options={sampleOptions} placeholder="sm 사이즈 (h-9)" />
              <Select size="md" options={sampleOptions} placeholder="md 사이즈 (h-11)" />
              <Select size="lg" options={sampleOptions} placeholder="lg 사이즈 (h-14)" />
            </div>
          </div>

          <div className="mb-10 max-w-md">
            <div className="font-bold text-xl">비활성화 (Disabled)</div>
            <div className="mt-4">
              <Select disabled options={sampleOptions} placeholder="비활성화 상태" />
            </div>
          </div>

          <div className="mb-10 max-w-3xl">
            <div className="font-bold text-xl">응용: 인풋, 버튼과 완벽한 일직선 조합!</div>
            <div className="flex gap-2 mt-4">
              <div className="w-1/3">
                <Select 
                  size="lg" 
                  options={[
                    { label: "010", value: "010" },
                    { label: "011", value: "011" }
                  ]} 
                  placeholder="통신사" 
                />
              </div>
              <Input size="lg" placeholder="나머지 번호 입력" className="w-1/2" />
              <Button variant="blue" size="lg" className="shrink-0">인증요청</Button>
            </div>
          </div>

        </div>

        {/* 탭 섹션 */}
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 mt-10">
          <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-4">
            탭
          </h2>

          <Tabs 
            activeTab={currentTab}
            onChange={setCurrentTab}
            fullWidth={true} // 탭을 좌우로 50:50 꽉 채우고 싶을 때
            // fullWidth={false} 로 하면 왼쪽으로 딱 붙어서 예쁘게 나열됩니다.
            tabs={[
              { 
                label: "BTC 매수", 
                value: "buy", 
                activeColor: "text-[#E12343] border-[#E12343]"
              },
              { 
                label: "BTC 매도", 
                value: "sell", 
                activeColor: "text-[#1763B6] border-[#1763B6]"
              }
            ]}
          />
        </div>

        {/* //섹션끝// */}

      </div>
    </div>
  );
}