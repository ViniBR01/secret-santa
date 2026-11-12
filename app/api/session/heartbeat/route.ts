import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PUSHER_EVENTS } from "@/lib/pusher";
import { touchPresence } from "@/lib/state-store";
import { broadcast, errorResponse } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "player" || !session.playerId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    // Presence is stored separately from the game, so it can never conflict with a draw.
    const presence = await touchPresence(session.playerId);
    await broadcast(PUSHER_EVENTS.PLAYER_CONNECTED, {
      playerId: session.playerId,
      timestamp: presence.lastSeen,
    });
    return NextResponse.json({ success: true, timestamp: presence.lastSeen });
  } catch (error) {
    return errorResponse(error, "Failed to process heartbeat");
  }
}
