import { NextRequest, NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { prepareDrawOptions } from "@/lib/game-logic";
import { familyConfig } from "@/lib/family-config";
import { GameState } from "@/types";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const gameState: GameState = await request.json();

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

    // Check if turn is already locked
    if (gameState.turnLocked) {
      return NextResponse.json(
        { error: "Turn is already in progress" },
        { status: 409 }
      );
    }

    // Prepare draw options
    const drawOptions = prepareDrawOptions(gameState);

    if (!drawOptions || drawOptions.viableGifteeIds.length === 0) {
      return NextResponse.json(
        { error: "No valid options available" },
        { status: 400 }
      );
    }

    // Update game state to selecting phase and lock the turn
    const updatedState: GameState = {
      ...gameState,
      selectionPhase: 'selecting',
      currentOptions: drawOptions.viableGifteeIds,
      selectedIndex: null,
      turnLocked: true,
    };

    // Broadcast turn lock
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.TURN_LOCKED, {
      drawerId: currentDrawerId,
      timestamp: Date.now(),
    });

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

