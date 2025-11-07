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

If using Pusher, all family members can join by opening the same URL on their devices. The draws will sync in real-time!

## How It Works

1. **Setup** - Family structure is pre-configured in `lib/family-config.ts`
2. **Turn Announcement** - Each person's turn is announced with festive narrative prompts
3. **Mystery Selection** - The current player sees 2-5 mystery gift boxes (depending on valid options)
4. **Choice** - Player clicks one mystery box to make their selection
5. **Suspense Build-up** - Dramatic animation sequence:
   - Opening mystery gift...
   - Box opening animation
   - Big reveal with confetti!
6. **Validation** - The app automatically ensures using backtracking algorithm:
   - No one draws themselves
   - No one draws someone in their own clic
   - Every choice leads to a completable game
7. **Pool Tracking** - Sidebar shows remaining available people and who's been drawn
8. **Real-time Sync** - When someone makes a selection, everyone sees it happen simultaneously
9. **Next Turn** - Automatic progression to the next person in the draw order

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add your Pusher environment variables in Vercel project settings
4. Deploy!

Vercel will automatically build and deploy your app. Share the generated URL with your family.

### Environment Variables for Production

In Vercel dashboard, add:
- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`
- `PUSHER_APP_ID`
- `PUSHER_SECRET`

## Project Structure

```
secret-santa/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main game screen
│   └── api/
│       ├── draw/
│       │   ├── route.ts           # Legacy draw endpoint
│       │   ├── options/route.ts   # Prepare selection options
│       │   └── select/route.ts    # Finalize player selection
│       └── state/route.ts         # Game state sync endpoint
├── components/
│   ├── GameBoard.tsx              # Main game orchestrator
│   ├── MysterySelector.tsx        # Interactive gift box selection
│   ├── NarrativePrompt.tsx        # Story-driven turn announcements
│   ├── PoolDisplay.tsx            # Live available/drawn players sidebar
│   ├── RevealAnimation.tsx        # Multi-stage reveal with confetti
│   ├── PlayerCard.tsx             # Individual player status
│   ├── DrawButton.tsx             # Draw action button
│   └── QuickDrawAllButton.tsx     # Auto-complete remaining draws
├── lib/
│   ├── game-logic.ts              # Selection algorithm & backtracking
│   ├── pusher.ts                  # Pusher client/server setup
│   ├── family-config.ts           # Family structure data
│   └── store.ts                   # State management (Zustand)
├── hooks/
│   └── usePusher.ts               # Real-time sync hook
└── types/
    └── index.ts                   # TypeScript interfaces
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

## License

MIT License - feel free to use and modify for your family!
Web-based application for a family secret Santa draw, with special rules for our family annual draw.
