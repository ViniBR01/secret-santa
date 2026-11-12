import { create, StateCreator } from "zustand";
import { GameState, DrawResult, PlayerSession } from "@/types";
import { initializeGame, isNewerState } from "./game-logic";

/**
 * Client-side mirror of the server's game.
 *
 * Rules that keep ~25 concurrent screens coherent:
 *  1. The server is the only source of truth. The client never uploads its
 *     copy of the game; actions only send *intent* plus the turn they were
 *     taken on (gameId + drawerIndex) so stale clicks are rejected.
 *  2. A snapshot is applied only if it is newer (createdAt, version) than the
 *     one on screen, so late / duplicated / reordered realtime events can
 *     never move a screen backwards.
 *  3. Every action applies its own HTTP response, so it works even if the
 *     realtime connection is down. Realtime is just a fast path.
 *  4. On (re)connect, tab focus, conflicts and periodically, the client
 *     resyncs from GET /api/state to recover anything it missed.
 */
export interface GameStore extends GameState {
  lastDrawResult: DrawResult | null;
  error: string | null;
  isGameReady: boolean;
  isPusherReady: boolean;
  /** An action request is in flight (used to disable buttons) */
  pendingAction: boolean;

  // Animation state
  shownDrawIds: Set<string>;
  isAnimating: boolean;

  // Actions
  initGame: () => Promise<void>;
  resync: () => Promise<void>;
  startGame: () => Promise<void>;
  prepareOptions: () => Promise<void>;
  makeSelection: (choiceIndex: number) => Promise<void>;
  quickDrawAll: () => Promise<void>;
  adminSetNextResult: (selectedGifteeId: string) => Promise<{ ok: boolean; error?: string }>;
  sendHeartbeat: () => Promise<void>;
  resetGame: () => Promise<void>;

  /** Apply a server snapshot if it is newer. Returns true if applied. */
  setGameState: (state: GameState, opts?: { animate?: boolean }) => boolean;
  setLastDrawResult: (result: DrawResult | null) => void;
  /** Handle a reset broadcast */
  resetGameLocal: (newGameState?: GameState) => void;
  setPusherReady: (ready: boolean) => void;

  markDrawAsShown: (drawId: string) => void;
  hasShownDraw: (drawId: string) => boolean;
  setIsAnimating: (animating: boolean) => void;
  clearShownDraws: () => void;

