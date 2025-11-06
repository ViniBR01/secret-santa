import { GameState, DrawResult } from "@/types";
import { familyConfig, getMemberById, getMembersInSameClic } from "./family-config";

/**
 * Check if a draw is valid based on game rules:
 * 1. Cannot draw yourself
 * 2. Cannot draw someone in your own clic
 */
export function isValidDraw(drawerId: string, gifteeId: string): boolean {
  // Cannot draw yourself
  if (drawerId === gifteeId) {
    return false;
  }

  // Cannot draw someone in your own clic
  const sameclicMembers = getMembersInSameClic(drawerId);
  if (sameclicMembers.includes(gifteeId)) {
    return false;
  }

  return true;
}

/**
 * Get all valid giftees for a specific drawer
 */
export function getValidGiftees(
  drawerId: string,
  availableGiftees: string[]
): string[] {
  return availableGiftees.filter((gifteeId) =>
    isValidDraw(drawerId, gifteeId)
  );
}

/**
 * Initialize a new game state
 */
export function initializeGame(): GameState {
  return {
    currentDrawerIndex: 0,
    assignments: {},
    availableGiftees: familyConfig.members.map((m) => m.id),
    isComplete: false,
  };
}

/**
 * Execute a draw for the current drawer
 * Returns the draw result or null if no valid options exist
 */
export function executeDraw(gameState: GameState): DrawResult | null {
  const { currentDrawerIndex, availableGiftees, assignments } = gameState;
  
  // Get current drawer
  const drawerId = familyConfig.drawOrder[currentDrawerIndex];
  if (!drawerId) {
    return null;
  }

  // Get valid options for this drawer
  const validOptions = getValidGiftees(drawerId, availableGiftees);
  
  if (validOptions.length === 0) {
    return null; // No valid options - game needs to restart
  }

  // Randomly select from valid options
  const randomIndex = Math.floor(Math.random() * validOptions.length);
  const gifteeId = validOptions[randomIndex];
  const giftee = getMemberById(gifteeId);

  if (!giftee) {
    return null;
  }

  return {
    drawerId,
    gifteeId,
    gifteeName: giftee.name,
  };
}

/**
 * Update game state after a successful draw
 */
export function updateGameStateAfterDraw(
  gameState: GameState,
  drawResult: DrawResult
): GameState {
  const newAssignments = {
    ...gameState.assignments,
    [drawResult.drawerId]: drawResult.gifteeId,
  };

  const newAvailableGiftees = gameState.availableGiftees.filter(
    (id) => id !== drawResult.gifteeId
  );

  const newDrawerIndex = gameState.currentDrawerIndex + 1;
  const isComplete = newDrawerIndex >= familyConfig.drawOrder.length;

  return {
    currentDrawerIndex: newDrawerIndex,
    assignments: newAssignments,
    availableGiftees: newAvailableGiftees,
    isComplete,
  };
}

/**
 * Check if the game can be completed from current state
 * This uses a simple greedy check - not perfect but good enough for prototype
 */
export function canGameBeCompleted(gameState: GameState): boolean {
  const { currentDrawerIndex, availableGiftees } = gameState;
  
  // If game is already complete, return true
  if (currentDrawerIndex >= familyConfig.drawOrder.length) {
    return true;
  }

  // Check if current drawer has at least one valid option
  const currentDrawerId = familyConfig.drawOrder[currentDrawerIndex];
  const validOptions = getValidGiftees(currentDrawerId, availableGiftees);
  
  return validOptions.length > 0;
}

/**
 * Get the current drawer's information
 */
export function getCurrentDrawer(gameState: GameState) {
  const drawerId = familyConfig.drawOrder[gameState.currentDrawerIndex];
  return getMemberById(drawerId);
}

/**
 * Get player states for UI display
 */
export function getPlayerStates(gameState: GameState) {
  return familyConfig.drawOrder.map((memberId, index) => {
    const member = getMemberById(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    let status: 'waiting' | 'drawing' | 'completed';
    if (index < gameState.currentDrawerIndex) {
      status = 'completed';
    } else if (index === gameState.currentDrawerIndex) {
      status = 'drawing';
    } else {
      status = 'waiting';
    }

    return {
      member,
      status,
      order: index + 1,
    };
  });
}

