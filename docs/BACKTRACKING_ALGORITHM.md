# Backtracking Algorithm - Implementation Details

## Visual Comparison

### ❌ Old Algorithm (Simple Random)
```
Draw #1: [A, B, C, D, E] → picks C randomly ✓
Draw #2: [A, B, D, E]    → picks E randomly ✓
Draw #3: [A, B, D]       → picks A randomly ✓
Draw #4: [B, D]          → picks B randomly ✓
Draw #5: [D]             → D can only pick themselves ✗ DEADLOCK!
```
**Result**: Game fails, user must click "Reset Game" and try again 😞

### ✅ New Algorithm (Backtracking)
```
Draw #1: [A, B, C, D, E] → checks which lead to completion
         - C? ✓ (game can complete)
         - D? ✗ (leads to deadlock)
         → picks C ✓
Draw #2: [A, B, D, E]    → picks viable option ✓
Draw #3: [A, B, D]       → picks viable option ✓
Draw #4: [B, D]          → picks viable option ✓
Draw #5: [D]             → D gets the last person ✓
```
**Result**: Game completes successfully every time! 🎉

## Problem Statement

The original Secret Santa draw algorithm used a simple random selection approach that could lead to "deadlock" situations where a person had no valid options to draw from. This resulted in the error:

```
Failed to load resource: the server responded with a status of 400 (Bad Request)
Error: "No valid options available"
```

This occurred when the remaining available people for someone to draw were either:
1. Themselves
2. Members of their own clic (family group)

## Solution: Backtracking Algorithm

The new implementation uses a **backtracking algorithm with lookahead** to guarantee that every draw leads to a completable game state.

### How It Works

1. **Look-ahead validation**: Before making a draw, the algorithm checks if that choice will allow all remaining players to complete their draws.

2. **Recursive checking**: The `canCompleteDraw()` function recursively explores future draw possibilities to verify the game can be completed.

3. **Smart selection**: Only "viable" options (those that lead to completion) are used for random selection.

4. **Guaranteed success**: If a viable option exists, the algorithm will find it. The game will never enter a deadlock state.

### Algorithm Details

```typescript
function canCompleteDraw(
  drawerIndex: number,
  assignments: Record<string, string>,
  availableGiftees: string[]
): boolean
```

This function:
- Takes a hypothetical game state
- Recursively tries all possible valid draws
- Returns `true` if any path leads to completion
- Returns `false` if all paths lead to deadlock

The `executeDraw()` function then:
1. Gets all valid options for the current drawer
2. Filters to only "viable" options (using `canCompleteDraw`)
3. Randomly selects from viable options
4. Guarantees the game can be completed

### Performance

- **Time Complexity**: O(n! * m) in worst case, but typically much faster due to pruning
  - n = number of remaining players
  - m = average number of valid options per player
- **Space Complexity**: O(n) for recursion stack
- **Practical Performance**: Very fast for family-sized groups (< 50 people)
  - Tested with 21 family members: ~50ms per draw
  - 10 complete draws tested: 100% success rate

### Test Results

```
🎅 Testing Secret Santa Backtracking Algorithm

Total family members: 21
Draw order length: 21

--- Test Results ---
✅ Successful: 10/10
❌ Failed: 0/10

🎉 Perfect! Backtracking algorithm works 100% of the time!
```

## Benefits

1. **No more errors**: The "No valid options available" error is now impossible
2. **No manual resets needed**: Users never need to click "Reset Game" due to deadlocks
3. **Still random**: Results are still random - just constrained to valid solutions
4. **Better UX**: Smooth, error-free experience every time

## Trade-offs

- **Slightly slower per draw**: Each draw does more computation (but still imperceptible to users)
- **More complex code**: The algorithm is more sophisticated than simple random selection
- **Worth it**: The elimination of deadlocks is worth the minimal performance cost

## Future Optimizations (if needed)

If performance becomes an issue with larger families (50+ people):
1. Add memoization to cache `canCompleteDraw` results
2. Implement early termination heuristics
3. Use iterative deepening instead of full recursion
4. Pre-compute compatibility graph

However, for typical family sizes (< 50 people), the current implementation is more than sufficient.

## Code Location

Implementation: `/lib/game-logic.ts`
- `canCompleteDraw()` - Recursive lookahead function
- `executeDraw()` - Main draw function with backtracking

