# Bugfix: Heartbeat "Failed to fetch" Error

## Issue
Players were experiencing a "Failed to fetch" error in the browser console when the heartbeat hook attempted to send requests to `/api/session/heartbeat`. The error occurred because the route was not properly configured to handle dynamic cookie reads in Next.js 15.

## Error Details
```
Console TypeError
Failed to fetch

Call Stack:
- sendHeartbeat (./hooks/useHeartbeat.ts)
- useHeartbeat.useEffect (./hooks/useHeartbeat.ts)
```

## Root Cause
In Next.js 15, API routes that use the `cookies()` function need to be explicitly marked as dynamic routes to ensure that cookies are read at request time rather than being statically generated at build time.

The `/api/session/heartbeat` route (and several other session-related routes) were using `await getSession()`, which internally calls `await cookies()`. Without the `dynamic = 'force-dynamic'` export, Next.js would try to pre-render these routes, causing the cookie reads to fail at runtime.

## Solution
Added `export const dynamic = 'force-dynamic';` to all API routes that use session/cookie functions:

### Session Routes Updated:
1. **`/app/api/session/heartbeat/route.ts`** - Main fix for the reported error
2. **`/app/api/session/status/route.ts`** - Reads session via `getSession()`
3. **`/app/api/session/logout/route.ts`** - Reads and clears session
4. **`/app/api/session/admin/route.ts`** - Sets admin session cookie
5. **`/app/api/session/identify/route.ts`** - Sets player session cookie

### Game/Admin Routes Updated:
6. **`/app/api/draw/options/route.ts`** - Uses `getSessionFromRequest()`
7. **`/app/api/draw/select/route.ts`** - Uses `getSessionFromRequest()`
8. **`/app/api/admin/start-game/route.ts`** - Uses `requireAdmin()`
9. **`/app/api/admin/set-next-result/route.ts`** - Uses `requireAdmin()`

### Already Configured:
- **`/app/api/state/route.ts`** - Already had `dynamic = 'force-dynamic'`

## Implementation
Each affected route now includes this export at the top level:

```typescript
// Mark route as dynamic to ensure cookies are read at request time
export const dynamic = 'force-dynamic';
```

This tells Next.js to:
- Opt out of static optimization for these routes
- Always execute them at request time
- Properly handle cookies and other request-specific data

## Testing
After this fix:
1. Players should no longer see "Failed to fetch" errors in the console
2. Heartbeat requests should succeed and return proper session data
3. Player connection status should update correctly
4. All session-based authentication should work reliably

## Related Files
- `hooks/useHeartbeat.ts` - Client-side heartbeat hook
- `lib/session.ts` - Session management with `cookies()` calls
- All API routes listed above

## Notes
- This is a common issue when migrating to Next.js 15, where the async `cookies()` API requires explicit dynamic route configuration
- The `/app/api/draw/route.ts` was NOT updated because it doesn't use session functions
- This fix ensures consistent behavior across all session-authenticated API endpoints

