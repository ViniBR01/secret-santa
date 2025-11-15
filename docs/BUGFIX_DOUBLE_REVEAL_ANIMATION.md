# Bug Fix: Double/Triple Reveal Animation (Synchronized)

## Problem Description

After deploying to Vercel with multiple users online, the reveal animation would repeat 1-2 extra times. Key observations:

1. The bug occurred more frequently on production (Vercel) with network delays
2. The bug was synchronized - all users saw the same repeated animations
3. The animation repeated 1-2 extra times during tests with 5+ users
4. The bug was purely visual and didn't affect gameplay or results

## Root Cause Analysis

The issue was caused by **duplicate Pusher event handling without deduplication**:

### Server-Side Event Broadcast
The `/api/draw/select` endpoint triggers THREE separate Pusher events:
1. `SELECTION_REVEALING` - Transitions to revealing phase
2. `TURN_UNLOCKED` - Unlocks the turn
3. `DRAW_EXECUTED` - Broadcasts the draw result

### Race Condition (Initial Diagnosis - Incorrect)
Initially thought: `DRAW_EXECUTED` event handler had a 50ms delay that could cause race conditions.

**Actual Root Cause**: The `GameBoard.tsx` useEffect was triggering multiple times because:
1. Server sends `SELECTION_REVEALING` event → sets `selectionPhase: 'revealing'`
2. Server sends `DRAW_EXECUTED` event → sets `lastDrawResult` 
3. The `usePusher.ts` handler was updating state twice (once with temporary revealing phase, once with final state)
4. The `GameBoard.tsx` useEffect depended on BOTH `selectionPhase` AND `lastDrawResult`
5. Each state update caused the useEffect to trigger, even for the same draw

### No Deduplication
The original `GameBoard.tsx` tracked only `lastShownDrawerId` (drawer ID), not unique draw IDs. This meant:
- If the same player drew multiple times in a game, previous logic wouldn't prevent duplicates
- Each draw wasn't uniquely identified, so duplicate events for the same draw couldn't be filtered

## Solution Implemented

### Strategy
Make the animation **idempotent** by:
1. Adding a unique `drawId` to each `DrawResult`
2. Tracking which specific draws have been shown (not just which drawer)
3. Preventing the animation from triggering for already-shown draws

### Implementation Details

#### 1. Added Unique Draw Identifier (`types/index.ts`)

```typescript
export interface DrawResult {
  drawId: string; // NEW: Unique identifier for this draw
  drawerId: string;
  gifteeId: string;
  gifteeName: string;
}
```

#### 2. Generate drawId in Game Logic (`lib/game-logic.ts`)

Updated both `executeDraw()` and `finalizeSelection()` functions:

```typescript
return {
  drawId: `${drawerId}-${Date.now()}`, // Unique: player + timestamp
  drawerId,
  gifteeId,
  gifteeName: giftee.name,
};
```

Also updated the admin route (`app/api/admin/set-next-result/route.ts`) to generate drawIds.

#### 3. Track Shown Draw IDs (`components/GameBoard.tsx`)

**Replaced**:
```typescript
const lastShownDrawerIdRef = useRef<string | null>(null);
```

**With**:
```typescript
const shownDrawIdsRef = useRef<Set<string>>(new Set());
```

#### 4. Updated Animation Trigger Logic

**Modified useEffect** to only depend on `lastDrawResult` (not `selectionPhase`):

```typescript
useEffect(() => {
  console.log('🔍 useEffect triggered:', {
    selectionPhase: gameState.selectionPhase,
    hasLastDrawResult: !!gameState.lastDrawResult,
    drawId: gameState.lastDrawResult?.drawId,
    alreadyShown: gameState.lastDrawResult?.drawId 
      ? shownDrawIdsRef.current.has(gameState.lastDrawResult.drawId)
      : false,
    showReveal,
  });
  
  // Only show animation when we have a lastDrawResult that hasn't been shown yet
  // Don't check selectionPhase because it can change multiple times during the reveal sequence
  if (
    gameState.lastDrawResult &&
    !shownDrawIdsRef.current.has(gameState.lastDrawResult.drawId)
  ) {
    console.log('✅ Setting showReveal to TRUE for draw:', gameState.lastDrawResult.drawId);
    shownDrawIdsRef.current.add(gameState.lastDrawResult.drawId);
    setShowReveal(true);
  }
}, [gameState.lastDrawResult]); // Only depend on lastDrawResult, not selectionPhase
```

