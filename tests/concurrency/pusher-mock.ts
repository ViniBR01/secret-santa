import type { FakePusherHub } from "./fake-pusher";
export { PUSHER_EVENTS, PUSHER_CHANNEL } from "@/lib/pusher-constants";

let hub: FakePusherHub | null = null;
export function setHub(h: FakePusherHub | null) {
  hub = h;
}

/** Server-side Pusher replacement: forwards to the fake hub of the running scenario. */
export const pusherServer = {
  trigger: (channel: string, event: string, data: unknown) =>
    hub ? hub.trigger(channel, event, data) : Promise.resolve({}),
};

export const getPusherClient = () => {
  throw new Error("getPusherClient is not available in tests; use the harness");
};
export const resetPusherClient = () => {};
