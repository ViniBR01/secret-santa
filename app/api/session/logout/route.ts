import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/session";
import { PUSHER_EVENTS } from "@/lib/pusher";
import { touchPresence } from "@/lib/state-store";
import { broadcast, errorResponse } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    await clearSessionCookie();

    if (session?.role === "player" && session.playerId) {
      await touchPresence(session.playerId, false);
      await broadcast(PUSHER_EVENTS.PLAYER_DISCONNECTED, {
        playerId: session.playerId,
        timestamp: Date.now(),
      });
    }
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return errorResponse(error, "Failed to logout");
  }
}
