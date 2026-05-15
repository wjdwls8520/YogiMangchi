import { fetchClient } from "./client";
import type { HoldingResponse } from "./asset";

export type AssetType = "MOCK" | "TRADE_SPOT" | "TRADE_FUTURE" | "CONTEST";

export interface ProfilePortfolioResponse {
  assetType: AssetType;
  holdingCount: number;
  seedMoney: number;
  cashBalance: number;
  totalBuyAmount: number;
  totalCoinValue: number;
  totalAsset: number;
  totalProfit: number;
  totalRoi: number;
  updatedAt: string;
  holdings: HoldingResponse[];
}

// 내 포트폴리오 조회 (타입별)
export const getMyProfilePortfolio = async (assetType: AssetType) => {
  return fetchClient<ProfilePortfolioResponse>(`portfolio/me?assetType=${assetType}`, {
    method: "GET",
  });
};

// 다른 회원 포트폴리오 조회 (타입별)
export const getMemberPortfolio = async (memberId: number, assetType: AssetType) => {
  return fetchClient<ProfilePortfolioResponse>(`portfolio/${memberId}?assetType=${assetType}`, {
    method: "GET",
  });
};
