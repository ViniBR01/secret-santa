import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/family-config";

// Mark route as dynamic to ensure cookies are read at request time
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        role: null,
        playerId: null,
      });
    }

    // For player sessions, include player info
    let playerInfo = null;
    if (session.role === "player" && session.playerId) {
      const player = getMemberById(session.playerId);
      if (player) {
        playerInfo = {
          id: player.id,
          name: player.name,
        };
      }
    }

    return NextResponse.json({
      authenticated: true,
      role: session.role,
      playerId: session.playerId || null,
      player: playerInfo,
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    return NextResponse.json(
      { error: "Failed to check session status" },
      { status: 500 }
    );
  }
}