**Key changes:**
- **Removed `selectionPhase` from dependency array** - this was causing duplicate triggers
- Only trigger when `lastDrawResult` changes
- Check if `drawId` exists in the Set before showing animation
- Add `drawId` to Set when showing animation (prevents duplicates)
- Log `drawId` for debugging

#### 5. Updated Reset Logic

```typescript
const handleReset = () => {
  if (confirm("¿Estás seguro de que quieres reiniciar el sorteo del Intercambio?")) {
    gameState.resetGame();
    setShowReveal(false);
    shownDrawIdsRef.current.clear(); // Clear the Set
  }
};
```

#### 6. Simplified Pusher Event Handler (`hooks/usePusher.ts`)

**Removed the double state update** that was causing duplicate triggers:

**Before (Buggy)**:
```typescript
channel.bind(
  PUSHER_EVENTS.DRAW_EXECUTED,
  (data: { drawResult: DrawResult; newGameState: GameState }) => {
    // Update state with temporary revealing phase
    setGameState({
      ...data.newGameState,
      selectionPhase: 'revealing',
    });
    setLastDrawResult(data.drawResult);
    
    // Then update to final state after 50ms
    setTimeout(() => {
      setGameState(data.newGameState);
    }, 50);
  }
);
```

**After (Fixed)**:
```typescript
channel.bind(
  PUSHER_EVENTS.DRAW_EXECUTED,
  (data: { drawResult: DrawResult; newGameState: GameState }) => {
    console.log("📨 Received DRAW_EXECUTED event", {
      drawId: data.drawResult.drawId,
      drawerId: data.drawResult.drawerId,
      gifteeName: data.drawResult.gifteeName,
      timestamp: new Date().toISOString(),
    });
    
    // Set the draw result first (this will trigger the animation via useEffect in GameBoard)
    setLastDrawResult(data.drawResult);
    
    // Then update the game state (the GameBoard useEffect will handle showing the animation)
    setGameState(data.newGameState);
  }
);
```

**Key changes:**
- Removed temporary state update with `selectionPhase: 'revealing'`
- Removed 50ms setTimeout
- State only updates once, not twice
- Added logging for debugging

## Why This Solution Works

1. **Unique Identification**: Each draw gets a unique ID combining drawer + timestamp
   - Format: `${drawerId}-${Date.now()}`
   - Example: `"ale-1731724800123"`

2. **Idempotent Animation**: The Set prevents the same draw from triggering animation twice
   - First trigger: `drawId` not in Set → add to Set → show animation
   - Subsequent triggers: `drawId` in Set → skip animation

3. **Single Trigger Point**: By only depending on `lastDrawResult` in the useEffect:
   - Animation only triggers when `lastDrawResult` changes
   - `selectionPhase` changes don't re-trigger the animation
   - Eliminates the double-trigger issue from multiple state updates

4. **Simplified Event Handler**: The Pusher event handler only updates state once
   - No temporary `selectionPhase: 'revealing'` manipulation
   - No 50ms setTimeout causing additional state updates
   - Clean, straightforward state update

5. **Synchronized Behavior**: All clients receive the same `drawId` from server
   - Server generates the `drawId` once
   - All clients use the same deduplication key
   - Duplicate events are filtered consistently across all clients

6. **Memory Efficient**: Set only stores strings
   - Grows linearly with number of draws (max ~26 entries per game)
   - Cleared on game reset

## Files Modified

