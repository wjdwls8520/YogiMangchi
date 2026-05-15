
import { create } from "zustand";
import { fetchClient } from "@/lib/api/client";

export interface MarketSymbolMeta {
  symbol: string;
  displayNameKr: string;
  displayNameEn: string;
  baseAsset: string;
  quoteAsset: string;
}

interface MarketStore {
  marketSymbols: MarketSymbolMeta[];
  isLoading: boolean;
  error: string | null;
  fetchMarketSymbols: () => Promise<void>;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  marketSymbols: [],
  isLoading: false,
  error: null,
  fetchMarketSymbols: async () => {
    if (get().marketSymbols.length > 0) return;
    
    set({ isLoading: true, error: null });
    try {
      // Note: adjust the endpoint if needed.
      // Based on AssetsPage, it was fetch("http://localhost:8080/api/v1/market/spot/symbols")
      // We should use fetchClient for consistency.
      const response = await fetchClient<MarketSymbolMeta[]>("market/spot/symbols", {
        method: "GET",
      });
      set({ marketSymbols: response || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch market symbols", isLoading: false });
    }
  },
}));
