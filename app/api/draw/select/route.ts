import { NextRequest, NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { finalizeSelection, updateGameStateAfterDraw } from "@/lib/game-logic";
import { GameState } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { gameState, choiceIndex }: { gameState: GameState; choiceIndex: number } = await request.json();

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

    // Update game state after draw
    const newGameState = updateGameStateAfterDraw(gameState, drawResult);

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

