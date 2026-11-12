import { NextResponse } from "next/server";
import { GameState } from "@/types";
import { pusherServer, PUSHER_CHANNEL, PUSHER_EVENTS } from "./pusher";
import { GameError } from "./state-store";

export const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export function pusherConfigured() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  return !!key && key !== "your_pusher_key_here";
}

/**
 * Broadcast an event. Realtime is best-effort: if Pusher hiccups the change is
 * already committed and clients recover it by resyncing, so we never fail the
 * request (which would make the user retry an action that already happened).
 */
export async function broadcast(event: string, data: unknown) {
  if (!pusherConfigured()) return;
  try {
    await pusherServer.trigger(PUSHER_CHANNEL, event, data);
  } catch (e) {
    console.error(`Pusher broadcast "${event}" failed (clients will resync):`, e);
  }
}

/** Every committed state change is announced with the full new snapshot. */
export function broadcastState(state: GameState) {
  return broadcast(PUSHER_EVENTS.GAME_STATE_UPDATE, state);
}

/** Convert errors to JSON responses; conflicts include the latest state so the client can resync. */
export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof GameError) {
    return NextResponse.json(
      { error: error.message, gameState: error.state ?? null },
      { status: error.status, headers: NO_STORE }
    );
  }
  if (error instanceof Error && error.message.startsWith("Unauthorized")) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof Error && error.message.startsWith("Forbidden")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}
