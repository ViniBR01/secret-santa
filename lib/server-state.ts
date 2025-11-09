/**
 * Server-side game state management
 * This provides a simple in-memory store for the game state
 * so that new players joining can sync to the current state
 */

import { GameState } from "@/types";
import { initializeGame } from "./game-logic";

// In-memory game state (in production, you'd use a database or Redis)
let currentGameState: GameState | null = null;

/**
 * Get the current game state
 * Returns null if no game has been started
 */
export function getGameState(): GameState | null {
  return currentGameState;
}

/**
 * Set/update the game state
 */
export function setGameState(state: GameState): void {
  currentGameState = state;
}

/**
 * Reset the game state to initial values
 */
export function resetGameState(): GameState {
  currentGameState = initializeGame();
  return currentGameState;
}

/**
 * Initialize game state if it doesn't exist
 */
export function ensureGameState(): GameState {
  if (!currentGameState) {
    currentGameState = initializeGame();
  }
  return currentGameState;
}

