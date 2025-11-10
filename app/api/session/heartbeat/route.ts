import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { ensureGameState, setGameState } from "@/lib/server-state";
import { PlayerSession } from "@/types";

// Mark route as dynamic to ensure cookies are read at request time
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getSession();

    if (!session || session.role !== "player" || !session.playerId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const timestamp = Date.now();

    // Update server-side game state with fresh heartbeat
    const gameState = ensureGameState();
    const existingSession = gameState.activePlayerSessions[session.playerId];
    const playerSession: PlayerSession = {
      playerId: session.playerId,
      connectedAt: existingSession?.connectedAt || timestamp,
      lastSeen: timestamp,
      isOnline: true,
    };
    gameState.activePlayerSessions[session.playerId] = playerSession;
    setGameState(gameState);

    // Broadcast heartbeat via Pusher (if configured)
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (pusherKey && pusherKey !== "your_pusher_key_here") {
      await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.PLAYER_CONNECTED, {
        playerId: session.playerId,
        timestamp,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp,
    });
  } catch (error) {
    console.error("Error processing heartbeat:", error);
    return NextResponse.json(
      { error: "Failed to process heartbeat" },
      { status: 500 }
    );
  }
}

