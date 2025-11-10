import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { getGameState, setGameState } from "@/lib/server-state";

// Mark route as dynamic to ensure cookies are read at request time
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Get current session before clearing
    const session = await getSession();

    // Clear the session cookie
    await clearSessionCookie();

    // Mark player as offline in server state (if was a player)
    if (session?.role === "player" && session.playerId) {
      const gameState = getGameState();
      if (gameState && gameState.activePlayerSessions[session.playerId]) {
        gameState.activePlayerSessions[session.playerId].isOnline = false;
        gameState.activePlayerSessions[session.playerId].lastSeen = Date.now();
        setGameState(gameState);
      }

      // Broadcast player disconnection via Pusher (if configured)
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      if (pusherKey && pusherKey !== "your_pusher_key_here") {
        await pusherServer.trigger(
          PUSHER_CHANNEL,
          PUSHER_EVENTS.PLAYER_DISCONNECTED,
          {
            playerId: session.playerId,
            timestamp: Date.now(),
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

