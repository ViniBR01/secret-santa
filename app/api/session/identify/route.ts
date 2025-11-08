import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, validatePlayerId } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { getMemberById } from "@/lib/family-config";

export async function POST(request: NextRequest) {
  try {
    const { playerId }: { playerId: string } = await request.json();

    // Validate playerId exists in family config
    if (!validatePlayerId(playerId)) {
      return NextResponse.json(
        { error: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Get player info
    const player = getMemberById(playerId);
    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Create session
    await setSessionCookie({
      role: "player",
      playerId,
    });

    // Broadcast player connection via Pusher (if configured)
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (pusherKey && pusherKey !== "your_pusher_key_here") {
      await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.PLAYER_CONNECTED, {
        playerId,
        playerName: player.name,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
      },
      role: "player",
    });
  } catch (error) {
    console.error("Error identifying player:", error);
    return NextResponse.json(
      { error: "Failed to identify player" },
      { status: 500 }
    );
  }
}

