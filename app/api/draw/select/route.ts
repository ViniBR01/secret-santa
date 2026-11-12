import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { transact } from "@/lib/state-store";
import { selectBox, TurnRef } from "@/lib/turns";
import { broadcastState, errorResponse, NO_STORE, readJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Pick a mystery box. Body: { choiceIndex, gameId?, drawerIndex? }.
 * Atomic: a double click or a retry after a lost response commits exactly one draw.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: No valid session" }, { status: 401 });
    }
    const body = await readJson<TurnRef & { choiceIndex: number }>(request);
    const { state, changed } = await transact((s) =>
      selectBox(s, session, { ...body, choiceIndex: Number(body.choiceIndex) })
    );
    if (changed) await broadcastState(state);
    return NextResponse.json(
      { success: true, drawResult: state.lastDraw, newGameState: state },
      { headers: NO_STORE }
    );
  } catch (error) {
    return errorResponse(error, "Failed to finalize selection");
  }
}
