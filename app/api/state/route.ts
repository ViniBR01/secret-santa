import { NextRequest, NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { GameState } from "@/types";
import { getSession } from "@/lib/session";
import { getGameState, setGameState, resetGameState, updateSessionTimestamps } from "@/lib/server-state";

// Disable caching for this route to ensure fresh game state
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Update session timestamps to mark stale sessions as offline
    updateSessionTimestamps();
    
    // Return the current game state
    // If no game has been started yet, return null
    const gameState = getGameState();
    
    console.log("📤 GET /api/state - returning:", { 
      exists: gameState !== null,
      hasState: !!gameState 
    });
    
    return NextResponse.json({ 
      gameState,
      exists: gameState !== null 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Error getting game state:", error);
    return NextResponse.json(
      { error: "Failed to get game state" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { gameState }: { gameState: GameState } = await request.json();

    // Persist the game state on the server
    setGameState(gameState);

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
    // Validate admin session for reset
    const session = await getSession();
    
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Reset the game state on the server
    const newGameState = resetGameState();

    // Broadcast game reset to all connected clients
    await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.GAME_RESET, {});

    return NextResponse.json({ success: true, gameState: newGameState });
  } catch (error) {
    console.error("Error resetting game:", error);
    return NextResponse.json(
      { error: "Failed to reset game" },
      { status: 500 }
    );
  }
}

