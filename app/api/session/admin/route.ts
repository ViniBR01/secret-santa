import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, verifyAdminCode } from "@/lib/session";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { ensureGameState, setGameState } from "@/lib/server-state";

// Mark route as dynamic to ensure cookies are set at request time
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { secretCode }: { secretCode: string } = await request.json();

    // Verify admin code
    if (!verifyAdminCode(secretCode)) {
      return NextResponse.json(
        { error: "Invalid admin code" },
        { status: 403 }
      );
    }

    // Create admin session
    await setSessionCookie({
      role: "admin",
    });

    const timestamp = Date.now();
    const adminId = `admin-${timestamp}`;

    // Update server-side game state to set admin
    const gameState = ensureGameState();
    gameState.adminId = adminId;
    setGameState(gameState);

    // Broadcast admin connection via Pusher (if configured)
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (pusherKey && pusherKey !== "your_pusher_key_here") {
      await pusherServer.trigger(PUSHER_CHANNEL, PUSHER_EVENTS.ADMIN_SET, {
        adminId,
        timestamp,
      });
    }

    return NextResponse.json({
      success: true,
      role: "admin",
    });
  } catch (error) {
    console.error("Error setting admin session:", error);
    return NextResponse.json(
      { error: "Failed to set admin session" },
      { status: 500 }
    );
  }
}

