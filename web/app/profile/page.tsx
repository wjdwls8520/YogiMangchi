"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

// 🌟 1. API 응답 스펙 정의
interface MemberProfile {
  memberId: number;
  provider: string;
  nickname: string;
  profileImgUrl: string | null;
  term_agree: boolean;
  private_agree: boolean;
}

// --- 2. 아직 없는 데이터들 (모킹 유지) ---
const MOCK_HOLDINGS = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `코인_${i + 1}`,
  code: ["BTC", "ETH", "SOL", "XRP", "ADA"][i % 5],
  rate: parseFloat((Math.random() * 20 - 10).toFixed(2)),
  amount: Math.floor(Math.random() * 10000000) + 100000,
}));

const MOCK_POSTS = [
  { id: 1, title: "비트코인 지금 들어가는 거 어떻게 생각하시나요?", date: "방금 전", comments: 5, likes: 12 },
  { id: 2, title: "오늘 수익률 인증합니다! 망치 지수 가즈아!", date: "2시간 전", comments: 3, likes: 8 },
  { id: 3, title: "도지코인 가망 있나요? 살려주세요...", date: "어제", comments: 15, likes: 2 },
];

// --- 3. 메인 컴포넌트 ---
export default function ProfilePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [member, setMember] = useState<MemberProfile | null>(null); // 실제 API 데이터 상태
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"investment" | "community">("investment");
  const [sortBy, setSortBy] = useState<string>("yield");

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    if (!confirm("정말 로그아웃 하시겠습니까?")) return;

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        alert("로그아웃 되었습니다.");
        router.push("/login");
      } else {
        alert("로그아웃 처리 중 문제가 발생했습니다.");
      }
    } catch (err) {
      console.error("로그아웃 에러:", err);
      alert("서버와 통신할 수 없습니다.");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const fetchMemberInfo = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/member/info/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setMember(data);
        }
      } catch (err) {
        console.error("멤버 정보 로드 실패", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemberInfo();
  }, []);

  // 소팅 로직
  const sortedHoldings = useMemo(() => {
    return [...MOCK_HOLDINGS].sort((a, b) => {
      if (sortBy === "yield") return b.rate - a.rate;
      if (sortBy === "amount") return b.amount - a.amount;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [sortBy]);

  if (!isMounted || isLoading) return <div className="min-h-screen" />;
  if (!member) return <div className="p-20 text-center text-gray-400">로그인이 필요합니다.</div>;

  return (
    <div className="min-h-screen pb-12">
      <div className="mx-auto max-w-2xl px-4 pt-10">
        
        {/* [상단] 프로필 카드 - 실제 API 데이터 연결 */}
        <section className="mb-6 rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 shadow-inner">
              {/* profileImgUrl이 기본값("assdsss.png")이거나 없으면 UserIcon 노출 */}
              {member.profileImgUrl && member.profileImgUrl !== "assdsss.png" ? (
                <img src={member.profileImgUrl} alt="profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-16 w-16 text-gray-300" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start text-gray-900">
                <h2 className="text-2xl font-black">{member.nickname}</h2>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  member.provider === 'kakao' ? 'bg-[#FEE500] text-[#3C1E1E]' : 'bg-gray-100 text-gray-600'
                }`}>
                  {member.provider === 'kakao' ? '카카오 계정연동' : '구글 계정연동'}
                </span>
              </div>
              
              {/* 한줄소개/망치지수 등은 API에 없으므로 일단 텍스트 유지 */}
              <p className="mb-4 text-sm text-gray-400 font-medium">한줄소개를 등록해주세요.</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2">
                {/* <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Invest Day</span>
                  <span className="text-sm font-black text-[#0058FF]">D+1</span>
                </div> */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Followers</span>
                  <span className="text-sm font-black text-gray-900"><span>0</span> 명</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Mangchi</span>
                  <span className="text-sm font-black text-orange-500"><span>0</span> 망치</span>
                </div>
              </div>
            </div>
            <Link href="/profile/edit">
              <Button variant="white" size="sm" className="rounded-xl text-xs h-9 sm:mt-1 border border-gray-100">정보 수정</Button>
            </Link>
          </div>
        </section>

        {/* [중단] 탭 스위처 */}
        <div className="mb-6 flex gap-2 rounded-2xl bg-gray-200/50 p-1.5">
          <button 
            onClick={() => setActiveTab("investment")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'investment' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            나의 투자
          </button>
          <button 
            onClick={() => setActiveTab("community")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'community' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            커뮤니티
          </button>
        </div>

        {/* [하단] 탭별 컨텐츠 영역 */}
        <div className="space-y-6">
          {activeTab === "investment" ? (
            <>
              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="mb-6 text-lg font-black text-gray-900">투자 성적표</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#F8F9FA] p-5">
                    <p className="mb-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">총 자산 현황</p>
                    <h4 className="text-xl font-black text-gray-900">0원</h4>
                  </div>
                  <div className="rounded-2xl bg-[#F8F9FA] p-5 border border-red-50">
                    <p className="mb-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">누적 수익률</p>
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-xl font-black text-red-500">0%</h4>
                      <p className="text-[10px] text-red-400 font-bold">▲ 0</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">보유 종목 <span className="text-[#0058FF]">{MOCK_HOLDINGS.length}</span></h3>
                  <div className="w-28">
                    <Select 
                      size="sm" 
                      options={[{label:'수익률순', value:'yield'}, {label:'보유량순', value:'amount'}, {label:'이름순', value:'name'}]} 
                      value={sortBy} 
                      onChange={(val) => setSortBy(String(val))}
                    />
                  </div>
                </div>
                <div className="space-y-3 max-h-[504px] overflow-y-auto pr-2 custom-scrollbar">
                  {sortedHoldings.map((coin) => (
                    <div key={coin.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">{coin.code}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{coin.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{coin.amount.toLocaleString()}원 보유</p>
                        </div>
                      </div>
                      <p className={`text-sm font-black ${coin.rate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {coin.rate > 0 && '+'}{coin.rate}%
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* 커뮤니티 섹션은 이전과 동일한 MOCK 데이터 사용 */}
              <section className="grid grid-cols-2 gap-3">
                <ActivityCard label="작성한 글" count={12} />
                <ActivityCard label="좋아요 한 글" count={45} />
                <ActivityCard label="팔로우 차티스트" count={8} />
                <ActivityCard label="좋아요 차티스트" count={21} />
              </section>

              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">최근 작성한 글</h3>
                  <button className="text-xs text-gray-400 font-bold hover:text-gray-600">전체보기</button>
                </div>
                <div className="space-y-4">
                  {MOCK_POSTS.map((post) => (
                    <div key={post.id} className="group cursor-pointer border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <p className="mb-2 text-sm font-bold text-gray-800 group-hover:text-[#0058FF] transition-colors">{post.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                        <span>{post.date}</span>
                        <span>댓글 {post.comments}</span>
                        <span>좋아요 {post.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <footer className="pt-4">
            <Button variant="white" fullWidth size="lg" onClick={handleLogout}>
              로그아웃
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ label, count }: { label: string, count: number }) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-start">
      <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-gray-900">{count}</p>
    </div>
  );
}