import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getMemberById } from "@/lib/family-config";
import { transact } from "@/lib/state-store";
import { adminForce, TurnRef } from "@/lib/turns";
import { broadcastState, errorResponse, NO_STORE, readJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/** Admin forces the current drawer's result. Body: { selectedGifteeId, gameId?, drawerIndex? } */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await readJson<TurnRef & { selectedGifteeId: string }>(request);
    const { state, changed } = await transact((s) =>
      adminForce(s, { ...body, gifteeId: String(body.selectedGifteeId) })
    );
    if (changed) await broadcastState(state);
    const draw = state.lastDraw;
    return NextResponse.json(
      {
        success: true,
        drawResult: draw,
        newGameState: state,
        message: draw
          ? `Admin set ${getMemberById(draw.drawerId)?.name} to draw ${draw.gifteeName}`
          : undefined,
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    return errorResponse(error, "Failed to set next result");
  }
}
