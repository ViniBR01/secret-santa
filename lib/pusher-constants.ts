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
