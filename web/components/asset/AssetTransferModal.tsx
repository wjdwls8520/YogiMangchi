"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/BaseModal";
import Button from "@/components/ui/Button";
import { ArrowUpDown, Info, ArrowRight, History, CreditCard } from "lucide-react";
import { formatAssetNumber } from "@/lib/utils/number";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import SegmentTabs from "@/components/ui/SegmentTabs";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cs";

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

  // Fetch transferable amount when fromType changes
  useEffect(() => {
    if (!isOpen || activeModalTab !== "transfer") return;

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const response = await fetch(
          `http://localhost:8080/api/v1/real/assets/transferable?assetType=${fromType}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setTransferableAmount(data.data?.transferableAmount ?? data.transferableAmount ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch transferable amount:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [fromType, isOpen, activeModalTab]);

  // Fetch history when history tab is active
  useEffect(() => {
    if (!isOpen || activeModalTab !== "history") return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          "http://localhost:8080/api/v1/real/assets/transfer/history",
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          // Backend returns CursorResponseDto { content: [...], hasNext: ... }
          // Or it might be wrapped in a data property
          const list = data.content ?? data.data?.content ?? [];
          setTransferHistory(Array.isArray(list) ? list : []);
        }
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
      const response = await fetch("http://localhost:8080/api/v1/real/assets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromType,
          toType,
          amount: numAmount,
          requestId: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }),
        credentials: "include",
      });

      if (response.ok) {
        toast({ title: "이체 완료", description: "자산이 성공적으로 이동되었습니다.", tone: "success" });
        onSuccess?.();
        // Switch to history tab to see the result
        setActiveModalTab("history");
        setAmount("");
      } else {
        const errorData = await response.json();
        await alert(errorData.message || "이체에 실패했습니다.");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      await alert("서버 통신 오류가 발생했습니다.");
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
            {/* Direction Selection */}
            <div className="relative space-y-2">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 transition-colors">
                <label className="text-xs font-bold text-gray-400 block mb-1">보내는 지갑</label>
                <div className="text-sm font-black text-gray-900 dark:text-white">
                  {fromType === "TRADE_SPOT" ? "실전 현물 지갑" : "실전 선물 지갑"}
                </div>
              </div>

              <button
                onClick={handleSwitch}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:border-[#0058FF] transition-all z-10 shadow-sm active:scale-90"
              >
                <ArrowUpDown className="w-4 h-4 text-[#0058FF]" />
              </button>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 transition-colors">
                <label className="text-xs font-bold text-gray-400 block mb-1">받는 지갑</label>
                <div className="text-sm font-black text-gray-900 dark:text-white">
                  {toType === "TRADE_SPOT" ? "실전 현물 지갑" : "실전 선물 지갑"}
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-gray-400">이체 금액</label>
                <span className="text-xs font-medium text-gray-500">
                  이체 가능: <span className="text-gray-900 dark:text-white font-bold">{isLoadingBalance ? "..." : formatAssetNumber(transferableAmount)} {CURRENCY_UNIT}</span>
                </span>
              </div>
              
              <div className="relative group">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 pr-20 text-lg font-black text-gray-900 dark:text-white outline-none focus:border-[#0058FF] focus:ring-4 focus:ring-[#0058FF]/10 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-400 mr-1">{CURRENCY_UNIT}</span>
                  <button
                    onClick={handleMax}
                    className="text-xs font-black text-[#0058FF] hover:bg-[#0058FF]/10 px-2 py-1 rounded transition-colors"
                  >
                    최대
                  </button>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                현물 지갑과 선물 지갑 간의 이체는 즉시 처리되며, 수수료가 발생하지 않습니다. 최소 이체 금액은 {MIN_TRANSFER_AMOUNT} {CURRENCY_UNIT}입니다.
              </p>
            </div>

            {/* Action Button */}
            <Button
              fullWidth
              size="lg"
              onClick={handleTransfer}
              isLoading={isSubmitting}
              disabled={!amount || Number(amount) <= 0 || isSubmitting}
            >
              확인
            </Button>
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