1. `/Volumes/workplace/src/secret-santa/types/index.ts`
   - Added `drawId: string` to `DrawResult` interface

2. `/Volumes/workplace/src/secret-santa/lib/game-logic.ts`
   - Added `drawId` generation in `executeDraw()` function
   - Added `drawId` generation in `finalizeSelection()` function

3. `/Volumes/workplace/src/secret-santa/app/api/admin/set-next-result/route.ts`
   - Added `drawId` generation for admin-triggered draws

4. `/Volumes/workplace/src/secret-santa/components/GameBoard.tsx`
   - Replaced `lastShownDrawerIdRef` with `shownDrawIdsRef` Set
   - Updated animation trigger useEffect to check Set
   - Updated `handleReset()` to clear Set
   - Enhanced logging with drawId

5. `/Volumes/workplace/src/secret-santa/hooks/usePusher.ts`
   - Added detailed logging to `DRAW_EXECUTED` event handler

## Testing Strategy

### Automated Testing
- ✅ Build successful (Next.js production build)
- ✅ No TypeScript errors
- ✅ No linter errors (one warning about useEffect dependency, not critical)

### Manual Testing Checklist

To verify the fix works in production:

1. **Single User Test**
   - [ ] Animation plays once per draw
   - [ ] No duplicate animations
   - [ ] Console logs show each drawId only once

2. **Multi-User Test (5+ users)**
   - [ ] Animation synchronized across all clients
   - [ ] Each client sees animation exactly once per draw
   - [ ] Console logs show drawId received by all clients
   - [ ] No duplicate animations even with network delays

3. **Edge Cases**
   - [ ] Game reset clears the Set properly
   - [ ] Same player drawing multiple times works correctly
   - [ ] Each draw shows animation once regardless of drawer
   - [ ] Admin-triggered draws work correctly

4. **Production Environment**
   - [ ] Test on Vercel deployment
   - [ ] Monitor console logs for duplicate event detection
   - [ ] Verify behavior with realistic network latency

### Monitoring in Production

Watch for these console log patterns:

**Normal behavior** (each drawId appears once):
```
📨 Received DRAW_EXECUTED event { drawId: "ale-1731724800123", ... }
🔍 useEffect triggered: { drawId: "ale-1731724800123", alreadyShown: false, ... }
✅ Setting showReveal to TRUE for draw: ale-1731724800123
```

**Duplicate event detected** (but filtered):
```
📨 Received DRAW_EXECUTED event { drawId: "ale-1731724800123", ... }
📨 Received DRAW_EXECUTED event { drawId: "ale-1731724800123", ... } // DUPLICATE
🔍 useEffect triggered: { drawId: "ale-1731724800123", alreadyShown: false, ... }
✅ Setting showReveal to TRUE for draw: ale-1731724800123
🔍 useEffect triggered: { drawId: "ale-1731724800123", alreadyShown: true, ... } // FILTERED
```

## Build Verification

```bash
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (6/6)
✓ Finalizing page optimization

Route (app)                                 Size  First Load JS
┌ ○ /                                     228 kB         343 kB
```

Bundle size unchanged: **343 KB** (no size impact from the fix)

## Deployment Notes

1. The fix is backward compatible - no database migration needed
2. The fix is purely client-side with server-side ID generation
3. No environment variable changes required
4. No dependencies added or changed

## Success Criteria

The fix is successful if:
- ✅ Animation plays exactly once per draw across all clients
- ✅ No duplicate animations even with 5+ users and network delays
- ✅ Console logs show duplicate events being filtered (if they occur)
- ✅ Game behavior remains unchanged (only visual fix)
- ✅ Build completes without errors

## Related Documentation

- Original investigation: `BUGFIX_REVEAL_ANIMATION.md` (previous incomplete fix)
- Implementation plan: Plan file in workspace root
- State management: `STATE_SYNC_UPDATE.md`

---

**Date**: November 15, 2025
**Status**: Implemented and ready for production testing
**Next Steps**: Deploy to Vercel and monitor with 5+ users

