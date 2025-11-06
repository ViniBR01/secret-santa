import { create } from "zustand";
import { GameState, DrawResult } from "@/types";
import {
  initializeGame,
  executeDraw,
  updateGameStateAfterDraw,
} from "./game-logic";

interface GameStore extends GameState {
  lastDrawResult: DrawResult | null;
  error: string | null;
  
  // Actions
  initGame: () => void;
  performDraw: () => void;
  setGameState: (state: GameState) => void;
  setLastDrawResult: (result: DrawResult | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  ...initializeGame(),
  lastDrawResult: null,
  error: null,

  // Initialize/reset game
  initGame: () => {
    const initialState = initializeGame();
    set({
      ...initialState,
      lastDrawResult: null,
      error: null,
    });
  },

  // Perform a draw
  performDraw: async () => {
    const currentState = get();
    
    // Check if game is already complete
    if (currentState.isComplete) {
      set({ error: "Game is already complete!" });
      return;
    }

    try {
      // Check if Pusher is configured
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const usePusher = pusherKey && pusherKey !== "your_pusher_key_here";

      if (usePusher) {
        // Call API endpoint which will broadcast via Pusher
        const response = await fetch("/api/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentState),
        });

        if (!response.ok) {
          const error = await response.json();
          set({ error: error.error || "Failed to execute draw" });
          return;
        }

        // State will be updated via Pusher event
      } else {
        // Local-only mode: execute draw directly
        const drawResult = executeDraw(currentState);
        
        if (!drawResult) {
          set({ error: "No valid options available. Game needs to restart." });
          return;
        }

        // Update game state locally
        const newState = updateGameStateAfterDraw(currentState, drawResult);
        
        set({
          ...newState,
          lastDrawResult: drawResult,
          error: null,
        });
      }
    } catch (error) {
      console.error("Error performing draw:", error);
      set({ error: "Failed to execute draw. Please try again." });
    }
  },

  // Set game state (for syncing from server/pusher)
  setGameState: (state: GameState) => {
    set(state);
  },

  // Set last draw result
  setLastDrawResult: (result: DrawResult | null) => {
    set({ lastDrawResult: result });
  },

  // Reset game
  resetGame: async () => {
    try {
      // Check if Pusher is configured
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const usePusher = pusherKey && pusherKey !== "your_pusher_key_here";

      if (usePusher) {
        // Call API endpoint to broadcast reset
        await fetch("/api/state", {
          method: "DELETE",
        });
      }

      // Reset state locally
      const initialState = initializeGame();
      set({
        ...initialState,
        lastDrawResult: null,
        error: null,
      });
    } catch (error) {
      console.error("Error resetting game:", error);
      // Reset locally even if API call fails
      const initialState = initializeGame();
      set({
        ...initialState,
        lastDrawResult: null,
        error: null,
      });
    }
  },
}));

