import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { transact } from "@/lib/state-store";
import { openTurn, TurnRef } from "@/lib/turns";
import { broadcastState, errorResponse, NO_STORE, readJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Start the current drawer's turn (show the mystery boxes).
 * Body: { gameId?, drawerIndex? } - the turn the client is looking at.
 * The server's own state is the only thing validated / modified.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: No valid session" }, { status: 401 });
    }
    const ref = await readJson<TurnRef>(request);
    const { state, changed } = await transact((s) => openTurn(s, session, ref));
    if (changed) await broadcastState(state);
    return NextResponse.json(
      { success: true, newGameState: state, drawOptions: { viableGifteeIds: state.currentOptions } },
      { headers: NO_STORE }
    );
  } catch (error) {
    return errorResponse(error, "Failed to prepare options");
  }
}
