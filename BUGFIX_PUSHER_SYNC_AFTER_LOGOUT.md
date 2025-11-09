# Bug Fix: Pusher Synchronization After Logout/Login

## Problem

When a player logged out and logged back in as a different player whose turn was up:
1. Player could click "Start Turn" button
2. Admin would see mystery boxes and could select one
3. **Player would NOT see mystery boxes** - their screen wouldn't update
4. After page refresh, player would see the correct state

This indicated that the Pusher broadcast (OPTIONS_PREPARED event) was being sent and received by the admin, but not properly processed by the newly logged-in player's client.

## Root Cause

The Pusher client is a singleton that persists across logout/login cycles. When a player logs out and logs back in:

1. **Old Pusher connection persists** - The singleton wasn't being reset
2. **Subscription timing issue** - Actions could be triggered before Pusher fully subscribed to the channel
3. **No connection state tracking** - The app had no way to know if Pusher was ready to receive events

This meant that when the newly logged-in player clicked "Start Turn":
- Their action sent state to the server
- Server broadcasted OPTIONS_PREPARED event
- Admin's Pusher client received it (was already connected)
- Player's Pusher client might not have been ready yet, so the event was lost

## Solution Implemented

### 1. Pusher Client Reset (`lib/pusher.ts`)

Added function to properly disconnect and reset the Pusher singleton:

```typescript
export const resetPusherClient = () => {
  if (pusherClient) {
    console.log("🔌 Disconnecting Pusher client");
    pusherClient.disconnect();
    pusherClient = null;
  }
};
```

### 2. Pusher Ready State Tracking (`lib/store.ts`)

Added `isPusherReady` flag to Zustand store:

```typescript
interface GameStore extends GameState {
  isPusherReady: boolean; // Track if Pusher is connected and subscribed
  setPusherReady: (ready: boolean) => void;
}
```

### 3. Connection State Monitoring (`hooks/usePusher.ts`)

Updated the Pusher hook to:
- Track connection state changes
- Wait for successful subscription before setting ready flag
- Add comprehensive logging for debugging

```typescript
// Listen for connection state changes
pusher.connection.bind('state_change', (states: any) => {
  console.log(`🔌 Pusher connection state: ${states.previous} → ${states.current}`);
});

// Wait for successful subscription
channel.bind('pusher:subscription_succeeded', () => {
  console.log('✅ Pusher subscription successful');
  setPusherReady(true);
});

channel.bind('pusher:subscription_error', (error: any) => {
  console.error('❌ Pusher subscription error:', error);
  setPusherReady(false);
});
```

### 4. Action Gating (`lib/store.ts`)

Added checks in `prepareOptions` and `makeSelection` to ensure Pusher is ready:

```typescript
prepareOptions: async () => {
  const isPusherReady = get().isPusherReady;
  if (!isPusherReady) {
    console.warn("⚠️ Pusher not ready, waiting for connection...");
    set({ error: "Connecting to game server, please wait..." });
    return;
  }
  // Proceed with action...
}
```

### 5. Logout Integration (`components/GameBoard.tsx`)

Reset Pusher client on logout to ensure fresh connection:

```typescript
const handleLogout = async () => {
  resetPusherClient(); // Reset Pusher before logout
  await fetch("/api/session/logout", { method: "POST" });
  router.push("/identify");
};
```

### 6. Enhanced Logging

Added detailed console logs throughout the Pusher lifecycle:
- Connection state changes: `🔌 Pusher connection state: X → Y`
- Subscription events: `✅ Pusher subscription successful`
- Event reception: `📨 Received OPTIONS_PREPARED event`
- Action gating: `⚠️ Pusher not ready, waiting for connection...`

## How It Works Now

### Normal Flow (First Player)

1. Player logs in → GameBoard mounts
2. `usePusher()` hook initializes
3. Pusher connects and subscribes to channel
4. `pusher:subscription_succeeded` fires → `isPusherReady` set to `true`
5. Player can now perform actions
6. Actions send state → Server broadcasts → All clients receive updates

### Logout/Login Flow

1. Player clicks Logout
2. `resetPusherClient()` called → disconnects and clears singleton
3. `usePusher()` cleanup runs → unbinds events, unsubscribes, sets `isPusherReady` to `false`
4. Player navigates to identify page
5. Player logs back in with different identity
6. GameBoard mounts again
7. **Fresh Pusher client created** (singleton was cleared)
8. New subscription established
9. `isPusherReady` set to `true` after successful subscription
10. Player can perform actions and receive broadcasts

### Action Flow with Pusher Ready Check

1. Player clicks "Start Turn"
2. `prepareOptions()` called
3. **Checks `isPusherReady` first**
4. If not ready → shows "Connecting to game server, please wait..."
5. If ready → proceeds with action
6. Server broadcasts OPTIONS_PREPARED event
7. **Player's Pusher client receives event** (now guaranteed to be subscribed)
8. Mystery boxes appear on player's screen

## Console Output Guide

### Successful Connection

```
🔌 Initializing Pusher client...
🔌 Pusher connection state: initialized → connecting
🔌 Subscribing to channel: secret-santa-game
🔌 Pusher connection state: connecting → connected
✅ Pusher subscription successful
🔌 Pusher ready status: true
```

### Action While Ready

```
🔄 Fetching fresh state before preparing options...
📦 State data received: { exists: true, gameState: {...} }
✅ Using fresh state from server
📨 Received OPTIONS_PREPARED event
📥 Setting game state: { selectionPhase: 'selecting', ... }
```

### Action While Not Ready

```
⚠️ Pusher not ready, waiting for connection...
(Error message shown to user: "Connecting to game server, please wait...")
```

### Logout

```
🔌 Disconnecting Pusher client
🔌 Cleaning up Pusher subscription
🔌 Pusher ready status: false
```

## Benefits

✅ **Reliable state synchronization** - Actions only proceed when Pusher is ready
✅ **Fresh connections** - Each login gets a clean Pusher connection
✅ **Better error handling** - Clear feedback when connection not ready
✅ **Easier debugging** - Comprehensive logging shows exact connection state
✅ **Prevents race conditions** - No more lost Pusher events
✅ **User-friendly** - Shows "Connecting..." message instead of failing silently

## Files Modified

1. `lib/pusher.ts` - Added resetPusherClient()
2. `lib/store.ts` - Added isPusherReady flag and checks
3. `hooks/usePusher.ts` - Added connection monitoring and logging
4. `components/GameBoard.tsx` - Call resetPusherClient() on logout

## Testing

### Test Case 1: Normal Flow
1. Login as Player 1
2. Console should show Pusher connection and subscription success
3. Actions should work normally

### Test Case 2: Logout/Login Cycle
1. Login as Player 1
2. Console: `✅ Pusher subscription successful`
3. Logout
4. Console: `🔌 Disconnecting Pusher client`
5. Login as Player 2 (whose turn it is)
6. Console: `🔌 Initializing Pusher client...` (fresh connection)
7. Console: `✅ Pusher subscription successful`
8. Click "Start Turn"
9. **Mystery boxes should appear immediately**
10. Console: `📨 Received OPTIONS_PREPARED event`

### Test Case 3: Slow Connection
1. Login with throttled network
2. Try to click "Start Turn" immediately
3. Should see: "Connecting to game server, please wait..."
4. Wait for subscription to complete
5. Try again → should work

## Related Documentation

- BUGFIX_LATE_JOIN_STATE_SYNC.md - Previous state sync fixes
- BUGFIX_HOT_RELOAD_RE-INIT.md - Hot reload initialization fix
- BUGFIX_FINAL_HOT_RELOAD_FIX.md - Final hot reload solution

