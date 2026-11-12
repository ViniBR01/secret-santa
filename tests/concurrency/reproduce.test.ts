/**
 * Reproductions of the failures seen with ~20 simultaneous users.
 *
 * Every test here asserts a property the game MUST keep. Against the
 * original implementation they fail; after the fix they pass.
 */
import { afterEach, describe, expect, it } from "vitest";
import { NET, Scenario, Topology } from "./harness";
import { everyoneJoins, playGame } from "./players";
import { broadcastStates, checkCompletedGame, checkStateInvariants, regressions } from "./invariants";
import { familyConfig } from "@/lib/family-config";
import { sleep } from "./fake-pusher";

const VERCEL: Topology = { kind: "serverless", maxInstances: 6, idleTimeoutMs: 1500, coldStartMs: 15 };

let sc: Scenario;
afterEach(() => sc?.dispose());

describe("1. serverless deployment (state lives in per-instance memory)", () => {
  it("20+ people joining at once all see the same game", async () => {
    sc = new Scenario({ seed: 11, topology: VERCEL, withRedis: true });
    const fam = await everyoneJoins(sc);
    await fam.admin.state.startGame();
    await sc.settle(200);

    // Ask the load balancer a few times, like refreshes landing on different instances
    const views = await Promise.all(Array.from({ length: 12 }, () => sc.freshView()));
    const lifecycles = views.map((v) => v?.gameLifecycle ?? "none");
    expect(new Set(lifecycles), `instances disagree: ${lifecycles.join(",")}`).toEqual(
      new Set(["in_progress"])
    );
    // Every open browser shows the started game
    const notStarted = fam.all.filter((b) => b.state.gameLifecycle !== "in_progress").map((b) => b.name);
    expect(notStarted, "browsers stuck on the waiting screen").toEqual([]);
  });

  it("a full game completes with a coherent, durable result", async () => {
    sc = new Scenario({ seed: 12, topology: VERCEL, withRedis: true });
    const fam = await everyoneJoins(sc);
    await fam.admin.state.startGame();
    await sc.settle();
    const log = await playGame(sc, fam);

    const final = await sc.freshView();
    expect(checkCompletedGame(final), log.join("\n")).toEqual([]);
    // ...and it's still there after instances are recycled
    await sleep(1600);
    expect(checkCompletedGame(await sc.freshView())).toEqual([]);
  });
});

describe("2. server trusts the client's copy of the game state", () => {
  it("a late joiner with a stale screen cannot rewind the game", async () => {
    sc = new Scenario({ seed: 21, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 6, profile: () => NET.wifi });
    await fam.admin.state.startGame();
    await sc.settle();
    await playGame(sc, { ...fam, players: new Map() }, {}).catch(() => undefined); // admin plays all
    const before = await sc.freshView();
    expect(before?.isComplete).toBe(true);

    // A family member who's been offline opens the page fresh: initGame() races
    // with an empty instance and POSTs a brand-new game.
    const late = sc.browser("late", NET.badMobile);
    await late.open({ playerId: familyConfig.drawOrder[3] });
    await late.state.initGame();
    await sc.settle();

    const after = await sc.freshView();
    expect(after?.assignments).toEqual(before?.assignments);
  });

  it("the drawer's stale snapshot cannot overwrite newer state (lost update)", async () => {
    sc = new Scenario({ seed: 22, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.lan });
    await fam.admin.state.startGame();
    await sc.settle();

    // Drawer 0 opens the boxes...
    const p0 = fam.players.get(familyConfig.drawOrder[0])!;
    await p0.state.prepareOptions();
    await sc.settle();
    // ...a slow client reads state, then the admin forces the draw, then the slow
    // client's request (with its old snapshot) arrives.
    const snapshot = await sc.freshView();
    await fam.admin.state.makeSelection(0);
    await sc.settle();
    const res = await p0.fetch("/api/draw/select", {
      method: "POST",
      body: JSON.stringify({ gameState: snapshot, choiceIndex: 1 }),
    });
    await sc.settle();

    expect(res.status).toBeGreaterThanOrEqual(400);
    const s = await sc.freshView();
    expect(checkStateInvariants(s)).toEqual([]);
    expect(s?.currentDrawerIndex).toBe(1);
  });

  it("anyone can forge the whole game via POST /api/state", async () => {
    sc = new Scenario({ seed: 23, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 3, profile: () => NET.lan });
    await fam.admin.state.startGame();
    await sc.settle();
    const forged = { ...(await sc.freshView())!, assignments: { abuelo: "vini" }, currentDrawerIndex: 1 };
    const p = fam.players.get(familyConfig.drawOrder[2])!;
    const res = await p.fetch("/api/state", { method: "POST", body: JSON.stringify({ gameState: forged }) });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect((await sc.freshView())?.assignments).toEqual({});
  });
});

