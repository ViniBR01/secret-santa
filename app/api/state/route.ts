import { NextRequest, NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { GameState } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { gameState }: { gameState: GameState } = await request.json();

    // Broadcast game state update to all connected clients
    await pusherServer.trigger(
      PUSHER_CHANNEL,
      PUSHER_EVENTS.GAME_STATE_UPDATE,
      gameState
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating game state:", error);
    return NextResponse.json(
      { error: "Failed to update game state" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Broadcast game reset to all connected clients
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.GAME_RESET, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting game:", error);
    return NextResponse.json(
      { error: "Failed to reset game" },
      { status: 500 }
    );
  }
}

