"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/BaseModal";
import Button from "@/components/ui/Button";
// 💡 ArrowDown, ArrowUpDown 아이콘으로 변경되었습니다.
import { ArrowDown, ArrowUpDown, Info, ArrowRight, History, CreditCard } from "lucide-react";
import { formatAssetNumber } from "@/lib/utils/number";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import SegmentTabs from "@/components/ui/SegmentTabs";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cs";
import { fetchClient } from "@/lib/api/client";

interface AssetTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialFromType?: "TRADE_SPOT" | "TRADE_FUTURE";
}

type ModalTab = "transfer" | "history";

const CURRENCY_UNIT = "YD";
const MIN_TRANSFER_AMOUNT = 10;

export default function AssetTransferModal({
  isOpen,
  onClose,
  onSuccess,
  initialFromType = "TRADE_SPOT",
}: AssetTransferModalProps) {
  const { alert, toast } = useFeedback();
  
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>("transfer");
  
  const [fromType, setFromType] = useState<"TRADE_SPOT" | "TRADE_FUTURE">(initialFromType);
  const [toType, setToType] = useState<"TRADE_SPOT" | "TRADE_FUTURE">(
    initialFromType === "TRADE_SPOT" ? "TRADE_FUTURE" : "TRADE_SPOT"
  );
  
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferableAmount, setTransferableAmount] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isOpen || activeModalTab !== "transfer") return;

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const data = await fetchClient(`real/assets/transferable?assetType=${fromType}`);
        setTransferableAmount(data.data?.transferableAmount ?? data.transferableAmount ?? 0);
      } catch (error) {
        console.error("Failed to fetch transferable amount:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [fromType, isOpen, activeModalTab]);

  useEffect(() => {
    if (!isOpen || activeModalTab !== "history") return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const data = await fetchClient("real/assets/transfer/history");
        const list = data.content ?? data.data?.content ?? [];
        setTransferHistory(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Failed to fetch transfer history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [activeModalTab, isOpen]);

  const handleSwitch = () => {
    setFromType(toType);
    setToType(fromType);
    setAmount("");
  };

  const handleMax = () => {
    setAmount(transferableAmount.toString());
  };

  const handleTransfer = async () => {
    const numAmount = Number(amount);
    if (!amount || numAmount <= 0) {
      await alert("이체할 금액을 입력해주세요.");
      return;
    }

    if (numAmount < MIN_TRANSFER_AMOUNT) {
      await alert(`최소 이체 금액은 ${MIN_TRANSFER_AMOUNT} ${CURRENCY_UNIT}입니다.`);
      return;
    }

    if (numAmount > transferableAmount) {
      await alert("이체 가능 금액이 부족합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchClient("real/assets/transfer", {
        method: "POST",
        body: {
          fromType,
          toType,
          amount: numAmount,
          requestId: crypto.randomUUID(),
        },
      });

      toast({ title: "이체 완료", description: "자산이 성공적으로 이동되었습니다.", tone: "success" });
      onSuccess?.();
      setActiveModalTab("history");
      setAmount("");
    } catch (error: any) {
      console.error("Transfer error:", error);
      await alert(error.userMessage || "이체에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal onClose={onClose} title="자산 이체" size="compact">
      <div className="space-y-6 py-2">
        <SegmentTabs
          tabs={[
            { label: "이체 실행", value: "transfer" },
            { label: "이체 내역", value: "history" },
          ]}
          activeTab={activeModalTab}
          onChange={(val) => setActiveModalTab(val as ModalTab)}
          size="md"
        />

        {activeModalTab === "transfer" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* 1. 송금 방향 (상/하 배치로 직관성 극대화) */}
            <div className="relative rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50">
              
              {/* 보내는 곳 (상단) */}
              <div className="p-4 bg-gray-50/80 dark:bg-gray-800/30 rounded-t-xl flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">출금</span>
                  <span className="text-base font-black text-gray-900 dark:text-white">
                    {fromType === "TRADE_SPOT" ? "현물 지갑" : "선물 지갑"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">출금 가능</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {isLoadingBalance ? "..." : formatAssetNumber(transferableAmount)} <span className="text-xs">{CURRENCY_UNIT}</span>
                  </span>
                </div>
              </div>

              {/* 중앙 구분선 & 방향 표시 */}
              <div className="h-[2px] w-full bg-gray-100 dark:bg-gray-800 relative">
                {/* 방향 화살표 (왼쪽: 무조건 아래로 흐름) */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-full p-1 border-2 border-gray-100 dark:border-gray-800 shadow-sm">
                  <ArrowDown className="w-4 h-4 text-[#0058FF]" />
                </div>
                
                {/* 지갑 스위치 버튼 (오른쪽) */}
                <button
                  onClick={handleSwitch}
                  className="absolute right-5 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-1.5 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 hover:border-gray-400 dark:hover:text-white transition-all shadow-sm active:scale-90"
                  title="지갑 위치 바꾸기"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* 받는 곳 (하단) */}
              <div className="p-4 flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-[#0058FF] block mb-1">입금</span>
                  <span className="text-base font-black text-[#0058FF]">
                    {toType === "TRADE_SPOT" ? "현물 지갑" : "선물 지갑"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. 이체 금액 입력 */}
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">보낼 금액</label>
                
                <button 
                  onClick={handleMax}
                  className="text-xs font-black text-[#0058FF] bg-[#0058FF]/10 px-2 py-1 rounded hover:bg-[#0058FF]/20 transition-colors"
                >
                  최대 금액 입력
                </button>
              </div>
              
              <div className="relative group">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-16 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl px-4 pr-16 text-2xl font-black text-gray-900 dark:text-white outline-none focus:border-[#0058FF] transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-sm font-bold text-gray-400">{CURRENCY_UNIT}</span>
                </div>
              </div>
            </div>

            {/* 3. 액션 버튼 & 안내 문구 */}
            <div className="space-y-3 pt-2">
              <Button
                fullWidth
                size="lg"
                onClick={handleTransfer}
                isLoading={isSubmitting}
                disabled={!amount || Number(amount) <= 0 || isSubmitting}
              >
                이체하기
              </Button>
              <div className="flex gap-2 justify-center items-center">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  수수료 없이 즉시 이체됩니다. (최소 <span className="font-bold">{MIN_TRANSFER_AMOUNT} {CURRENCY_UNIT}</span>)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="max-h-[380px] overflow-y-auto pr-1 custom-scrollbar min-h-[300px]">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0058FF] rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-gray-400">내역을 불러오는 중입니다...</p>
                </div>
              ) : transferHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center">
                    <History className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">이체 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transferHistory.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full",
                          item.status === "SUCCESS" 
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {item.status === "SUCCESS" ? "성공" : "실패"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            item.fromType === "TRADE_SPOT" ? "bg-orange-100 text-orange-600" : "bg-purple-100 text-purple-600"
                          )}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {item.fromType === "TRADE_SPOT" ? "현물" : "선물"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {item.toType === "TRADE_SPOT" ? "현물" : "선물"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900 dark:text-white">
                            {formatAssetNumber(item.amount)}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{CURRENCY_UNIT}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              fullWidth
              variant="white"
              onClick={() => setActiveModalTab("transfer")}
            >
              새 이체 실행하기
            </Button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}