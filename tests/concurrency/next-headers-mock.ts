import { AsyncLocalStorage } from "node:async_hooks";

/** Per-request cookie context, so `cookies()` from next/headers works outside Next.js. */
export interface RequestCookies {
  cookies: Map<string, string>;
  /** Cookies set (string) or deleted (null) during this request */
  changes: Map<string, string | null>;
}

export const requestContext = new AsyncLocalStorage<RequestCookies>();

function ctx(): RequestCookies {
  const c = requestContext.getStore();
  if (!c) throw new Error("cookies() called outside a simulated request");
  return c;
}

export async function cookies() {
  const c = ctx();
  return {
    get(name: string) {
      const value = c.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string) {
      c.cookies.set(name, value);
      c.changes.set(name, value);
    },
    delete(name: string) {
      c.cookies.delete(name);
      c.changes.set(name, null);
    },
  };
}

export async function headers() {
  return new Headers();
}
