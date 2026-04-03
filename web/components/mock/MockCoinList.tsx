"use client";

import CoinList from "@/components/trade/CoinList";
import { useMockWalletStore } from "@/stores/useMockWalletStore";

export default function MockCoinList() {
  const holdings = useMockWalletStore((state) => state.holdings);
  const isParticipated = useMockWalletStore((state) => state.isParticipated);

  return (
    <CoinList
      mode="mock"
      availableMarketTypes={["spot"]}
      holdingSymbols={holdings.map((item) => item.symbol)}
      isParticipated={isParticipated}
    />
  );
}
