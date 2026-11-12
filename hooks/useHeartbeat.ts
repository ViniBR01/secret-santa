"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface UseHeartbeatOptions {
  enabled: boolean; // Only run heartbeat if enabled (i.e., player is logged in)
}

/**
 * Custom hook that sends periodic heartbeat signals to the server
 * to track player online status
 */
export function useHeartbeat({ enabled }: UseHeartbeatOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sendHeartbeat = () => useGameStore.getState().sendHeartbeat();

    // Send initial heartbeat, then periodically
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled]);
}
