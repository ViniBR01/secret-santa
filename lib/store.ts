import { create } from "zustand";
import { GameState, DrawResult } from "@/types";
import {
  initializeGame,
  executeDraw,
  updateGameStateAfterDraw,
  prepareDrawOptions,
  finalizeSelection,
} from "./game-logic";

interface GameStore extends GameState {
  lastDrawResult: DrawResult | null;
  error: string | null;
  
  // Actions
  initGame: () => void;
  performDraw: () => void; // Legacy: for backward compatibility
  prepareOptions: () => Promise<void>; // New: prepare options for selection
  makeSelection: (choiceIndex: number) => Promise<void>; // New: finalize selection
  quickDrawAll: () => Promise<void>;
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

  // Legacy method: Perform a draw (kept for backward compatibility)
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

  // New: Prepare options for current drawer
  prepareOptions: async () => {
    const currentState = get();
    
    if (currentState.isComplete) {
      set({ error: "Game is already complete!" });
      return;
    }

    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const usePusher = pusherKey && pusherKey !== "your_pusher_key_here";

      if (usePusher) {
        // Call API to get options (will broadcast via Pusher)
        const response = await fetch("/api/draw/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentState),
        });

        if (!response.ok) {
          const error = await response.json();
          set({ error: error.error || "Failed to prepare options" });
          return;
        }

        // State will be updated via Pusher event
      } else {
        // Local-only mode: prepare options directly
        const drawOptions = prepareDrawOptions(currentState);
        
        if (!drawOptions || drawOptions.viableGifteeIds.length === 0) {
          set({ error: "No valid options available. Game needs to restart." });
          return;
        }

        set({
          selectionPhase: 'selecting',
          currentOptions: drawOptions.viableGifteeIds,
          selectedIndex: null,
          error: null,
        });
      }
    } catch (error) {
      console.error("Error preparing options:", error);
      set({ error: "Failed to prepare options. Please try again." });
    }
  },

  // New: Make a selection
  makeSelection: async (choiceIndex: number) => {
    const currentState = get();
    
    if (currentState.selectionPhase !== 'selecting') {
      set({ error: "Not in selection phase!" });
      return;
    }

    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const usePusher = pusherKey && pusherKey !== "your_pusher_key_here";

      // Update to revealing phase immediately for better UX
      set({ selectionPhase: 'revealing', selectedIndex: choiceIndex });

      if (usePusher) {
        // Call API to finalize selection (will broadcast via Pusher)
        const response = await fetch("/api/draw/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameState: currentState, choiceIndex }),
        });

        if (!response.ok) {
          const error = await response.json();
          set({ error: error.error || "Failed to finalize selection", selectionPhase: 'selecting' });
          return;
        }

        // State will be updated via Pusher event
      } else {
        // Local-only mode: finalize selection directly
        const drawResult = finalizeSelection(currentState, choiceIndex);
        
        if (!drawResult) {
          set({ error: "Invalid selection. Please try again.", selectionPhase: 'selecting' });
          return;
        }

        // Update game state
        const newState = updateGameStateAfterDraw(currentState, drawResult);
        
        set({
          ...newState,
          lastDrawResult: drawResult,
          error: null,
        });
      }
    } catch (error) {
      console.error("Error making selection:", error);
      set({ error: "Failed to finalize selection. Please try again.", selectionPhase: 'selecting' });
    }
  },

  // Quick draw all remaining players
  quickDrawAll: async () => {
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

      let state: GameState = currentState;

      if (usePusher) {
        // Call API endpoint for each remaining draw
        while (!state.isComplete) {
          const response = await fetch("/api/draw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(state),
          });

          if (!response.ok) {
            const error = await response.json();
            set({ error: error.error || "Failed to execute draw" });
            return;
          }

          const result = await response.json();
          state = result.newGameState;

          // Small delay to allow Pusher events to propagate
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // Local-only mode: execute all draws directly
        while (!state.isComplete) {
          const drawResult = executeDraw(state);
          
          if (!drawResult) {
            set({ error: "No valid options available. Game needs to restart." });
            return;
          }

          // Update game state locally
          state = updateGameStateAfterDraw(state, drawResult);
          
          set({
            ...state,
            lastDrawResult: drawResult,
            error: null,
          });

          // Small delay between draws for better UX
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error("Error performing quick draw all:", error);
      set({ error: "Failed to execute quick draw. Please try again." });
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

