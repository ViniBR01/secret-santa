import { GameState, DrawResult, DrawOptions } from "@/types";
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
    selectionPhase: 'waiting',
    currentOptions: [],
    selectedIndex: null,
  };
}

/**
 * Backtracking algorithm to check if a complete solution exists
 * from the current state with a specific assignment
 */
function canCompleteDraw(
  drawerIndex: number,
  assignments: Record<string, string>,
  availableGiftees: string[]
): boolean {
  // Base case: all drawers have been assigned
  if (drawerIndex >= familyConfig.drawOrder.length) {
    return true;
  }

  const drawerId = familyConfig.drawOrder[drawerIndex];
  const validOptions = getValidGiftees(drawerId, availableGiftees);

  // Try each valid option
  for (const gifteeId of validOptions) {
    // Make this assignment
    const newAssignments = { ...assignments, [drawerId]: gifteeId };
    const newAvailableGiftees = availableGiftees.filter(id => id !== gifteeId);

    // Recursively check if we can complete from this state
    if (canCompleteDraw(drawerIndex + 1, newAssignments, newAvailableGiftees)) {
      return true;
    }
  }

  // No valid option leads to completion
  return false;
}

/**
 * Execute a draw for the current drawer with backtracking
 * Returns the draw result, guaranteed to find a valid solution
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
    return null; // No valid options - should not happen with backtracking
  }

  // Filter options to only those that lead to a complete solution
  const viableOptions = validOptions.filter(gifteeId => {
    const newAssignments = { ...assignments, [drawerId]: gifteeId };
    const newAvailableGiftees = availableGiftees.filter(id => id !== gifteeId);
    
    // Check if this choice leads to a completable game
    return canCompleteDraw(
      currentDrawerIndex + 1,
      newAssignments,
      newAvailableGiftees
    );
  });

  // If no viable options, fall back to any valid option
  // (this shouldn't happen in practice)
  const optionsToUse = viableOptions.length > 0 ? viableOptions : validOptions;

  // Randomly select from viable options
  const randomIndex = Math.floor(Math.random() * optionsToUse.length);
  const gifteeId = optionsToUse[randomIndex];
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
    selectionPhase: isComplete ? 'complete' : 'waiting',
    currentOptions: [],
    selectedIndex: null,
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
 * Prepare draw options for the current drawer
 * Returns all viable options that lead to a completable game
 */
export function prepareDrawOptions(gameState: GameState): DrawOptions | null {
  const { currentDrawerIndex, availableGiftees, assignments } = gameState;
  
  // Get current drawer
  const drawerId = familyConfig.drawOrder[currentDrawerIndex];
  if (!drawerId) {
    return null;
  }

  // Get valid options for this drawer
  const validOptions = getValidGiftees(drawerId, availableGiftees);
  
  if (validOptions.length === 0) {
    return null;
  }

  // Filter options to only those that lead to a complete solution
  const viableOptions = validOptions.filter(gifteeId => {
    const newAssignments = { ...assignments, [drawerId]: gifteeId };
    const newAvailableGiftees = availableGiftees.filter(id => id !== gifteeId);
    
    // Check if this choice leads to a completable game
    return canCompleteDraw(
      currentDrawerIndex + 1,
      newAssignments,
      newAvailableGiftees
    );
  });

  // If no viable options, fall back to any valid option
  const optionsToUse = viableOptions.length > 0 ? viableOptions : validOptions;

  return {
    drawerId,
    viableGifteeIds: optionsToUse,
  };
}

/**
 * Finalize a player's selection
 * Takes the game state and the index of the chosen option
 */
export function finalizeSelection(
  gameState: GameState,
  choiceIndex: number
): DrawResult | null {
  const { currentOptions } = gameState;
  
  if (choiceIndex < 0 || choiceIndex >= currentOptions.length) {
    return null;
  }

  const gifteeId = currentOptions[choiceIndex];
  const giftee = getMemberById(gifteeId);
  const drawerId = familyConfig.drawOrder[gameState.currentDrawerIndex];

  if (!giftee || !drawerId) {
    return null;
  }

  return {
    drawerId,
    gifteeId,
    gifteeName: giftee.name,
  };
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

