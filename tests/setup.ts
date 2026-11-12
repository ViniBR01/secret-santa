// Pretend Pusher is configured so the client store takes the networked code path.
process.env.NEXT_PUBLIC_PUSHER_KEY = "test-key";
process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "test";
process.env.PUSHER_APP_ID = "test";
process.env.PUSHER_SECRET = "test";
process.env.ADMIN_SECRET_CODE = "admin-code";

// The app is very chatty; keep test output readable (set DEBUG_LOGS=1 to see it).
if (!process.env.DEBUG_LOGS) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

import { vi } from "vitest";
vi.mock("next/headers", () => import("./concurrency/next-headers-mock"));
vi.mock("@/lib/pusher", () => import("./concurrency/pusher-mock"));
