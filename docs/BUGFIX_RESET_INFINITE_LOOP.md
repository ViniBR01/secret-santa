# Bug Fix: Reset Button Infinite Loop

## Problem

When the admin clicked the "Reset Game" button, the entire application would freeze, with hundreds of rapid-fire `DELETE /api/state` requests flooding the server. The logs showed:

```
DELETE /api/state 200 in 109ms    (admin - success)
DELETE /api/state 403 in 20ms     (player - forbidden)
DELETE /api/state 200 in 109ms    (admin - success)
DELETE /api/state 403 in 22ms     (player - forbidden)
... (repeating hundreds of times)
```

This created an infinite loop that overwhelmed the server and froze all client browsers.

## Root Cause

The issue was a **circular event loop** in the reset mechanism:

1. Admin clicks "Reset Game" → `resetGame()` in store sends `DELETE /api/state`
2. Server receives DELETE → resets state → broadcasts `GAME_RESET` Pusher event to **all clients**
3. **Every client** (admin + all players) receives `GAME_RESET` event
4. Each client's Pusher handler calls `resetGame()` again
5. Each `resetGame()` call sends another `DELETE /api/state` request
6. Server broadcasts more `GAME_RESET` events
7. → Infinite loop

The problem was that the Pusher event handler for `GAME_RESET` was calling the same `resetGame()` function that also triggered the API call. This created a broadcast storm where each broadcast triggered new broadcasts.

### Why Players Got 403 Errors

Players don't have admin privileges, so their `DELETE /api/state` requests were rejected with 403 Forbidden. However, they were still sending these requests in the infinite loop, adding to the server load.

## Solution

Separated the reset logic into two distinct functions:

### 1. Local Reset Function (`resetGameLocal()`)

```typescript
resetGameLocal: () => {
  console.log("🔄 Resetting game state locally...");
  const initialState = initializeGame();
  set({
    ...initialState,
    lastDrawResult: null,
    error: null,
    isGameReady: true,
  });
}
```

This function **only** resets the local Zustand store state, without any API calls.

### 2. Server-Broadcast Reset Function (`resetGame()`)

```typescript
resetGame: async () => {
  try {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const usePusher = pusherKey && pusherKey !== "your_pusher_key_here";

    if (usePusher) {
      // Call API endpoint to broadcast reset
      console.log("📡 Calling DELETE /api/state to broadcast reset...");
      await fetch("/api/state", { method: "DELETE" });
      // DON'T reset locally here - wait for GAME_RESET event from Pusher
      console.log("✅ Reset broadcasted, waiting for Pusher event...");
    } else {
      // No Pusher, reset locally only
      get().resetGameLocal();
    }
  } catch (error) {
    console.error("Error resetting game:", error);
    get().resetGameLocal();
  }
}
```

This function:
- Sends the `DELETE /api/state` request to trigger the server broadcast
- **Does NOT reset local state** when using Pusher (waits for the broadcast)
- Only resets locally if Pusher is not configured or if the API call fails

### 3. Updated Pusher Handler

```typescript
// Listen for game reset events
channel.bind(PUSHER_EVENTS.GAME_RESET, () => {
  console.log("📨 Received GAME_RESET event - resetting locally");
  resetGameLocal(); // Changed from resetGame() to resetGameLocal()
});
```

The Pusher event handler now calls `resetGameLocal()` instead of `resetGame()`, which:
- Resets the local state
- **Does NOT send another API request**
- Breaks the infinite loop

## Flow After Fix

### Successful Reset Flow

1. Admin clicks "Reset Game" → calls `resetGame()`
2. `resetGame()` sends ONE `DELETE /api/state` request
3. Server broadcasts ONE `GAME_RESET` event to all clients
4. Each client receives event → calls `resetGameLocal()`
5. Each client resets their local state
6. ✅ Done - no additional API calls, no loop

### Fallback for Non-Pusher Environment

If Pusher is not configured:
1. Admin clicks "Reset Game" → calls `resetGame()`
2. `resetGame()` detects no Pusher → calls `resetGameLocal()` directly
3. ✅ Local state reset without any API calls

### Error Recovery

If the DELETE request fails:
1. Admin clicks "Reset Game" → calls `resetGame()`
2. API call fails (network error, etc.)
3. Catch block → calls `resetGameLocal()`
4. ✅ At least the admin's local state is reset

## Files Modified

1. **`lib/store.ts`**
   - Split `resetGame()` into two functions
   - Updated interface to include both functions

2. **`hooks/usePusher.ts`**
   - Changed `GAME_RESET` handler to call `resetGameLocal()`
   - Updated dependency array in useEffect

## Testing

To verify the fix:
1. Start the app with multiple clients connected
2. Play through a game
3. Click "Reset Game" as admin
4. Check server logs - should see only ONE DELETE request per reset
5. Verify all clients successfully reset their state
6. No frozen browsers, no infinite loops

## Key Insight

**Broadcast events should never trigger actions that create more broadcasts.** When handling a Pusher event that synchronizes state across clients, the handler should only update local state, never trigger new API calls that would broadcast again.

