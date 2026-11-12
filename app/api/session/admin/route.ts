import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, verifyAdminCode } from "@/lib/session";
import { PUSHER_EVENTS } from "@/lib/pusher";
import { broadcast, errorResponse, readJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { secretCode } = await readJson<{ secretCode: string }>(request);
    if (!secretCode || !verifyAdminCode(secretCode)) {
      return NextResponse.json({ error: "Invalid admin code" }, { status: 403 });
    }
    await setSessionCookie({ role: "admin" });

    // adminId is purely informational for the UI; it is not part of the
    // versioned game state, so admin logins never race with draws.
    const timestamp = Date.now();
    await broadcast(PUSHER_EVENTS.ADMIN_SET, { adminId: `admin-${timestamp}`, timestamp });

    return NextResponse.json({ success: true, role: "admin" });
  } catch (error) {
    return errorResponse(error, "Failed to set admin session");
  }
}
