"use client";

import FuturesOrderList from "./FuturesOrderList";

type OrderHistoryTabProps = {
  contestSeasonId?: number | null;
  activityVersion: number;
};

export default function OrderHistoryTab({
  contestSeasonId = null,
  activityVersion,
  mode,
}: OrderHistoryTabProps & { mode?: "light" | "dark" }) {
  return (
    <FuturesOrderList
      contestSeasonId={contestSeasonId}
      activityVersion={activityVersion}
      mode="orders"
      themeMode={mode}
    />
  );
}
