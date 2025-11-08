"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface UseHeartbeatOptions {
  enabled: boolean; // Only run heartbeat if enabled (i.e., player is logged in)
}

/**
 * Custom hook that sends periodic heartbeat signals to the server
 * to track player online status
 */
export function useHeartbeat({ enabled }: UseHeartbeatOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clear any existing interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    intervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  const sendHeartbeat = async () => {
    try {
      await fetch("/api/session/heartbeat", {
        method: "POST",
      });
    } catch (error) {
      console.error("Error sending heartbeat:", error);
      // Silently fail - heartbeat is not critical
    }
  };
}

