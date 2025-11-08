import { NextRequest, NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { finalizeSelection, updateGameStateAfterDraw } from "@/lib/game-logic";
import { familyConfig } from "@/lib/family-config";
import { GameState } from "@/types";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { gameState, choiceIndex }: { gameState: GameState; choiceIndex: number } = await request.json();

    // Validate session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    // Get current drawer
    const currentDrawerId = familyConfig.drawOrder[gameState.currentDrawerIndex];
    
    // Check if requester is authorized (admin or current drawer)
    if (session.role !== "admin" && session.playerId !== currentDrawerId) {
      return NextResponse.json(
        { error: "Forbidden: Not your turn" },
        { status: 403 }
      );
    }

    // Verify we're in the selecting phase
    if (gameState.selectionPhase !== 'selecting') {
      return NextResponse.json(
        { error: "Not in selection phase" },
        { status: 400 }
      );
    }

    // Check if turn is locked (should be locked during selection)
    if (!gameState.turnLocked) {
      return NextResponse.json(
        { error: "Turn not properly locked" },
        { status: 409 }
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

    // Update game state to revealing phase first
    const revealingState: GameState = {
      ...gameState,
      selectionPhase: 'revealing',
      selectedIndex: choiceIndex,
    };

    // Broadcast revealing state
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.SELECTION_REVEALING, {
      selectedIndex: choiceIndex,
      newGameState: revealingState,
    });

    // Update game state after draw and unlock turn
    const newGameState = updateGameStateAfterDraw(gameState, drawResult);
    newGameState.turnLocked = false;

    // Broadcast turn unlock
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.TURN_UNLOCKED, {
      drawerId: currentDrawerId,
      timestamp: Date.now(),
    });

    // Broadcast the final draw result to all connected clients
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.DRAW_EXECUTED, {
      drawResult,
      newGameState,
    });

    return NextResponse.json({
      success: true,
      drawResult,
      newGameState,
    });
  } catch (error) {
    console.error("Error finalizing selection:", error);
    return NextResponse.json(
      { error: "Failed to finalize selection" },
      { status: 500 }
    );
  }
}

