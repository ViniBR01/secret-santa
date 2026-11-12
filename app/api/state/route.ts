import { NextResponse } from "next/server";
import { PUSHER_EVENTS } from "@/lib/pusher";
import { getSession } from "@/lib/session";
import { loadGame, resetGame } from "@/lib/state-store";
import { broadcast, errorResponse, NO_STORE } from "@/lib/route-helpers";

// Disable caching for this route to ensure fresh game state
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** The single source of truth. Creates the game on first access (race-free). */
export async function GET() {
  try {
    const gameState = await loadGame();
    return NextResponse.json({ gameState, exists: true }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, "Failed to get game state");
  }
}

/*
 * NOTE: there is intentionally no POST handler. Browsers used to upload their
 * whole copy of the game here, which let any stale (or malicious) tab
 * overwrite the real game. All changes now go through the action routes.
 */

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    const newGameState = await resetGame();
    await broadcast(PUSHER_EVENTS.GAME_RESET, { newGameState });
    return NextResponse.json({ success: true, gameState: newGameState }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, "Failed to reset game");
  }
}
