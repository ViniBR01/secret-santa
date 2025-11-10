# Bugfix: Player Connection Status Tracking

## Issue
1. All players showed as offline when the game started, even though they were connected
2. After game actions (mystery box selection, draws), all online players would show as offline in the admin panel until they refreshed or a heartbeat was received (30+ seconds later)
3. Session tracking data was client-only and would be overwritten when server broadcasted game state updates

## Root Cause
The application had a hybrid session tracking system with a critical flaw:

1. **Client-Only Session Tracking**: Player sessions were tracked only in the client-side Zustand store via Pusher events
2. **No Server Persistence**: The server-side game state had an `activePlayerSessions` field, but it was never populated or updated by server routes
3. **State Overwriting**: When game actions occurred (draw, select), the server would broadcast a complete `GameState` object with empty `activePlayerSessions`, which would overwrite the client's session data
4. **No Initial State**: When players first identified, their online status wasn't recorded in the server state, so they appeared offline until a Pusher heartbeat event was received

## Solution: Server-Side Session Tracking

Implemented comprehensive server-side session management with the following changes:

### 1. Session Identify Route (`app/api/session/identify/route.ts`)
- When a player identifies, immediately mark them as online in server-side game state
- Create/update `PlayerSession` with `isOnline: true`, `connectedAt`, and `lastSeen`
- Persist to server state before broadcasting via Pusher
- This ensures players show as online immediately upon page load

### 2. Session Admin Route (`app/api/session/admin/route.ts`)
- When admin logs in, persist admin connection to server state
- Update `gameState.adminId` and persist before broadcasting

### 3. Heartbeat Route (`app/api/session/heartbeat/route.ts`)
- Update server-side game state on every heartbeat (every 30 seconds)
- Refresh player's `lastSeen` timestamp and ensure `isOnline: true`
- Persist updated state before broadcasting
- This keeps session data synchronized between server and clients

### 4. Session Timeout Helper (`lib/server-state.ts`)
- Added `updateSessionTimestamps()` function
- Marks sessions as offline if `lastSeen` is older than 60 seconds
- Called before returning state in GET `/api/state` to ensure accurate status

### 5. Logout Route (`app/api/session/logout/route.ts`)
- When player logs out, mark them as offline in server state
- Update `isOnline: false` and `lastSeen` before broadcasting
- Ensures logout immediately reflects in admin panel

### 6. State GET Endpoint (`app/api/state/route.ts`)
- Call `updateSessionTimestamps()` before returning state
- Ensures clients always receive accurate online/offline status
- Stale sessions (>60s since last heartbeat) are marked offline

### 7. Client Store Session Merging (`lib/store.ts`)
- Modified `setGameState()` to intelligently merge `activePlayerSessions`
- When receiving state updates, preserve local session data if more recent
- Compare `lastSeen` timestamps and use whichever is newest
- Never blindly overwrite all session data
- This prevents server state updates from erasing real-time session tracking

## Technical Implementation Details

### PlayerSession Persistence Flow
```typescript
// On identify/login
const playerSession: PlayerSession = {
  playerId,
  connectedAt: existingSession?.connectedAt || timestamp,
  lastSeen: timestamp,
  isOnline: true,
};
gameState.activePlayerSessions[playerId] = playerSession;
setGameState(gameState);
```

### Session Timeout Logic
```typescript
export function updateSessionTimestamps(timeoutMs: number = 60000): void {
  const now = Date.now();
  const sessions = globalThis.gameState.activePlayerSessions;
  
  for (const playerId in sessions) {
    const session = sessions[playerId];
    if (session.isOnline && (now - session.lastSeen) > timeoutMs) {
      session.isOnline = false;
    }
  }
}
```

### Client-Side Session Merging
```typescript
// In setGameState()
const mergedSessions: Record<string, PlayerSession> = { ...state.activePlayerSessions };

Object.keys(currentState.activePlayerSessions).forEach(playerId => {
  const localSession = currentState.activePlayerSessions[playerId];
  const incomingSession = state.activePlayerSessions[playerId];
  
  if (localSession && incomingSession) {
    // Use whichever has most recent lastSeen
    mergedSessions[playerId] = localSession.lastSeen > incomingSession.lastSeen 
      ? localSession 
      : incomingSession;
  } else if (localSession) {
    // Keep local session if not in incoming state
    mergedSessions[playerId] = localSession;
  }
});
```

## Files Modified

### API Routes
1. `app/api/session/identify/route.ts` - Persist player online status on login
2. `app/api/session/admin/route.ts` - Persist admin connection
3. `app/api/session/heartbeat/route.ts` - Update session on every heartbeat
4. `app/api/session/logout/route.ts` - Mark player offline on logout
5. `app/api/state/route.ts` - Clean stale sessions before returning state

### Libraries
6. `lib/server-state.ts` - Added `updateSessionTimestamps()` helper
7. `lib/store.ts` - Smart session merging in `setGameState()`

## Expected Behavior After Fix

1. ✅ Players show as online immediately when they load the page and identify
2. ✅ Online status persists through all game actions (selections, draws, state updates)
3. ✅ Players automatically show as offline after 60 seconds without heartbeat
4. ✅ Logout immediately marks player as offline in admin panel
5. ✅ Admin panel shows accurate real-time connection status at all times
6. ✅ Session data survives page refreshes and late joins
7. ✅ No more flickering between online/offline states during game actions

## Testing Checklist

- [x] Player identifies → shows online immediately in admin panel
- [x] Player selects mystery box → stays online during and after action
- [x] Multiple players online → all stay online during draws
- [x] Player closes browser → shows offline after 60 seconds
- [x] Player logs out → immediately shows offline
- [x] New player joins mid-game → sees accurate status for all players
- [x] Page refresh → player status preserved
- [x] Admin panel always shows accurate connection counts

## Related Issues Fixed

This fix resolves the issues reported where:
- "All players are always shown as offline at the start page, when the admin hasn't yet started the game"
- "Once an action is taken in the game, such as a mystery box is selected, all players who are online become shown as offline in the admin panel"

The root cause was the lack of server-side session persistence and the client-side session data being overwritten on every game state update.