describe("3. concurrent / duplicate requests", () => {
  it("double-clicking a box draws exactly once", async () => {
    sc = new Scenario({ seed: 31, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.mobile4g });
    await fam.admin.state.startGame();
    await sc.settle();
    const p0 = fam.players.get(familyConfig.drawOrder[0])!;
    await p0.state.prepareOptions();
    await sc.settle();

    // Drawer and admin (helping grandma) click at the same moment
    await Promise.all([p0.state.makeSelection(0), p0.state.makeSelection(1), fam.admin.state.makeSelection(0)]);
    await sc.settle();

    const s = await sc.freshView();
    expect(checkStateInvariants(s)).toEqual([]);
    expect(s?.currentDrawerIndex).toBe(1);
    // Exactly one draw for drawer 0 was ever announced
    const draws = new Set(
      broadcastStates(sc.hub.log)
        .filter((st) => st.assignments[familyConfig.drawOrder[0]])
        .map((st) => st.assignments[familyConfig.drawOrder[0]])
    );
    expect([...draws], "drawer 0 was announced with different giftees").toHaveLength(1);
    // Every screen shows that same draw
    for (const b of fam.all) {
      expect(b.state.assignments[familyConfig.drawOrder[0]], b.name).toBe([...draws][0]);
    }
  });

  it("double-clicking 'start turn' opens one set of boxes", async () => {
    sc = new Scenario({ seed: 32, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.mobile4g });
    await fam.admin.state.startGame();
    await sc.settle();
    const p0 = fam.players.get(familyConfig.drawOrder[0])!;
    await Promise.all([p0.state.prepareOptions(), p0.state.prepareOptions(), fam.admin.state.prepareOptions()]);
    await sc.settle();
    // Only one set of boxes was ever generated for turn 0
    const optionSets = new Set(
      broadcastStates(sc.hub.log)
        .filter((st) => st.currentDrawerIndex === 0 && st.selectionPhase === "selecting")
        .map((st) => JSON.stringify(st.currentOptions))
    );
    expect(optionSets.size, "boxes were reshuffled by a second click").toBe(1);
    // Everyone sees the same boxes
    const screens = new Set(fam.all.map((b) => JSON.stringify(b.state.currentOptions)));
    expect(screens.size).toBe(1);
  });

  it("heartbeats racing with a draw do not undo it", async () => {
    sc = new Scenario({ seed: 33, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { profile: () => NET.wifi });
    await fam.admin.state.startGame();
    await sc.settle();
    let stop = false;
    const beats = (async () => {
      while (!stop) {
        await Promise.all(fam.all.map((b) => b.state.sendHeartbeat()));
      }
    })();
    const log = await playGame(sc, fam);
    stop = true;
    await beats;
    expect(checkCompletedGame(await sc.freshView()), log.join("\n")).toEqual([]);
  });
});

describe("4. realtime events arriving late / out of order / not at all", () => {
  it("every screen converges to the server state and never goes backwards", async () => {
    sc = new Scenario({ seed: 41, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, {
      profile: (i) => ({ ...NET.badMobile, reorderEvents: i % 3 === 0 }),
    });
    await fam.admin.state.startGame();
    await sc.settle();
    const log = await playGame(sc, fam);
    const final = await sc.freshView();
    expect(checkCompletedGame(final), log.join("\n")).toEqual([]);

    for (const b of fam.all) {
      expect(regressions(b.indexHistory), `${b.name} went backwards`).toEqual([]);
      expect(b.state.currentDrawerIndex, `${b.name} out of sync`).toBe(final!.currentDrawerIndex);
      expect(b.state.assignments, `${b.name} assignments`).toEqual(final!.assignments);
    }
  });

  it("a phone that was asleep during a turn catches up when it reconnects", async () => {
    sc = new Scenario({ seed: 42, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 6, profile: () => NET.wifi });
    await fam.admin.state.startGame();
    await sc.settle();
    const sleepy = fam.players.get(familyConfig.drawOrder[1])!; // next drawer!
    sleepy.channel.goOffline(400);
    const p0 = fam.players.get(familyConfig.drawOrder[0])!;
    await p0.state.prepareOptions();
    await sc.settle();
    await p0.state.makeSelection(0);
    await sc.settle(600); // sleepy reconnects (re-subscribes) but missed every event

    expect(sleepy.state.currentDrawerIndex, "missed events were never recovered").toBe(1);
    expect(sleepy.state.selectionPhase).toBe("waiting");
  });
});
