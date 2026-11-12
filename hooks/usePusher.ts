"use client";

import { useEffect } from "react";
import { getPusherClient, PUSHER_CHANNEL } from "@/lib/pusher";
import { attachRealtime } from "@/lib/pusher-events";
import { useGameStore } from "@/lib/store";

export function usePusher() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    // Check if Pusher credentials are configured
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!pusherKey || pusherKey === "your_pusher_key_here") {
      console.log("⚠️ Pusher not configured, running in local-only mode");
      return;
    }

    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNEL);
    const detach = attachRealtime({
      channel,
      connection: pusher.connection,
      getStore: useGameStore.getState,
    });

    // Phones suspend background tabs; catch up as soon as the user looks again.
    const onVisible = () => {
      if (document.visibilityState === "visible") void useGameStore.getState().resync();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      console.log("🔌 Cleaning up Pusher subscription");
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      detach();
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);
}
