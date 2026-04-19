import { create } from "zustand";

interface OrderNotification {
  assetType: string;
  assetTypeDisplayName: string;
  displayNameKr: string;
  executedAmount: number;
  executedAt: string; // ISO datetime
  orderId: number;
  orderType: string;
  price: number;
  quantity: number;
  side: "BUY" | "SELL";
  symbol: string;
  totalFee: number;
}

interface AlaramState {
    notificationId: number;
    actorMemberId: number;
    category: string;
    type: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
    payload: OrderNotification;
}

interface AlarmStore {
  alarms: AlaramState[];
  alarmCount: number;
  setAlarms: (alarms: AlaramState[]) => void;
  addAlarm: (alarm: AlaramState) => void;
  setAlarmCount: (arg0: number) => void;
}


export const useAlaramStore = create<AlarmStore>((set) => ({
  alarms: [],

  alarmCount: 0,

  setAlarmCount: (alarmCount) => set({alarmCount}),

  setAlarms: (alarms) => set({ alarms }),

  addAlarm: (alarm) =>
        set((state) => ({
        alarms: [alarm, ...state.alarms],
        })
    ),

}))

