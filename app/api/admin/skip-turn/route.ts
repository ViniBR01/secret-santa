import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { familyConfig } from "@/lib/family-config";
import { GameState } from "@/types";

export async function POST(request: Request) {
  try {
    // Verify admin session
    await requireAdmin();

    const { gameState }: { gameState: GameState } = await request.json();

    // Verify game is not complete
    if (gameState.isComplete) {
      return NextResponse.json(
        { error: "Game is already complete" },
        { status: 400 }
      );
    }

    // Advance to next drawer
    const newDrawerIndex = gameState.currentDrawerIndex + 1;
    const isNowComplete = newDrawerIndex >= familyConfig.drawOrder.length;

    const updatedState: GameState = {
      ...gameState,
      currentDrawerIndex: newDrawerIndex,
      selectionPhase: isNowComplete ? 'complete' : 'waiting',
      currentOptions: [],
      selectedIndex: null,
      turnLocked: false,
      isComplete: isNowComplete,
    };

    // Broadcast state update
    await pusherServer.trigger(
      PUSHER_CHANNEL,
      PUSHER_EVENTS.GAME_STATE_UPDATE,
      updatedState
    );

    // Also unlock turn if it was locked
    if (gameState.turnLocked) {
      await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.TURN_UNLOCKED, {
        drawerId: familyConfig.drawOrder[gameState.currentDrawerIndex],
        timestamp: Date.now(),
        skipped: true,
      });
    }

    return NextResponse.json({
      success: true,
      newGameState: updatedState,
      message: `Skipped to ${isNowComplete ? "game complete" : "next player"}`,
    });
  } catch (error) {
    console.error("Error skipping turn:", error);
    
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to skip turn" },
      { status: 500 }
    );
  }
}

