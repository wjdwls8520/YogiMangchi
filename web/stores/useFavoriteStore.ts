import { create } from "zustand";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api/favorite";

interface FavoriteState {
  favorites: string[];
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (symbol: string) => Promise<void>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  isLoading: false,

  fetchFavorites: async () => {
    set({ isLoading: true });
    try {
      const data = await getFavorites();
      set({ favorites: data });
    } catch (error) {
      console.error("Failed to fetch favorites", error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (symbol: string) => {
    const { favorites } = get();
    const isFavorite = favorites.includes(symbol);

    // Optimistic Update
    set({
      favorites: isFavorite
        ? favorites.filter((s) => s !== symbol)
        : [...favorites, symbol],
    });

    try {
      if (isFavorite) {
        await removeFavorite(symbol);
      } else {
        await addFavorite(symbol);
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      // Rollback
      set({
        favorites: isFavorite
          ? [...get().favorites, symbol]
          : get().favorites.filter((s) => s !== symbol),
      });
    }
  },
}));
