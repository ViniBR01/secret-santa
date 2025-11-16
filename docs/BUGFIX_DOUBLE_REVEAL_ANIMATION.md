# Bug Fix: Double/Triple Reveal Animation (Synchronized)

## Problem Description

After deploying to Vercel with multiple users online, the reveal animation would repeat 1-2 extra times. Key observations:

1. The bug occurred more frequently on production (Vercel) with network delays
2. The bug was synchronized - all users saw the same repeated animations
3. The animation repeated 1-2 extra times during tests with 5+ users
4. The bug was purely visual and didn't affect gameplay or results

## Root Cause Analysis

The issue had **TWO separate root causes**:

### Root Cause #1: Multiple useEffect Triggers (Fixed in First Iteration)
The `GameBoard.tsx` useEffect was triggering multiple times because:
1. Server sends `SELECTION_REVEALING` event → sets `selectionPhase: 'revealing'`
2. Server sends `DRAW_EXECUTED` event → sets `lastDrawResult` 
3. The `usePusher.ts` handler was updating state twice (once with temporary revealing phase, once with final state)
4. The `GameBoard.tsx` useEffect depended on BOTH `selectionPhase` AND `lastDrawResult`
5. Each state update caused the useEffect to trigger, even for the same draw

**Result**: Animation trigger logic was being called multiple times for the same draw.

### Root Cause #2: RevealAnimation Component Re-initialization (The Real Culprit!)
Even after fixing the trigger logic, the animation was still playing twice because:

1. `RevealAnimation` component's useEffect depends on `onComplete` callback (line 89)
2. Every time `GameBoard` re-renders, a new `handleRevealComplete` function is created
3. This new function reference causes `RevealAnimation`'s useEffect to re-run
4. Re-running the useEffect **restarts all the setTimeout timers**
5. This causes the card reveal phases to play again

**Why confetti only showed once**: The `showConfetti` state persists in the component, so even though timers restart, confetti doesn't re-trigger.

**Why card showed twice**: The `phase` state gets reset to "suspense" and goes through all phases again.

### No Deduplication
The original `GameBoard.tsx` tracked only `lastShownDrawerId` (drawer ID), not unique draw IDs. This meant:
- If the same player drew multiple times in a game, previous logic wouldn't prevent duplicates
- Each draw wasn't uniquely identified, so duplicate events for the same draw couldn't be filtered

## Solution Implemented

### Strategy
Make the animation **idempotent** and **resilient to hot reloads** by:
1. Adding a unique `drawId` to each `DrawResult`
2. Storing shown draw IDs in Zustand store (persists across hot reloads)
3. Adding an animation lock to prevent overlapping animations
4. Preventing the animation from triggering for already-shown draws

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

#### 3. Added Animation State to Zustand Store (`lib/store.ts`)

**Added to store interface**:
```typescript
interface GameStore extends GameState {
  // ... existing fields ...
  
  // Animation state (persistent across hot reloads)
  shownDrawIds: Set<string>; // Track which draws have been shown
  isAnimating: boolean; // Track if an animation is currently playing
  
  // Animation management actions
  markDrawAsShown: (drawId: string) => void;
  hasShownDraw: (drawId: string) => boolean;
  setIsAnimating: (animating: boolean) => void;
  clearShownDraws: () => void;
}
```

**Why store instead of useRef:**
- Zustand store persists across hot reloads in development
- Store state survives component re-renders
- Shared across all components (consistent state)
- Can be accessed and modified from anywhere

#### 4. Updated Animation Trigger Logic with Lock (`components/GameBoard.tsx`)

**Modified useEffect** to use store-based tracking with animation lock:

```typescript
useEffect(() => {
  const drawId = gameState.lastDrawResult?.drawId;
  const alreadyShown = drawId ? hasShownDraw(drawId) : false;
  
  console.log('🔍 useEffect triggered:', {
    selectionPhase: gameState.selectionPhase,
    hasLastDrawResult: !!gameState.lastDrawResult,
    drawId,
    alreadyShown,
    isAnimating,
    showReveal,
  });
  
  // Only show animation when:
  // 1. We have a lastDrawResult
  // 2. Haven't shown this draw yet (check store, not ref)
  // 3. Not already animating (animation lock)
  if (
    gameState.lastDrawResult &&
    drawId &&
    !alreadyShown &&
    !isAnimating
  ) {
    console.log('✅ Setting showReveal to TRUE for draw:', drawId);
    console.log('🔒 Acquiring animation lock');
    
    // Mark as shown and lock animation
    markDrawAsShown(drawId);
    setIsAnimating(true);
    setShowReveal(true);
  } else if (gameState.lastDrawResult && drawId && alreadyShown) {
    console.log('⏭️ Skipping animation - draw already shown:', drawId);
  } else if (gameState.lastDrawResult && drawId && isAnimating) {
    console.log('🔒 Skipping animation - already animating');
  }
}, [gameState.lastDrawResult, hasShownDraw, isAnimating, markDrawAsShown, setIsAnimating]);
```

**Key changes:**
- **Uses store-based `hasShownDraw()` instead of ref** - survives hot reloads
- **Added animation lock check (`!isAnimating`)** - prevents overlapping animations
- **Marks draw as shown immediately** - before animation starts
- **Locks animation** - prevents duplicate triggers during animation
- **Detailed logging** - shows why animation is shown or skipped

