import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { transact } from "@/lib/state-store";
import { randomDraw, TurnRef } from "@/lib/turns";
import { broadcastState, errorResponse, NO_STORE, readJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/** Random draw for the current drawer (admin "quick draw"). Body: { gameId?, drawerIndex? } */
export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    const ref = await readJson<TurnRef>(request);
    const { state, changed } = await transact((s) => randomDraw(s, ref));
    if (changed) await broadcastState(state);
    return NextResponse.json(
      { success: true, drawResult: state.lastDraw, newGameState: state },
      { headers: NO_STORE }
    );
  } catch (error) {
    return errorResponse(error, "Failed to execute draw");
  }
}
