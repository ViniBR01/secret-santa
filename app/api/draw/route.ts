import { NextRequest, NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { executeDraw, updateGameStateAfterDraw } from "@/lib/game-logic";
import { GameState } from "@/types";
import { setGameState } from "@/lib/server-state";

export async function POST(request: NextRequest) {
  try {
    const gameState: GameState = await request.json();

    // Execute the draw
    const drawResult = executeDraw(gameState);

    if (!drawResult) {
      return NextResponse.json(
        { error: "No valid options available" },
        { status: 400 }
      );
    }

    // Update game state
    const newGameState = updateGameStateAfterDraw(gameState, drawResult);

    // Persist the new game state on the server
    setGameState(newGameState);

    // Broadcast the draw result to all connected clients
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
    console.error("Error executing draw:", error);
    return NextResponse.json(
      { error: "Failed to execute draw" },
      { status: 500 }
    );
  }
}

