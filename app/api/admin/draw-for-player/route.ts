import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { finalizeSelection, updateGameStateAfterDraw } from "@/lib/game-logic";
import { familyConfig, getMemberById } from "@/lib/family-config";
import { GameState } from "@/types";
import { setGameState } from "@/lib/server-state";

export async function POST(request: Request) {
  try {
    // Verify admin session
    await requireAdmin();

    const { gameState, choiceIndex }: { gameState: GameState; choiceIndex: number } = 
      await request.json();

    // Verify we're in selecting phase
    if (gameState.selectionPhase !== 'selecting') {
      return NextResponse.json(
        { error: "Not in selection phase" },
        { status: 400 }
      );
    }

    // Verify choice index is valid
    if (choiceIndex < 0 || choiceIndex >= gameState.currentOptions.length) {
      return NextResponse.json(
        { error: "Invalid choice index" },
        { status: 400 }
      );
    }

    // Finalize the selection
    const drawResult = finalizeSelection(gameState, choiceIndex);

    if (!drawResult) {
      return NextResponse.json(
        { error: "Invalid selection" },
        { status: 400 }
      );
    }

    const currentDrawerId = familyConfig.drawOrder[gameState.currentDrawerIndex];

    // Update game state to revealing phase first
    const revealingState: GameState = {
      ...gameState,
      selectionPhase: 'revealing',
      selectedIndex: choiceIndex,
    };

    // Persist the revealing state on the server
    setGameState(revealingState);

    // Broadcast revealing state
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.SELECTION_REVEALING, {
      selectedIndex: choiceIndex,
      newGameState: revealingState,
      adminOverride: true,
    });

    // Update game state after draw and unlock turn
    const newGameState = updateGameStateAfterDraw(gameState, drawResult);
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
      message: `Admin drew for ${getMemberById(currentDrawerId)?.name}`,
    });
  } catch (error) {
    console.error("Error drawing for player:", error);
    
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to draw for player" },
      { status: 500 }
    );
  }
}

