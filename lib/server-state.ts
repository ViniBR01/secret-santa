/**
 * Server-side game state management
 * This provides a simple in-memory store for the game state
 * so that new players joining can sync to the current state
 */

import { GameState } from "@/types";
import { initializeGame } from "./game-logic";

// Use globalThis to persist state across hot reloads in development
// This prevents the state from being reset when Next.js compiles routes on-demand
declare global {
  var gameState: GameState | null | undefined;
}

// In-memory game state (in production, you'd use a database or Redis)
// Use globalThis to survive module reloads during development
if (globalThis.gameState === undefined) {
  globalThis.gameState = null;
}

/**
 * Get the current game state
 * Returns null if no game has been started
 */
export function getGameState(): GameState | null {
  return globalThis.gameState ?? null;
}

/**
 * Set/update the game state
 */
export function setGameState(state: GameState): void {
  globalThis.gameState = state;
}

/**
 * Reset the game state to initial values
 */
export function resetGameState(): GameState {
  globalThis.gameState = initializeGame();
  return globalThis.gameState;
}

/**
 * Initialize game state if it doesn't exist
 */
export function ensureGameState(): GameState {
  if (!globalThis.gameState) {
    globalThis.gameState = initializeGame();
  }
  return globalThis.gameState;
}

