"use client";

import OrderForm from "@/components/trade/OrderForm";
import { useMockWalletStore } from "@/stores/useMockWalletStore";

export default function MockOrderForm() {
  const isParticipated = useMockWalletStore((state) => state.isParticipated);
  const isLoadingPortfolio = useMockWalletStore(
    (state) => state.isLoadingPortfolio
  );
  const usdtBalance = useMockWalletStore((state) => state.usdtBalance);
  const holdings = useMockWalletStore((state) => state.holdings);
  const executeMarketOrder = useMockWalletStore(
    (state) => state.executeMarketOrder
  );
  const executeLimitOrder = useMockWalletStore(
    (state) => state.executeLimitOrder
  );

  return (
    <OrderForm
      mode="mock"
      isParticipated={isParticipated}
      isLoadingPortfolio={isLoadingPortfolio}
      usdtBalance={usdtBalance}
      holdings={holdings}
      onSubmitMarketOrder={executeMarketOrder}
      onSubmitLimitOrder={executeLimitOrder}
    />
  );
}
