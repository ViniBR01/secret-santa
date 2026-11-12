import { familyConfig } from "@/lib/family-config";
import { Scenario, SimulatedBrowser, mixedProfile, ClientProfile } from "./harness";
import { sleep } from "./fake-pusher";

export interface Family {
  admin: SimulatedBrowser;
  players: Map<string, SimulatedBrowser>;
  all: SimulatedBrowser[];
}

/**
 * Everyone opens the site at (roughly) the same time, as happens when the
 * admin says "ok everyone, open the link now!".
 */
export async function everyoneJoins(
  sc: Scenario,
  opts: { count?: number; profile?: (i: number) => ClientProfile; spreadMs?: number } = {}
): Promise<Family> {
  const ids = familyConfig.drawOrder.slice(0, opts.count ?? familyConfig.drawOrder.length);
  const admin = sc.browser("admin", opts.profile?.(-1) ?? mixedProfile(sc.rng));
  const players = new Map<string, SimulatedBrowser>();
  for (const [i, id] of ids.entries()) {
    players.set(id, sc.browser(id, opts.profile?.(i) ?? mixedProfile(sc.rng)));
  }
  const spread = opts.spreadMs ?? 200;
  await Promise.all([
    admin.open({ adminCode: "admin-code" }),
    ...[...players.entries()].map(async ([id, b]) => {
      await sleep(sc.rng() * spread);
      await b.open({ playerId: id });
    }),
  ]);
  await sc.settle();
  return { admin, players, all: [admin, ...players.values()] };
}

/** Wait until `pred` holds or `timeoutMs` passes. */
export async function waitFor(pred: () => boolean, timeoutMs = 3000, stepMs = 10) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (pred()) return true;
    await sleep(stepMs);
  }
  return pred();
}

export interface PlayOptions {
  /** Probability that the drawer double-clicks "start turn" / a box */
  doubleClickRate?: number;
  /** Probability that the drawer retries after an error */
  retryOnError?: boolean;
  /** Called between turns for chaos (refreshes, disconnects, admin actions ...) */
  between?: (turn: number) => Promise<void> | void;
  /** Called while the drawer is in "selecting" (mid-turn chaos) */
  during?: (turn: number) => Promise<void> | void;
  maxStallMs?: number;
}

/**
 * Play the whole game the way people do: whoever *believes* it's their turn
 * (based on their own, possibly stale, screen) clicks. Returns a log.
 */
export async function playGame(sc: Scenario, fam: Family, opts: PlayOptions = {}) {
  const log: string[] = [];
  const order = familyConfig.drawOrder;
  const dbl = opts.doubleClickRate ?? 0;
  let stalls = 0;

  for (let turn = 0; turn < order.length * 3 && stalls < 3; turn++) {
    await opts.between?.(turn);
    const server = await sc.freshView();
    if (server?.isComplete) break;

    const idx = server?.currentDrawerIndex ?? 0;
    const drawerId = order[idx];
    const drawer = fam.players.get(drawerId) ?? fam.admin;

    // The drawer waits until *their own screen* shows it's their turn.
    const sawTurn = await waitFor(
      () =>
        drawer.state.currentDrawerIndex === idx &&
        (drawer.state.selectionPhase === "waiting" || drawer.state.selectionPhase === "selecting"),
      opts.maxStallMs ?? 2000
    );
    if (!sawTurn) {
      log.push(`turn ${idx}: ${drawer.name} never saw their turn (screen idx=${drawer.state.currentDrawerIndex}, phase=${drawer.state.selectionPhase})`);
      stalls++;
      // A real person would refresh the page here.
      await drawer.reload();
      await sc.settle();
      continue;
    }

    if (drawer.state.selectionPhase === "waiting") {
      const clicks = [drawer.state.prepareOptions()];
      if (sc.rng() < dbl) clicks.push(drawer.state.prepareOptions());
      await Promise.all(clicks);
      await sc.settle();
    }

    const sawBoxes = await waitFor(() => drawer.state.selectionPhase === "selecting", opts.maxStallMs ?? 2000);
    if (!sawBoxes) {
      log.push(`turn ${idx}: ${drawer.name} never saw the boxes (err=${drawer.state.error})`);
      stalls++;
      await drawer.reload();
      await sc.settle();
      continue;
    }
    await opts.during?.(idx);

    const n = drawer.state.currentOptions.length;
    const choice = Math.floor(sc.rng() * n);
    const picks = [drawer.state.makeSelection(choice)];
    if (sc.rng() < dbl) picks.push(drawer.state.makeSelection((choice + 1) % n));
    await Promise.all(picks);
    await sc.settle();
    stalls = 0;
  }
  await sc.settle(100);
  return log;
}
