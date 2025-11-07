import { NextRequest, NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { prepareDrawOptions } from "@/lib/game-logic";
import { GameState } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const gameState: GameState = await request.json();

    // Prepare draw options
    const drawOptions = prepareDrawOptions(gameState);

    if (!drawOptions || drawOptions.viableGifteeIds.length === 0) {
      return NextResponse.json(
        { error: "No valid options available" },
        { status: 400 }
      );
    }

    // Update game state to selecting phase
    const updatedState: GameState = {
      ...gameState,
      selectionPhase: 'selecting',
      currentOptions: drawOptions.viableGifteeIds,
      selectedIndex: null,
    };

    // Broadcast the options to all connected clients
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.OPTIONS_PREPARED, {
      drawOptions,
      newGameState: updatedState,
    });

    return NextResponse.json({
      success: true,
      drawOptions,
      newGameState: updatedState,
    });
  } catch (error) {
    console.error("Error preparing options:", error);
    return NextResponse.json(
      { error: "Failed to prepare options" },
      { status: 500 }
    );
  }
}

