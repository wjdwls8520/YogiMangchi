import { fetchClient } from "./client";

/**
 * 보유 종목 상세 정보
 */
export interface HoldingResponse {
  symbol: string;
  quantity: number;
  availableQuantity: number;
  lockedQuantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  buyAmount: number;
  coinTotalValue: number;
  profit: number;
  roi: number;
  holdingRatio: number;
  isPriceStale: boolean;
}

/**
 * 현물 자산 포트폴리오 상세
 */
export interface AssetPortfolioDetail {
  assetType: string;
  holdingCount: number;
  seedMoney: number;
  cashBalance: number;
  lockedMoney: number;
  totalCashAsset: number;
  totalBuyAmount: number;
  totalCoinValue: number;
  totalAsset: number;
  totalProfit: number;
  totalRoi: number;
  holdings: HoldingResponse[];
}

/**
 * 선물 포지션 상세 정보
 */
export interface FuturesPositionDetail {
  symbol: string;
  positionSide: "LONG" | "SHORT";
  leverage: number;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  margin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  roi: number;
  isPriceStale: boolean;
}

/**
 * 선물 자산 포트폴리오 상세
 */
export interface FuturesPortfolioDetail {
  cashBalance: number;
  lockedMoney: number;
  totalCashAsset: number;
  totalMargin: number;
  totalUnrealizedPnl: number;
  totalAsset: number;
  positions: FuturesPositionDetail[];
}

/**
 * 본투자 통합 자산 응답
 */
export interface RealAssetUnifiedResponse {
  totalAsset: number;
  totalProfit: number;
  spot: AssetPortfolioDetail;
  futures: FuturesPortfolioDetail;
}

/**
 * 본투자 통합 자산 조회 (현물 + 선물)
 */
export const getUnifiedRealAssetDetail = async () => {
  return fetchClient<RealAssetUnifiedResponse>("asset/real/detail", {
    method: "GET",
  });
};

/**
 * 본투자 현물 포트폴리오 단독 조회
 */
export const getMySpotPortfolio = async () => {
  return fetchClient<AssetPortfolioDetail>("asset/real/spot", {
    method: "GET",
  });
};
