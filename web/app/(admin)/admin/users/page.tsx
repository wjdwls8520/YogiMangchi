"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import Input from "@/components/ui/Input";
import { ChevronDown } from "lucide-react";
import { getAdminMembers, type AdminMember } from "@/lib/api/admin-member";
import UserDetailModal from "./components/UserDetailModal";
import CustomSelect from "../components/CustomSelect";

const ADMIN_MEMBER_PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { alert } = useFeedback();
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);

  // 검색 필터 상태
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "WITHDRAWN">("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "VERIFIED_USER" | "ADMIN">("ALL");
  const [memberIdInput, setMemberIdInput] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");

  // 실제 API 요청에 쓰일 검색 필터 캐시 (리렌더링 무한 루프 방지를 위해 useRef 사용)
  const appliedFiltersRef = useRef<{
    status: "ALL" | "ACTIVE" | "WITHDRAWN";
    role: "ALL" | "USER" | "VERIFIED_USER" | "ADMIN";
    memberId?: number;
    nickname?: string;
  }>({ status: "ALL", role: "ALL" });

  const loadMembers = async ({
    reset = false,
    cursorId,
    overrideFilters,
  }: {
    reset?: boolean;
    cursorId?: number;
    overrideFilters?: {
      status: "ALL" | "ACTIVE" | "WITHDRAWN";
      role: "ALL" | "USER" | "VERIFIED_USER" | "ADMIN";
      memberId?: number;
      nickname?: string;
    };
  } = {}) => {
    if (reset) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const filters = overrideFilters
        ? overrideFilters
        : reset
        ? {
            status: statusFilter,
            role: roleFilter,
            memberId: memberIdInput ? Number(memberIdInput) : undefined,
            nickname: nicknameInput.trim() || undefined,
          }
        : appliedFiltersRef.current;

      if (reset) {
        appliedFiltersRef.current = filters;
      }

      const response = await getAdminMembers({
        status: filters.status,
        role: filters.role === "ALL" ? undefined : filters.role,
        memberId: filters.memberId,
        nickname: filters.nickname,
        cursorId: reset ? undefined : cursorId,
        size: ADMIN_MEMBER_PAGE_SIZE,
      });

      const nextContent = response.content ?? [];
      setMembers((prev) => (reset ? nextContent : [...prev, ...nextContent]));
      setHasNext(response.hasNext === true);
      setNextCursorId(response.nextCursorId ?? null);
    } catch (err) {
      console.error("회원 목록 조회 실패:", err);
      if (reset) {
        setMembers([]);
        setError("회원 목록을 불러오지 못했습니다.");
      } else {
        await alert("회원 목록을 더 불러오지 못했습니다.");
      }
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    void loadMembers({ reset: true });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadMembers({ reset: true });
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setRoleFilter("ALL");
    setMemberIdInput("");
    setNicknameInput("");
    void loadMembers({
      reset: true,
      overrideFilters: {
        status: "ALL",
        role: "ALL",
        memberId: undefined,
        nickname: undefined,
      },
    });
  };

  const handleMemberWithdrawn = () => {
    void loadMembers({ reset: true });
  };

  const formatDateTime = (value: string) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  };

  const activeCount = members.filter((m) => m.deleteYn === "N").length;
  const withdrawnCount = members.filter((m) => m.deleteYn === "Y").length;

  return (
    <div className="space-y-8">
      {/* 1. 상단 요약 카드 그리드 (글자 넘침 방지 min-w-0 및 truncate 적용) */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">회원 관리</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5 min-w-0">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">조회된 전체 회원</p>
            <p className="mt-2 text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 truncate break-all">{members.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5 min-w-0">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">활성 회원 수</p>
            <p className="mt-2 text-2xl md:text-3xl font-black text-emerald-600 truncate break-all">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5 min-w-0">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">탈퇴 회원 수</p>
            <p className="mt-2 text-2xl md:text-3xl font-black text-rose-600 truncate break-all">{withdrawnCount}</p>
          </div>
        </div>
      </section>

      {/* 2. 검색 필터 영역 (커스텀 셀렉트 박스 적용) */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CustomSelect
              label="회원 상태"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "전체" },
                { value: "ACTIVE", label: "활성 회원" },
                { value: "WITHDRAWN", label: "탈퇴 회원" },
              ]}
            />

            <CustomSelect
              label="권한 역할"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "ALL", label: "전체" },
                { value: "USER", label: "일반 회원 (USER)" },
                { value: "VERIFIED_USER", label: "인증 회원 (VERIFIED_USER)" },
                { value: "ADMIN", label: "어드민 (ADMIN)" },
              ]}
            />

            <label className="space-y-2">
              <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">회원 ID</span>
              <Input
                type="number"
                value={memberIdInput}
                onChange={(e) => setMemberIdInput(e.target.value)}
                placeholder="ID 번호로 검색"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">닉네임</span>
              <Input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="닉네임 검색어 입력"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="white" onClick={handleResetFilters}>
              초기화
            </Button>
            <Button type="submit">검색</Button>
          </div>
        </form>
      </section>

      {/* 3. 테이블 목록 영역 */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">회원 목록</h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="w-[80px] px-3 py-4 text-center font-black">ID</th>
                <th className="w-[180px] px-3 py-4 text-left font-black">닉네임</th>
                <th className="w-[140px] px-3 py-4 text-center font-black">권한 역할</th>
                <th className="w-[100px] px-3 py-4 text-center font-black">상태</th>
                <th className="w-[200px] px-3 py-4 text-left font-black">소셜 이메일</th>
                <th className="w-[180px] px-3 py-4 text-center font-black">가입 일자</th>
                <th className="w-[100px] px-3 py-4 text-center font-black">관리</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm font-medium text-gray-500">
                    회원 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm font-medium text-red-500">
                    {error}
                  </td>
                </tr>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <tr
                    key={member.memberId}
                    className="group border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-4 text-center font-bold text-gray-500 dark:text-gray-400">
                      {member.memberId}
                    </td>
                    <td className="px-3 py-4 font-black text-gray-900 dark:text-gray-100 truncate">
                      {member.nickname}
                    </td>
                    <td className="px-3 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                      {member.role}
                    </td>
                    <td className="px-3 py-4 text-center">
                      {member.deleteYn === "Y" ? (
                        <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-600 ring-1 ring-rose-100">
                          탈퇴
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-600 ring-1 ring-emerald-100">
                          정상
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-400 truncate">
                      {member.oauthEmail || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-600 dark:text-gray-400">
                      {formatDateTime(member.createdAt)}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="white"
                          size="xs"
                          onClick={() => setSelectedMember(member)}
                        >
                          상세
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm font-medium text-gray-500">
                    조회된 회원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. 더보기 페이징 */}
        {!isLoading && !error && hasNext ? (
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="white"
              onClick={() => void loadMembers({ cursorId: nextCursorId ?? undefined })}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                "불러오는 중..."
              ) : (
                <span className="inline-flex items-center gap-1">
                  회원 더보기
                  <ChevronDown size={16} />
                </span>
              )}
            </Button>
          </div>
        ) : null}
      </section>

      {/* 5. 상세 모달 */}
      {selectedMember && (
        <UserDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onWithdrawn={handleMemberWithdrawn}
        />
      )}
    </div>
  );
}