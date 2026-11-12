import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { transact } from "@/lib/state-store";
import { startGame } from "@/lib/turns";
import { broadcastState, errorResponse, NO_STORE } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireAdmin();
    const { state, changed } = await transact(startGame);
    if (changed) await broadcastState(state);
    return NextResponse.json({ success: true, gameState: state }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, "Failed to start game");
  }
}
