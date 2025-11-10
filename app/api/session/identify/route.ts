import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, validatePlayerId } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { getMemberById } from "@/lib/family-config";
import { ensureGameState, setGameState } from "@/lib/server-state";
import { PlayerSession } from "@/types";

// Mark route as dynamic to ensure cookies are set at request time
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { playerId }: { playerId: string } = await request.json();

    // Validate playerId exists in family config
    if (!validatePlayerId(playerId)) {
      return NextResponse.json(
        { error: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Get player info
    const player = getMemberById(playerId);
    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Create session
    await setSessionCookie({
      role: "player",
      playerId,
    });

    const timestamp = Date.now();

    // Update server-side game state to mark player as online
    const gameState = ensureGameState();
    const playerSession: PlayerSession = {
      playerId,
      connectedAt: gameState.activePlayerSessions[playerId]?.connectedAt || timestamp,
      lastSeen: timestamp,
      isOnline: true,
    };
    gameState.activePlayerSessions[playerId] = playerSession;
    setGameState(gameState);

    // Broadcast player connection via Pusher (if configured)
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (pusherKey && pusherKey !== "your_pusher_key_here") {
      await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.PLAYER_CONNECTED, {
        playerId,
        playerName: player.name,
        timestamp,
      });
    }

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
      },
      role: "player",
    });
  } catch (error) {
    console.error("Error identifying player:", error);
    return NextResponse.json(
      { error: "Failed to identify player" },
      { status: 500 }
    );
  }
}

