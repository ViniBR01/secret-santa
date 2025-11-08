# Secret Santa - Family Gift Exchange

A modern web application to automate your family Secret Santa gift exchange with real-time synchronization across devices.

## Features

- ✅ **Interactive Mystery Selection** - Players choose from mystery gift boxes without knowing who's inside
- ✅ **Pre-configured family structure** - Define family members and clics (family units)
- ✅ **Real-time updates** - All participants see draws happen live (with Pusher)
- ✅ **Automatic validation** - No self-draws, no drawing within your own clic with backtracking algorithm
- ✅ **Sequential draws** - Pre-defined order with narrative prompts and visual feedback
- ✅ **Dramatic reveals** - Multi-stage suspense animations with confetti celebration
- ✅ **Live pool display** - See who's still available and who's been drawn in real-time
- ✅ **Mobile-friendly** - Beautiful responsive UI optimized for all devices
- ✅ **Local-only mode** - Works without Pusher configuration for single-device use
- ✅ **Role-based access control** - Admin and player roles with session management
- ✅ **Turn locking** - Only the current drawer can make selections (server-side validation)
- ✅ **Connection tracking** - See which players are online/offline in real-time
- ✅ **Admin controls** - Skip turns, draw for absent players, and full game management

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Your Family (Required)

Edit `lib/family-config.ts` to set up your family structure:

```typescript
export const familyConfig: FamilyConfig = {
  clics: [
    { id: "clic1", name: "Family Unit 1", memberIds: ["alice", "bob"] },
    { id: "clic2", name: "Family Unit 2", memberIds: ["charlie", "diana"] },
    // Add more clics as needed
  ],
  members: [
    { id: "alice", name: "Alice", clicId: "clic1" },
    { id: "bob", name: "Bob", clicId: "clic1" },
    // Add all family members
  ],
  drawOrder: ["alice", "bob", "charlie", "diana"],
};
```

### 3. Configure Pusher (Optional - for Multi-Device Sync)

If you want real-time synchronization across multiple devices:

