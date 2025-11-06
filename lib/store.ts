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
  performDraw: () => {
    const currentState = get();
    
    // Check if game is already complete
    if (currentState.isComplete) {
      set({ error: "Game is already complete!" });
      return;
    }

    // Execute the draw
    const drawResult = executeDraw(currentState);
    
    if (!drawResult) {
      set({ error: "No valid options available. Game needs to restart." });
      return;
    }

    // Update game state
    const newState = updateGameStateAfterDraw(currentState, drawResult);
    
    set({
      ...newState,
      lastDrawResult: drawResult,
      error: null,
    });
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
  resetGame: () => {
    const initialState = initializeGame();
    set({
      ...initialState,
      lastDrawResult: null,
      error: null,
    });
  },
}));

