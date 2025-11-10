import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { familyConfig, getMemberById } from "@/lib/family-config";
import { GameState, DrawResult } from "@/types";
import { setGameState } from "@/lib/server-state";
import { updateGameStateAfterDraw, isValidDraw } from "@/lib/game-logic";

// Mark route as dynamic to ensure cookies are read at request time
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Verify admin session
    await requireAdmin();

    const { gameState, selectedGifteeId }: { gameState: GameState; selectedGifteeId: string } = 
      await request.json();

    // Verify we're in waiting phase (before selection starts)
    if (gameState.selectionPhase !== 'waiting') {
      return NextResponse.json(
        { error: "Can only set next result when waiting for turn to start" },
        { status: 400 }
      );
    }

    // Verify game is not complete
    if (gameState.isComplete) {
      return NextResponse.json(
        { error: "Game is already complete" },
        { status: 400 }
      );
    }

    // Get current drawer
    const currentDrawerId = familyConfig.drawOrder[gameState.currentDrawerIndex];
    if (!currentDrawerId) {
      return NextResponse.json(
        { error: "No current drawer found" },
        { status: 400 }
      );
    }

    // Verify the selected giftee is available
    if (!gameState.availableGiftees.includes(selectedGifteeId)) {
      return NextResponse.json(
        { error: "Selected person has already been drawn" },
        { status: 400 }
      );
    }

    // Verify it's a valid draw (not self, not same clic)
    if (!isValidDraw(currentDrawerId, selectedGifteeId)) {
      return NextResponse.json(
        { error: "Invalid selection: Cannot draw yourself or someone in your own clic" },
        { status: 400 }
      );
    }

    const giftee = getMemberById(selectedGifteeId);
    if (!giftee) {
      return NextResponse.json(
        { error: "Invalid giftee ID" },
        { status: 400 }
      );
    }

    // Create the draw result
    const drawResult: DrawResult = {
      drawerId: currentDrawerId,
      gifteeId: selectedGifteeId,
      gifteeName: giftee.name,
    };

    // Update game state to revealing phase first
    const revealingState: GameState = {
      ...gameState,
      selectionPhase: 'revealing',
      selectedIndex: null, // Not from a selection, so no index
    };

    // Persist the revealing state on the server
    setGameState(revealingState);

    // Broadcast revealing state
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.SELECTION_REVEALING, {
      selectedIndex: null,
      newGameState: revealingState,
      adminOverride: true,
    });

    // Update game state after draw and unlock turn
    const newGameState = updateGameStateAfterDraw(revealingState, drawResult);
    newGameState.turnLocked = false;

    // Persist the final game state on the server
    setGameState(newGameState);

    // Broadcast turn unlock
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.TURN_UNLOCKED, {
      drawerId: currentDrawerId,
      timestamp: Date.now(),
      adminOverride: true,
    });

    // Broadcast the final draw result to all connected clients
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.DRAW_EXECUTED, {
      drawResult,
      newGameState,
      adminOverride: true,
    });

    return NextResponse.json({
      success: true,
      drawResult,
      newGameState,
      message: `Admin set ${getMemberById(currentDrawerId)?.name} to draw ${giftee.name}`,
    });
  } catch (error) {
    console.error("Error setting next result:", error);
    
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to set next result" },
      { status: 500 }
    );
  }
}

