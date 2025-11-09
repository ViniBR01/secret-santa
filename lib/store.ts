import { create } from "zustand";
import { GameState, DrawResult, PlayerSession } from "@/types";
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
  isGameReady: boolean; // Flag to track if game has been initialized
  isPusherReady: boolean; // Flag to track if Pusher is connected and subscribed
  
  // Actions
  initGame: () => Promise<void>;
  performDraw: () => void; // Legacy: for backward compatibility
  prepareOptions: () => Promise<void>; // New: prepare options for selection
  makeSelection: (choiceIndex: number) => Promise<void>; // New: finalize selection
  quickDrawAll: () => Promise<void>;
  setGameState: (state: GameState) => void;
  setLastDrawResult: (result: DrawResult | null) => void;
  resetGame: () => void;
  setPusherReady: (ready: boolean) => void;
  
  // Session management actions
  updatePlayerSession: (playerId: string, session: PlayerSession) => void;
  removePlayerSession: (playerId: string) => void;
  setAdmin: (adminId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  ...initializeGame(),
  lastDrawResult: null,
  error: null,
  isGameReady: false,
  isPusherReady: false,

  // Initialize/reset game
  initGame: async () => {
    try {
      console.log("🔄 Fetching game state from server...");
      
      // Try to fetch the current game state from the server
      const response = await fetch("/api/state");
      
      if (response.ok) {
        const data = await response.json();
        
        // If a game state exists on the server, use it
        if (data.exists && data.gameState) {
          console.log("✅ Syncing with existing game state from server");
          set({
            ...data.gameState,
            lastDrawResult: null,
            error: null,
            isGameReady: true,
          });
          return;
        }
      }
      
      // If no game state exists, initialize a new game
      // But first, check one more time to avoid race condition with other clients
      console.log("⚠️ No game state found, checking again before initializing...");
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
      
      const recheckResponse = await fetch("/api/state");
      if (recheckResponse.ok) {
        const recheckData = await recheckResponse.json();
        if (recheckData.exists && recheckData.gameState) {
          console.log("✅ Game state now exists (created by another client), syncing...");
          set({
            ...recheckData.gameState,
            lastDrawResult: null,
            error: null,
            isGameReady: true,
          });
          return;
        }
      }
      
      // Still no game state, safe to initialize
      console.log("🆕 Initializing new game state");
      const initialState = initializeGame();
      set({
        ...initialState,
        lastDrawResult: null,
        error: null,
        isGameReady: true,
      });
      
      // Persist the initial state to the server
      const persistResponse = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameState: initialState }),
      });
      
      if (persistResponse.ok) {
        console.log("✅ Initial game state persisted to server");
      } else {
        console.error("⚠️ Failed to persist initial state to server");
      }
    } catch (error) {
      console.error("❌ Error initializing game:", error);
      // Fall back to local initialization
      const initialState = initializeGame();
      set({
        ...initialState,
        lastDrawResult: null,
        error: null,
        isGameReady: true,
      });
    }
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
    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const usePusher = pusherKey && pusherKey !== "your_pusher_key_here";

      if (usePusher) {
        // Check if Pusher is ready before proceeding
        const isPusherReady = get().isPusherReady;
        if (!isPusherReady) {
          console.warn("⚠️ Pusher not ready, waiting for connection...");
          set({ error: "Connecting to game server, please wait..." });
          return;
        }

        // IMPORTANT: Fetch fresh state from server before performing action
        // This prevents race conditions where local state is stale
        console.log("🔄 Fetching fresh state before preparing options...");
        
        let currentState;
        try {
          const stateResponse = await fetch("/api/state");
          
          if (!stateResponse.ok) {
            console.error("❌ HTTP error fetching state:", stateResponse.status);
            throw new Error("State fetch failed");
          }
          
          const stateData = await stateResponse.json();
          console.log("📦 State data received:", stateData);
          
          // Check if server returned an error object
          if (stateData.error) {
            console.error("❌ Server returned error:", stateData.error);
            throw new Error(stateData.error);
          }
          
          // Validate response structure
          if (stateData.exists === undefined) {
            console.error("❌ Invalid response structure:", stateData);
            throw new Error("Invalid state response");
          }
          
          // Use server state if available, otherwise fall back to local
          if (stateData.exists && stateData.gameState) {
            console.log("✅ Using fresh state from server");
            currentState = stateData.gameState;
          } else {
            console.warn("⚠️ No game state on server, using local state");
            currentState = get();
          }
        } catch (fetchError) {
          console.error("❌ Error fetching state:", fetchError);
          console.log("⚠️ Falling back to local state");
          currentState = get();
        }
        
        // Validate state before proceeding
        if (currentState.isComplete) {
          set({ error: "Game is already complete!" });
          return;
        }
        
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
        const currentState = get();
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
    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const usePusher = pusherKey && pusherKey !== "your_pusher_key_here";

      if (usePusher) {
        // Check if Pusher is ready before proceeding
        const isPusherReady = get().isPusherReady;
        if (!isPusherReady) {
          console.warn("⚠️ Pusher not ready, waiting for connection...");
          set({ error: "Connecting to game server, please wait..." });
          return;
        }

        // IMPORTANT: Fetch fresh state from server before performing action
        console.log("🔄 Fetching fresh state before making selection...");
        
        let currentState;
        try {
          const stateResponse = await fetch("/api/state");
          
          if (!stateResponse.ok) {
            console.error("❌ HTTP error fetching state:", stateResponse.status);
            throw new Error("State fetch failed");
          }
          
          const stateData = await stateResponse.json();
          console.log("📦 State data received:", stateData);
          
          // Check if server returned an error object
          if (stateData.error) {
            console.error("❌ Server returned error:", stateData.error);
            throw new Error(stateData.error);
          }
          
          // Validate response structure
          if (stateData.exists === undefined) {
            console.error("❌ Invalid response structure:", stateData);
            throw new Error("Invalid state response");
          }
          
          // Use server state if available, otherwise fall back to local
          if (stateData.exists && stateData.gameState) {
            console.log("✅ Using fresh state from server");
            currentState = stateData.gameState;
          } else {
            console.warn("⚠️ No game state on server, using local state");
            currentState = get();
          }
        } catch (fetchError) {
          console.error("❌ Error fetching state:", fetchError);
          console.log("⚠️ Falling back to local state");
          currentState = get();
        }
        
        // Validate state before proceeding
        if (currentState.selectionPhase !== 'selecting') {
          set({ error: "Not in selection phase!" });
          return;
        }

        // Update to revealing phase immediately for better UX
        set({ selectionPhase: 'revealing', selectedIndex: choiceIndex });

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
        const currentState = get();
        
        if (currentState.selectionPhase !== 'selecting') {
          set({ error: "Not in selection phase!" });
          return;
        }

        // Update to revealing phase immediately for better UX
        set({ selectionPhase: 'revealing', selectedIndex: choiceIndex });
        
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
    console.log("📥 Setting game state:", { 
      selectionPhase: state.selectionPhase,
      currentDrawerIndex: state.currentDrawerIndex,
      hasOptions: state.currentOptions?.length > 0
    });
    // Preserve isGameReady flag when updating state
    set({
      ...state,
      isGameReady: true,
    });
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
        isGameReady: true,
      });
    } catch (error) {
      console.error("Error resetting game:", error);
      // Reset locally even if API call fails
      const initialState = initializeGame();
      set({
        ...initialState,
        lastDrawResult: null,
        error: null,
        isGameReady: true,
      });
    }
  },

  // Update player session (when player connects)
  updatePlayerSession: (playerId: string, session: PlayerSession) => {
    set((state) => ({
      activePlayerSessions: {
        ...state.activePlayerSessions,
        [playerId]: session,
      },
    }));
  },

  // Remove player session (when player disconnects)
  removePlayerSession: (playerId: string) => {
    set((state) => {
      const newSessions = { ...state.activePlayerSessions };
      delete newSessions[playerId];
      return { activePlayerSessions: newSessions };
    });
  },

  // Set admin ID
  setAdmin: (adminId: string) => {
    set({ adminId });
  },

  // Set Pusher ready status
  setPusherReady: (ready: boolean) => {
    console.log(`🔌 Pusher ready status: ${ready}`);
    set({ isPusherReady: ready });
  },
}));

