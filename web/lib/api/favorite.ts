import { fetchClient } from "./client";

export const getFavorites = async (): Promise<string[]> => {
  const payload = await fetchClient("favorites/symbols", {
    method: "GET",
  });
  
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as any).data)) {
    return (payload as any).data;
  }

  return [];
};

export const addFavorite = async (symbol: string): Promise<void> => {
  await fetchClient(`favorites/symbols/${symbol}`, {
    method: "POST",
  });
};

export const removeFavorite = async (symbol: string): Promise<void> => {
  await fetchClient(`favorites/symbols/${symbol}`, {
    method: "DELETE",
  });
};
