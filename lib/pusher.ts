import Pusher from "pusher";
import PusherClient from "pusher-js";

// Debug: Log environment variable availability
console.log("🔍 Pusher Server Config Check:", {
  hasAppId: !!process.env.PUSHER_APP_ID,
  hasKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
  hasSecret: !!process.env.PUSHER_SECRET,
  hasCluster: !!process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  appId: process.env.PUSHER_APP_ID?.substring(0, 5) + "...",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY?.substring(0, 5) + "...",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance
let pusherClient: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClient) {
    pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    );
  }
  return pusherClient;
};

// Reset Pusher client (used on logout to ensure fresh connection)
export const resetPusherClient = () => {
  if (pusherClient) {
    console.log("🔌 Disconnecting Pusher client");
    pusherClient.disconnect();
    pusherClient = null;
  }
};

// Event names
export const PUSHER_EVENTS = {
  DRAW_EXECUTED: "draw-executed",
  GAME_RESET: "game-reset",
  GAME_STATE_UPDATE: "game-state-update",
  OPTIONS_PREPARED: "options-prepared",
  SELECTION_REVEALING: "selection-revealing",
  PLAYER_CONNECTED: "player-connected",
  PLAYER_DISCONNECTED: "player-disconnected",
  ADMIN_SET: "admin-set",
  TURN_LOCKED: "turn-locked",
  TURN_UNLOCKED: "turn-unlocked",
} as const;

// Channel name
export const PUSHER_CHANNEL = "secret-santa-game";

