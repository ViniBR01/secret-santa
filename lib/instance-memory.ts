import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Process-local memory for the server.
 *
 * In production this is simply `globalThis`. On a serverless platform (Vercel)
 * every function instance has its *own* globalThis, so anything stored here is
 * NOT shared between concurrent users that land on different instances.
 *
 * The concurrency tests use `instanceScope` to emulate several isolated
 * serverless instances inside one test process.
 */
export type InstanceMemory = Record<string, any>;

export const instanceScope = new AsyncLocalStorage<InstanceMemory>();

export function instanceMemory(): InstanceMemory {
  return instanceScope.getStore() ?? (globalThis as unknown as InstanceMemory);
}
