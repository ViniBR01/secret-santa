import { NextResponse } from "next/server";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { requireAdmin } from "@/lib/session";
import { getGameState, setGameState } from "@/lib/server-state";

export async function POST() {
  try {
    // Verify admin session
    console.log("🔐 Verifying admin session for start-game...");
    await requireAdmin();
    console.log("✅ Admin session verified");

    // Get current game state
    const gameState = getGameState();
    console.log("📊 Current game state:", gameState ? "exists" : "null");
    
    if (!gameState) {
      console.log("❌ No game state found");
      return NextResponse.json(
        { error: "No game state found" },
        { status: 404 }
      );
    }

    // Check if game is in not_started state
    if (gameState.gameLifecycle !== 'not_started') {
      return NextResponse.json(
        { error: "Game has already been started or completed" },
        { status: 400 }
      );
    }

    // Update game lifecycle to in_progress
    const updatedGameState = {
      ...gameState,
      gameLifecycle: 'in_progress' as const,
    };

    // Persist the updated state
    setGameState(updatedGameState);
    console.log("💾 Game state persisted with lifecycle:", updatedGameState.gameLifecycle);

    // Broadcast game state update to all connected clients
    console.log("📡 Broadcasting game state update via Pusher...");
    await pusherServer.trigger(
      PUSHER_CHANNEL,
      PUSHER_EVENTS.GAME_STATE_UPDATE,
      updatedGameState
    );
    console.log("✅ Pusher broadcast complete");

    return NextResponse.json({ 
      success: true,
      gameState: updatedGameState 
    });
  } catch (error) {
    console.error("Error starting game:", error);
    
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 }
    );
  }
}