  updatePlayerSession: (playerId: string, session: PlayerSession) => void;
  removePlayerSession: (playerId: string) => void;
  setAdmin: (adminId: string) => void;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Placeholder shown before the first sync: older than any real server state. */
function placeholderState(): GameState {
  return { ...initializeGame(), gameId: "", createdAt: 0, version: -1 };
}

const GAME_FIELDS: (keyof GameState)[] = Object.keys(placeholderState()) as (keyof GameState)[];

function pickGameState(s: GameState): GameState {
  const out = {} as Record<string, unknown>;
  for (const k of GAME_FIELDS) out[k] = s[k];
  return out as unknown as GameState;
}

/**
 * Store definition, parameterised by the fetch implementation so that tests can
 * spin up many independent "browsers" (each with its own cookies and latency).
 */
export const createGameStoreState = (
  fetchImpl: FetchLike = (input, init) => fetch(input, init)
): StateCreator<GameStore> => (set, get) => {
  /** POST an action; apply the returned (or conflicting) server state. */
  async function act(
    path: string,
    body: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string; status?: number }> {
    if (get().pendingAction) return { ok: false, error: "busy" }; // ignore double clicks
    set({ pendingAction: true, error: null });
    try {
      const response = await fetchImpl(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      const serverState: GameState | undefined = data.newGameState ?? data.gameState ?? undefined;
      if (serverState) get().setGameState(serverState, { animate: true });
      if (!response.ok) {
        // Conflicts mean our screen was stale: we've just been resynced, no need to alarm the user.
        if (response.status !== 409) set({ error: data.error || "Something went wrong" });
        if (!serverState) await get().resync();
        return { ok: false, error: data.error, status: response.status };
      }
      return { ok: true };
    } catch (error) {
      // Network error / timeout: the action MAY have been committed. Resync to find out.
      console.error(`Error calling ${path}:`, error);
      await get().resync();
      return { ok: false, error: "network" };
    } finally {
      set({ pendingAction: false });
    }
  }

  /** The turn the user is looking at. Sent with every action. */
  const turnRef = () => ({ gameId: get().gameId, drawerIndex: get().currentDrawerIndex });

  return {
    ...placeholderState(),
    lastDrawResult: null,
    error: null,
    isGameReady: false,
    isPusherReady: false,
    pendingAction: false,
    shownDrawIds: new Set<string>(),
    isAnimating: false,

    initGame: async () => {
      // Don't replay the reveal of a draw that happened before we opened the page.
      await get().resync();
      const last = get().lastDraw;
      if (last) get().markDrawAsShown(last.drawId);
    },

    resync: async () => {
      // A few attempts with backoff; the server creates the game if needed.
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const response = await fetchImpl("/api/state", { cache: "no-store" });
          if (response.ok) {
            const data = await response.json();
            if (data.gameState) {
              get().setGameState(data.gameState, { animate: get().isGameReady });
              set({ isGameReady: true });
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching game state:", error);
        }
        await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
      }
      set({ error: "No se pudo conectar con el servidor. Reintentando…" });
    },

    startGame: async () => {
      const res = await act("/api/admin/start-game", {});
      if (!res.ok && res.error && res.error !== "busy") set({ error: res.error });
    },

    prepareOptions: async () => {
      const s = get();
      if (s.isComplete || s.selectionPhase !== "waiting") return;
      await act("/api/draw/options", turnRef());
    },

    makeSelection: async (choiceIndex: number) => {
      if (get().selectionPhase !== "selecting") return;
      await act("/api/draw/select", { ...turnRef(), choiceIndex });
    },

    quickDrawAll: async () => {
      // One atomic request: the server draws everyone left, or nothing.
      // Safe to retry after a timeout (it's a no-op once the game is complete).
      const body = { gameId: get().gameId };
      let res = await act("/api/admin/draw-all", body);
      if (!res.ok && res.error === "network" && !get().isComplete) {
        res = await act("/api/admin/draw-all", body);
      }
      if (!res.ok && res.error && res.error !== "busy" && res.error !== "network") {
        set({ error: res.error });
      }
    },

    adminSetNextResult: async (selectedGifteeId: string) => {
      return act("/api/admin/set-next-result", { ...turnRef(), selectedGifteeId });
    },

    sendHeartbeat: async () => {
      try {
        await fetchImpl("/api/session/heartbeat", { method: "POST" });
      } catch (error) {
        console.error("Error sending heartbeat:", error);
      }
    },

    resetGame: async () => {
      try {
        const response = await fetchImpl("/api/state", { method: "DELETE" });
        const data = await response.json().catch(() => ({}));
        if (data.gameState) get().resetGameLocal(data.gameState);
      } catch (error) {
        console.error("Error resetting game:", error);
        await get().resync();
      }
    },

    setGameState: (state: GameState, opts = {}) => {
      const current = get();
      if (!state || typeof state.version !== "number") return false;
      if (!isNewerState(state, current)) {
        // Same or older snapshot: only presence may be fresher.
        if (state.gameId === current.gameId && state.version === current.version) {
          set({ activePlayerSessions: mergeSessions(current.activePlayerSessions, state.activePlayerSessions) });
        }
        return false;
      }
      const sameGame = state.gameId === current.gameId;
      const newDraw =
        opts.animate !== false &&
        !state.lastDrawBulk && // finishing the whole draw at once: go straight to results
        state.lastDraw &&
        state.lastDraw.drawId !== current.lastDraw?.drawId &&
        !current.shownDrawIds.has(state.lastDraw.drawId);
      set({
        ...pickGameState(state),
        activePlayerSessions: sameGame
          ? mergeSessions(current.activePlayerSessions, state.activePlayerSessions)
          : { ...state.activePlayerSessions },
        isGameReady: true,
        error: null,
        ...(newDraw ? { lastDrawResult: state.lastDraw } : {}),
        ...(sameGame ? {} : { shownDrawIds: new Set<string>(), isAnimating: false, lastDrawResult: null }),
      });
      return true;
    },

    setLastDrawResult: (result) => set({ lastDrawResult: result }),

    resetGameLocal: (newGameState?: GameState) => {
      if (newGameState) {
        get().setGameState(newGameState, { animate: false });
      } else {
        // Legacy broadcast without a payload: fetch the new game.
        void get().resync();
      }
    },

    updatePlayerSession: (playerId, session) => {
      set((s) => ({ activePlayerSessions: { ...s.activePlayerSessions, [playerId]: session } }));
    },

    removePlayerSession: (playerId) => {
      set((s) => {
        const sessions = { ...s.activePlayerSessions };
        if (sessions[playerId]) sessions[playerId] = { ...sessions[playerId], isOnline: false };
        return { activePlayerSessions: sessions };
      });
    },

    setAdmin: (adminId) => set({ adminId }),

    setPusherReady: (ready) => {
      set({ isPusherReady: ready });
      // (Re)subscribed: Pusher does not replay events missed while offline, so catch up.
      if (ready && get().isGameReady) void get().resync();
    },

    markDrawAsShown: (drawId) => {
      set((s) => ({ shownDrawIds: new Set(s.shownDrawIds).add(drawId) }));
    },
    hasShownDraw: (drawId) => get().shownDrawIds.has(drawId),
    setIsAnimating: (animating) => set({ isAnimating: animating }),
    clearShownDraws: () => set({ shownDrawIds: new Set<string>(), isAnimating: false }),
  };
};

function mergeSessions(
  local: Record<string, PlayerSession>,
  incoming: Record<string, PlayerSession>
): Record<string, PlayerSession> {
  const merged = { ...local };
  for (const [id, s] of Object.entries(incoming ?? {})) {
    if (!merged[id] || s.lastSeen >= merged[id].lastSeen) merged[id] = s;
  }
  return merged;
}

export const useGameStore = create<GameStore>()(createGameStoreState());