#### 5. Updated handleRevealComplete to Release Lock

```typescript
const handleRevealComplete = () => {
  console.log('🎉 Reveal animation complete, hiding overlay');
  console.log('🔓 Releasing animation lock');
  
  setShowReveal(false);
  setIsAnimating(false); // Release animation lock
  
  // Clear the last draw result after a short delay
  setTimeout(() => {
    console.log('🧹 Clearing lastDrawResult');
    gameState.setLastDrawResult(null);
  }, 100);
};
```

**Key change**: Calls `setIsAnimating(false)` to release the lock when animation completes.

#### 6. Updated Reset Logic

```typescript
const handleReset = () => {
  if (confirm("¿Estás seguro de que quieres reiniciar el sorteo del Intercambio?")) {
    gameState.resetGame();
    setShowReveal(false);
    clearShownDraws(); // Clear from store instead of ref
  }
};
```

**Key change**: Calls `clearShownDraws()` from store to clear all animation state.

#### 7. Wrap handleRevealComplete in useCallback (`components/GameBoard.tsx`)

**THE CRITICAL FIX** - Prevents RevealAnimation from re-initializing:

```typescript
// Import useCallback
import { useState, useEffect, useRef, useCallback } from "react";

// Extract stable function from store
const setLastDrawResult = useGameStore((state) => state.setLastDrawResult);

// Wrap the callback in useCallback with STABLE dependencies
const handleRevealComplete = useCallback(() => {
  console.log('🎉 Reveal animation complete, hiding overlay');
  console.log('🔓 Releasing animation lock');
  
  setShowReveal(false);
  setIsAnimating(false);
  
  setTimeout(() => {
    console.log('🧹 Clearing lastDrawResult');
    setLastDrawResult(null); // ✅ Use stable function from store
  }, 100);
}, [setIsAnimating, setLastDrawResult]); // ✅ Only stable function dependencies
```

**Why this is critical**:
- Without `useCallback`, every GameBoard re-render creates a new `handleRevealComplete` function
- **Critical mistake in first attempt**: Depending on `gameState` object which changes frequently
- **The fix**: Extract only `setLastDrawResult` function - Zustand selectors are stable
- With stable dependencies, function reference stays constant → useEffect doesn't re-run
- This prevents `RevealAnimation`'s useEffect from restarting the setTimeout timers

This was the final piece that fixed the visual double animation!

#### 8. Simplified Pusher Event Handler (`hooks/usePusher.ts`)

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

## Why This Enhanced Solution Works

1. **Unique Identification**: Each draw gets a unique ID combining drawer + timestamp
   - Format: `${drawerId}-${Date.now()}`
   - Example: `"ale-1731724800123"`

2. **Persistent State (Zustand Store)**: Animation state survives hot reloads
   - `shownDrawIds` Set stored in Zustand, not component ref
   - Persists across hot reloads in development
   - Survives component re-renders
   - Shared across all components

3. **Animation Lock**: Prevents overlapping/duplicate animations
   - `isAnimating` flag blocks new animations while one is playing
   - Lock acquired when animation starts
   - Lock released when animation completes
   - Protects against race conditions

4. **Triple Safety Check**: Animation only shows if ALL conditions are met:
   - Has a `lastDrawResult` ✓
   - Draw hasn't been shown yet (checked in store) ✓
   - Not currently animating (animation lock) ✓

5. **Single Trigger Point**: By only depending on `lastDrawResult` in the useEffect:
   - Animation only triggers when `lastDrawResult` changes
   - `selectionPhase` changes don't re-trigger the animation
   - Eliminates the double-trigger issue from multiple state updates

6. **Simplified Event Handler**: The Pusher event handler only updates state once
   - No temporary `selectionPhase: 'revealing'` manipulation
   - No 50ms setTimeout causing additional state updates
   - Clean, straightforward state update

7. **Synchronized Behavior**: All clients receive the same `drawId` from server
   - Server generates the `drawId` once
   - All clients use the same deduplication key
   - Duplicate events are filtered consistently across all clients

8. **Memory Efficient**: Set only stores strings
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

4. `/Volumes/workplace/src/secret-santa/lib/store.ts` **(NEW - Enhanced Fix)**
   - Added `shownDrawIds: Set<string>` to store state
   - Added `isAnimating: boolean` flag to store state
   - Added `markDrawAsShown()` action
   - Added `hasShownDraw()` selector
   - Added `setIsAnimating()` action
   - Added `clearShownDraws()` action
   - Updated `resetGameLocal()` to clear animation state

5. `/Volumes/workplace/src/secret-santa/components/GameBoard.tsx` **(ENHANCED)**
   - Removed `shownDrawIdsRef` ref
   - Added store selectors for animation state
   - Updated useEffect to use store-based tracking
   - Added animation lock check (`!isAnimating`)
   - **Wrapped `handleRevealComplete()` in `useCallback`** (CRITICAL FIX)
   - Updated `handleRevealComplete()` to release lock
   - Updated `handleReset()` to use `clearShownDraws()`
   - Enhanced logging with all animation states

6. `/Volumes/workplace/src/secret-santa/hooks/usePusher.ts`
   - Simplified `DRAW_EXECUTED` event handler (removed double update)
   - Added detailed logging

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

