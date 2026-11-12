import { afterEach, expect, it } from "vitest";
import { NET, Scenario } from "./harness";
import { familyConfig } from "@/lib/family-config";

let sc: Scenario | null = null;
afterEach(() => sc?.dispose());

it("harness drives the real routes and store (single client, perfect network)", async () => {
  sc = new Scenario({ seed: 1, topology: { kind: "single" } });
  const admin = sc.browser("admin", NET.lan);
  await admin.open({ adminCode: "admin-code" });
  await sc.settle();
  await admin.state.startGame();
  await sc.settle();
  expect(admin.state.gameLifecycle).toBe("in_progress");

  for (let i = 0; i < familyConfig.drawOrder.length; i++) {
    await admin.state.prepareOptions();
    await sc.settle();
    expect(admin.state.selectionPhase).toBe("selecting");
    await admin.state.makeSelection(0);
    await sc.settle();
  }
  expect(admin.state.isComplete).toBe(true);
  expect(Object.keys(admin.state.assignments)).toHaveLength(familyConfig.drawOrder.length);
});