1. Create a free account at [Pusher](https://pusher.com)
2. Create a new Channels app
3. Copy `.env.example` to `.env.local`
4. Fill in your Pusher credentials

```bash
cp .env.example .env.local
```

**Note:** If you skip this step, the app will work in local-only mode (perfect for a single device).

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Share with Family

**For Admin:**
- Access the game with the admin URL: `http://localhost:3000?admin=<your-secret-code>`
- Replace `<your-secret-code>` with your `ADMIN_SECRET_CODE` from `.env.local`
- You'll have full control and see the admin panel

**For Players:**
- Share the regular URL: `http://localhost:3000`
- Players select their name on the landing page
- They can only interact during their turn
- All players see real-time updates

If using Pusher, all family members can join on their own devices and everything syncs in real-time!

## How It Works

1. **Player Login** - Each family member selects their name on the landing page
2. **Admin Access** - Admin joins via URL with secret code for full control
3. **Turn Announcement** - Each person's turn is announced with festive narrative prompts
4. **Turn Control** - Only the current drawer (or admin) can start their turn
5. **Mystery Selection** - The current player sees 2-5 mystery gift boxes (depending on valid options)
6. **Choice** - Player clicks one mystery box to make their selection (server validates it's their turn)
7. **Suspense Build-up** - Dramatic animation sequence:
   - Opening mystery gift...
   - Box opening animation
   - Big reveal with confetti!
8. **Validation** - The app automatically ensures using backtracking algorithm:
   - No one draws themselves
   - No one draws someone in their own clic
   - Every choice leads to a completable game
   - Server-side validation prevents unauthorized actions
9. **Pool Tracking** - Sidebar shows remaining available people and who's been drawn
10. **Real-time Sync** - When someone makes a selection, everyone sees it happen simultaneously
11. **Connection Status** - Admin sees which players are online/offline
12. **Admin Controls** - Admin can skip turns or draw for absent players if needed
13. **Next Turn** - Automatic progression to the next person in the draw order

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add your Pusher environment variables in Vercel project settings
4. Deploy!

Vercel will automatically build and deploy your app. Share the generated URL with your family.

### Environment Variables for Production

In Vercel dashboard, add:
- `NEXT_PUBLIC_PUSHER_KEY` - Your Pusher app key
- `NEXT_PUBLIC_PUSHER_CLUSTER` - Your Pusher cluster (e.g., us2)
- `PUSHER_APP_ID` - Your Pusher app ID
- `PUSHER_SECRET` - Your Pusher secret key
- `ADMIN_SECRET_CODE` - Your secret code for admin access (e.g., family-secret-2025)

## Project Structure

```
secret-santa/
├── app/
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Main game screen with session check
│   ├── identify/page.tsx                 # Player identity selection page
│   └── api/
│       ├── session/
│       │   ├── identify/route.ts         # Player login
│       │   ├── admin/route.ts            # Admin login
│       │   ├── status/route.ts           # Check session
│       │   ├── logout/route.ts           # Logout
│       │   └── heartbeat/route.ts        # Connection tracking
│       ├── draw/
│       │   ├── options/route.ts          # Prepare selection options (authenticated)
│       │   └── select/route.ts           # Finalize player selection (authenticated)
│       ├── admin/
│       │   ├── skip-turn/route.ts        # Skip player's turn
│       │   └── draw-for-player/route.ts  # Draw for absent player
│       └── state/route.ts                # Game state sync endpoint
├── components/
│   ├── GameBoard.tsx                     # Main game orchestrator with role logic
│   ├── MysterySelector.tsx               # Interactive gift box selection
│   ├── NarrativePrompt.tsx               # Story-driven turn announcements
│   ├── WaitingForTurn.tsx                # Waiting state for non-current players
│   ├── YourTurnNotification.tsx          # Turn notification for current drawer
│   ├── AdminPanel.tsx                    # Admin control panel (floating)
│   ├── AdminDrawForPlayer.tsx            # Admin draw dialog
│   ├── PlayerConnectionStatus.tsx        # Online/offline player status
│   ├── PoolDisplay.tsx                   # Live available/drawn players sidebar
│   ├── RevealAnimation.tsx               # Multi-stage reveal with confetti
│   ├── PlayerCard.tsx                    # Individual player status
│   └── ResultsDisplay.tsx                # Final results display
├── lib/
│   ├── game-logic.ts                     # Selection algorithm & backtracking
│   ├── session.ts                        # Session validation & cookie handling
│   ├── pusher.ts                         # Pusher client/server setup
│   ├── family-config.ts                  # Family structure data
│   └── store.ts                          # State management (Zustand)
├── hooks/
│   ├── usePusher.ts                      # Real-time sync hook
│   └── useHeartbeat.ts                   # Connection heartbeat hook
└── types/
    └── index.ts                          # TypeScript interfaces
```

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Advanced animations and transitions
- **Zustand** - State management
- **Pusher** - Real-time WebSocket communication
- **Vercel** - Hosting platform

## Customization

### Change the Theme

Edit `app/globals.css` to customize colors and animations.

### Modify Draw Logic

Edit `lib/game-logic.ts` to change validation rules or draw algorithm.

### Add More Features

See `PLAN.md` for future enhancement ideas!

## Troubleshooting

**Q: The app won't start**
- Make sure you ran `npm install`
- Check that Node.js version is 18+ (`node --version`)

**Q: Draws aren't syncing across devices**
- Verify Pusher credentials in `.env.local`
- Check browser console for errors
- Ensure all devices are on the same app URL

**Q: Getting "No valid options" error**
- This should rarely happen due to the backtracking algorithm
- If it does occur, click "Reset Game" to restart
- The algorithm ensures only choices that lead to a complete game are presented

**Q: How many options will each person see?**
- The number varies (typically 2-5 mystery boxes)
- Only valid choices that guarantee a completable game are shown
- Later in the draw order, fewer options may be available

**Q: Can players see who's in each box?**
- No! That's the mystery element
- Players only see numbered gift boxes
- They can see the list of remaining people in the sidebar, but not which box contains whom

**Q: How do I access the admin panel?**
- Add `?admin=<your-secret-code>` to the URL
- Example: `http://localhost:3000?admin=family-secret-2025`
- Use the secret code from your `ADMIN_SECRET_CODE` environment variable
- Admin sees a floating purple panel in the bottom-right

**Q: What happens if a player disconnects?**
- Their status shows as offline in the admin panel
- Admin can skip their turn or draw for them using admin controls
- When they reconnect, they'll see the updated game state

**Q: Can someone cheat and select when it's not their turn?**
- No! Server-side validation prevents unauthorized actions
- Only the current drawer (or admin) can make selections
- Attempts to act out of turn are rejected with a 403 error

**Q: How does the admin "Draw for Player" feature work?**
- Click the "Draw for Player" button in the admin panel during selection phase
- Select one of the mystery boxes on behalf of the absent player
- The selection is made as if the player did it themselves
- Everyone sees the reveal animation normally

## License

MIT License - feel free to use and modify for your family!
Web-based application for a family secret Santa draw, with special rules for our family annual draw.
