import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, validatePlayerId } from "@/lib/session";
import { PUSHER_EVENTS } from "@/lib/pusher";
import { getMemberById } from "@/lib/family-config";
import { touchPresence } from "@/lib/state-store";
import { broadcast, errorResponse, readJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await readJson<{ playerId: string }>(request);
    if (!playerId || !validatePlayerId(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }
    const player = getMemberById(playerId)!;

    await setSessionCookie({ role: "player", playerId });
    const presence = await touchPresence(playerId);
    await broadcast(PUSHER_EVENTS.PLAYER_CONNECTED, {
      playerId,
      playerName: player.name,
      timestamp: presence.lastSeen,
    });

    return NextResponse.json({
      success: true,
      player: { id: player.id, name: player.name },
      role: "player",
    });
  } catch (error) {
    return errorResponse(error, "Failed to identify player");
  }
}
