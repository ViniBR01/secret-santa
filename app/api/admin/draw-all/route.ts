import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { transact } from "@/lib/state-store";
import { drawAllRemaining, TurnRef } from "@/lib/turns";
import { broadcastState, errorResponse, NO_STORE, readJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Admin: draw every remaining player in one atomic step.
 * Body: { gameId? } - the game the admin is looking at (stale tabs are rejected).
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const ref = await readJson<Pick<TurnRef, "gameId">>(request);
    const { state, changed } = await transact((s) => drawAllRemaining(s, ref));
    if (changed) await broadcastState(state);
    return NextResponse.json({ success: true, newGameState: state }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, "Failed to finish the draw");
  }
}
