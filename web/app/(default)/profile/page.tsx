"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from "recharts";
import { useAuthStore } from "@/stores/useAuthStore";

// --- 🎨 인라인 SVG 아이콘 컴포넌트들 ---
const Icons = {
  Person: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Help: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  History: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /></svg>,
  Message: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  Heart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
};

const PORTFOLIO_DATA = [
  { name: "KRW", value: 36.2, color: "#9CB34E" },
  { name: "BTC", value: 20.5, color: "#1D7CA7" },
  { name: "ETH", value: 17.7, color: "#5F5592" },
  { name: "XRP", value: 13.9, color: "#B5679B" },
  { name: "SOL", value: 11.7, color: "#E97A31" },
];

const MOCK_POSTS = [
  { id: 1, title: "오늘 비트코인 1억 찍나요? 다들 어떻게 보심?", date: "방금 전", comments: 12, likes: 45 },
  { id: 2, title: "솔라나 수익률 30% 인증합니다!! 망치지수 가즈아", date: "2시간 전", comments: 8, likes: 32 },
  { id: 3, title: "코인 처음 시작하는데 포트폴리오 조언 부탁드려요.", date: "어제", comments: 5, likes: 10 },
];

export default function ProfilePage() {
  const { isLogin, user } = useAuthStore();
  const [mainTab, setMainTab] = useState<"investment" | "community">("investment");
  const [activeSubTab, setActiveSubTab] = useState("holdings");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;
  if (!isLogin || !user) return <div className="p-20 text-center">로그인이 필요합니다.</div>;

  return (
    <div className="">
      <div className="">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* 🌟 좌측 사이드바: 프로필 + 자산 요약 (고정) */}
          <aside className="w-full lg:w-[400px] lg:sticky lg:top-24 space-y-6">
            <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 overflow-hidden text-gray-300 p-4">
                  {user.profileImgUrl ? <img src={user.profileImgUrl} alt="p" className="w-full h-full object-cover" /> : <Icons.Person />}
                </div>
                <h2 className="text-2xl font-black text-gray-900">{user.nickname}</h2>
                <p className="text-sm text-gray-400 mt-1 font-medium">{user.profileMsg || "한줄소개가 없습니다."}</p>
                
                <div className="grid grid-cols-2 w-full mt-8 pt-6 border-t border-gray-50">
                   <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Followers</p>
                      <p className="text-lg font-black">{user.followerCount}</p>
                   </div>
                   <div className="text-center border-l border-gray-50">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mangchi</p>
                      <p className="text-lg font-black text-orange-500">{user.bestCount}</p>
                   </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-[#0058FF] p-8 text-white shadow-xl shadow-blue-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold opacity-80 flex items-center gap-1">내 보유자산 <Icons.Help /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold opacity-80 flex items-center gap-1">보유 KRW</span>
              </div>
              <h3 className="text-3xl font-black mb-5">24,208,080</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold opacity-80 flex items-center gap-1">총 보유자산</span>
              </div>
              <h3 className="text-3xl font-black mb-1">424,208,080</h3>
              {/* <p className="text-sm font-black text-blue-200">+452,000 (3.82%) ▲</p> */}
              
              <div className="grid grid-cols-2 gap-y-4 mt-8 pt-6 border-t border-white/10">
                <AssetMiniInfo label="총매수" value="11,851,884" />
                <AssetMiniInfo label="평가손익" value="12,356,196" align="right" />
                <AssetMiniInfo label="총평가" value="12,208,080" />
                <AssetMiniInfo label="수익률" value="452,000%" align="right" />
              </div>
            </section>
          </aside>

          {/* 🌟 우측 메인 컨텐츠 영역 */}
          <main className="flex-1 w-full space-y-6">
            
            {/* 메인 탭 전환 (나의 투자 / 커뮤니티) */}
            <div className="flex p-1 bg-gray-200/50 rounded-2xl gap-1">
              <button 
                onClick={() => setMainTab("investment")}
                className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${mainTab === 'investment' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                나의 투자
              </button>
              <button 
                onClick={() => setMainTab("community")}
                className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${mainTab === 'community' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                커뮤니티
              </button>
            </div>

            {mainTab === "investment" ? (
              /* --- 📈 나의 투자 탭 내용 --- */
              <div className="space-y-6 animate-in fade-in duration-300">
                <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">자산 포트폴리오 비중</h3>
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="h-[260px] w-full md:w-1/2 relative">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={PORTFOLIO_DATA} innerRadius={75} outerRadius={100} paddingAngle={5} dataKey="value">
                            {PORTFOLIO_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            <Label 
                                value="보유비중(%)" 
                                position="center" 
                                fill="#999" 
                                style={{ fontSize: '12px', fontWeight: 'bold' }} 
                              />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 w-full md:w-1/2">
                      {PORTFOLIO_DATA.map((item) => (
                        <div key={item.name} className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}/>{item.name}
                          </span>
                          <span className="text-sm font-black text-gray-900">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-[32px] bg-white shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex bg-gray-50/50">
                    <SubTab active={activeSubTab === 'holdings'} label="보유자산" icon={<Icons.List />} onClick={() => setActiveSubTab('holdings')} />
                    <SubTab active={activeSubTab === 'open'} label="미체결" icon={<Icons.Clock />} onClick={() => setActiveSubTab('open')} />
                    <SubTab active={activeSubTab === 'history'} label="거래내역" icon={<Icons.History />} onClick={() => setActiveSubTab('history')} />
                  </div>
                  <div className="p-6 md:p-10">
                    {activeSubTab === 'holdings' && (
                      <div className="space-y-4">
                        <AssetRow name="비트코인" symbol="BTC" amount="0.90295380" avgPrice="32,167,820" evalAmount="51,195,674" buyAmount="29,046,056" profit="+22,149,619" rate="+76.26" />
                        <AssetRow name="솔라나" symbol="SOL" amount="45.53554462" avgPrice="496.7" evalAmount="5,899,129" buyAmount="22,619" profit="+5,876,511" rate="+32.21" />
                        <AssetRow name="이더리움" symbol="ETH" amount="4.21051200" avgPrice="3,375,000" evalAmount="14,208,000" buyAmount="14,210,000" profit="-2,000" rate="-0.01" isLoss />
                      </div>
                    )}
                    {activeSubTab !== 'holdings' && <div className="py-32 text-center text-gray-300 font-bold">내역이 없습니다.</div>}
                  </div>
                </section>
              </div>
            ) : (
              /* --- 💬 커뮤니티 탭 내용 --- */
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 활동 요약 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <CommunityStatCard label="작성 글" count={12} icon={<Icons.List />} />
                  <CommunityStatCard label="좋아요 한 게시글" count={124} icon={<Icons.Heart />} />
                  <CommunityStatCard label="팔로워" count={user.followerCount} />
                  <CommunityStatCard label="팔로잉" count={56} />
                </div>

                {/* 최근 게시글 리스트 */}
                <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-black text-gray-900">최근 작성한 글</h3>
                      <button className="text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors">전체보기</button>
                   </div>
                   
                   <div className="space-y-6">
                      {MOCK_POSTS.map((post) => (
                        <div key={post.id} className="group cursor-pointer border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                           <h4 className="text-base font-bold text-gray-800 group-hover:text-[#0058FF] transition-colors mb-2">
                              {post.title}
                           </h4>
                           <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                              <span>{post.date}</span>
                              <div className="flex items-center gap-1"><Icons.Message /> {post.comments}</div>
                              <div className="flex items-center gap-1"><Icons.Heart /> {post.likes}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// --- 🛠️ 하위 컴포넌트들 ---

function AssetMiniInfo({ label, value, align = "left" }: any) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-[10px] opacity-60 font-bold mb-0.5 uppercase">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function SubTab({ active, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-6 text-sm font-black transition-all border-b-2 ${active ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
      {icon} {label}
    </button>
  );
}

function CommunityStatCard({ label, count, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center gap-1">
      {icon && <div className="text-blue-500 mb-1 opacity-50">{icon}</div>}
      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{label}</p>
      <p className="text-xl font-black text-gray-900">{count.toLocaleString()}</p>
    </div>
  );
}

function AssetRow({ name, symbol, amount, avgPrice, evalAmount, buyAmount, profit, rate, isLoss }: any) {
  const color = isLoss ? 'text-blue-500' : 'text-red-500';
  return (
    <div className="p-6 rounded-[24px] border border-gray-100 bg-white hover:border-blue-100 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400">{symbol}</div>
          <div><h4 className="text-sm font-black text-gray-900">{name}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">{symbol}</p></div>
        </div>
        <div className="text-right"><p className={`text-sm font-black ${color}`}>{profit} <span className="text-[10px]">KRW</span></p><p className={`text-[11px] font-black ${color}`}>{rate}%</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
        <DataBox label="보유수량" value={amount} unit={symbol} />
        <DataBox label="평가금액" value={evalAmount} unit="KRW" />
        <DataBox label="매수평균가" value={avgPrice} unit="KRW" />
        <DataBox label="매수금액" value={buyAmount} unit="KRW" />
      </div>
    </div>
  );
}

function DataBox({ label, value, unit }: any) {
  return (
    <div>
      <p className="text-[9px] text-gray-400 font-bold mb-1 uppercase">{label}</p>
      <p className="text-[11px] font-black text-gray-800">{value} <span className="text-[9px] text-gray-400 font-medium">{unit}</span></p>
    </div>
  );
}