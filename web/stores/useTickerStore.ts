import { create } from 'zustand';

// 1. 백엔드에서 주는 코인 기본 정보 타입
export interface CoinMeta {
  symbol: string;
  displayNameKr: string;
  displayNameEn: string;
  baseAsset: string;
  quoteAsset: string;
}

// 2. 바이낸스에서 오는 실시간 정보 타입
export interface RealtimeData {
  price: number;
  changeRate: number;
  volume: number;
  highPrice: number; // 24H 고가
  lowPrice: number;  // 24H 저가
}

// 3. 저수지의 전체 설계도
interface TickerStore {
  // 🌟 주인공 코인 (선택된 코인)
  selectedCoin: string;
  setSelectedCoin: (symbol: string) => void;

  // 🌟 백엔드 코인 목록
  coinMetaList: CoinMeta[];
  setCoinMetaList: (list: CoinMeta[]) => void;

  // 🌟 실시간 데이터 통 (심볼을 키값으로 가짐)
  tickers: Record<string, RealtimeData>;
  updateTicker: (symbol: string, data: Partial<RealtimeData>) => void;
  updateTickerBatch: (updates: Record<string, Partial<RealtimeData>>) => void;
}

// 4. 스토어 생성!
export const useTickerStore = create<TickerStore>((set) => ({
  selectedCoin: "BTCUSDT", // 처음 접속 시 비트코인을 기본으로 띄움
  setSelectedCoin: (symbol) => set({ selectedCoin: symbol }),

  coinMetaList: [],
  setCoinMetaList: (list) => set({ coinMetaList: list }),

  tickers: {},
  updateTicker: (symbol, data) => set((state) => ({
    tickers: {
      ...state.tickers,
      // 기존 데이터 유지하면서 들어온 새 데이터만 덮어씌움
      [symbol]: { ...state.tickers[symbol], ...data } 
    }
  })),

  updateTickerBatch: (updates) =>
    set((state) => {
      const symbols = Object.keys(updates);

      if (symbols.length === 0) {
        return state;
      }

      const nextTickers = { ...state.tickers };

      for (const symbol of symbols) {
        nextTickers[symbol] = {
          ...state.tickers[symbol],
          ...updates[symbol],
        };
      }

      return { tickers: nextTickers };
    }),
}));
