import { PUSHER_EVENTS } from "./pusher-constants";
import { GameState, PlayerSession } from "@/types";
import type { GameStore } from "./store";

/**
 * Minimal channel interface (satisfied by pusher-js channels and by the
 * in-memory fake used in tests).
 */
export interface BindableChannel {
  bind(event: string, callback: (data: any) => void): unknown;
}

export interface RealtimeConnection {
  bind(event: string, callback: (data: any) => void): unknown;
}

/**
 * Everything the usePusher hook does, minus React. Used by the hook and by the
 * concurrency test harness so both exercise identical client behaviour.
 * Returns a cleanup function.
 */
export function attachRealtime(opts: {
  channel: BindableChannel;
  connection: RealtimeConnection;
  getStore: () => GameStore;
  /** Safety-net resync interval (ms). Realtime is best-effort; this guarantees convergence. */
  pollMs?: number;
}): () => void {
  const { channel, connection, getStore, pollMs = 15_000 } = opts;

  connection.bind("state_change", (states: { previous: string; current: string }) => {
    console.log(`🔌 Pusher connection state: ${states.previous} → ${states.current}`);
    if (states.current !== "connected") getStore().setPusherReady(false);
  });

  bindGameEvents(channel, getStore);

  const timer = setInterval(() => {
    if (getStore().isGameReady && !getStore().pendingAction) void getStore().resync();
  }, pollMs);

  return () => {
    clearInterval(timer);
    getStore().setPusherReady(false);
  };
}

/**
 * Wire all realtime events on `channel` to the given store.
 * Extracted from the usePusher hook so the exact same handlers can be
 * exercised by the concurrency tests.
 */
export function bindGameEvents(channel: BindableChannel, store: () => GameStore) {
  channel.bind("pusher:subscription_succeeded", () => {
    store().setPusherReady(true);
  });

  channel.bind("pusher:subscription_error", (error: unknown) => {
    console.error("❌ Pusher subscription error:", error);
    store().setPusherReady(false);
  });

  // Every committed change is broadcast as a full, versioned snapshot.
  // setGameState ignores anything not newer than what is on screen, so late,
  // duplicated or out-of-order deliveries are harmless. A new `lastDraw`
  // in the snapshot triggers the reveal animation exactly once.
  channel.bind(PUSHER_EVENTS.GAME_STATE_UPDATE, (data: GameState) => {
    store().setGameState(data);
  });

  // Legacy event names (kept so an old tab mid-deploy still works)
  for (const event of [
    PUSHER_EVENTS.OPTIONS_PREPARED,
    PUSHER_EVENTS.SELECTION_REVEALING,
    PUSHER_EVENTS.DRAW_EXECUTED,
  ]) {
    channel.bind(event, (data: { newGameState?: GameState }) => {
      if (data?.newGameState) store().setGameState(data.newGameState);
    });
  }

  channel.bind(PUSHER_EVENTS.GAME_RESET, (data: { newGameState?: GameState }) => {
    store().resetGameLocal(data?.newGameState);
  });

  channel.bind(
    PUSHER_EVENTS.PLAYER_CONNECTED,
    (data: { playerId: string; timestamp: number }) => {
      const session: PlayerSession = {
        playerId: data.playerId,
        connectedAt: data.timestamp,
        lastSeen: data.timestamp,
        isOnline: true,
      };
      store().updatePlayerSession(data.playerId, session);
    }
  );

  channel.bind(PUSHER_EVENTS.PLAYER_DISCONNECTED, (data: { playerId: string }) => {
    store().removePlayerSession(data.playerId);
  });

  channel.bind(PUSHER_EVENTS.ADMIN_SET, (data: { adminId: string }) => {
    store().setAdmin(data.adminId);
  });
}
