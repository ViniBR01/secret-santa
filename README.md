# Secret Santa - Family Gift Exchange

A modern web application to automate your family Secret Santa gift exchange with real-time synchronization across devices.

## Features

- ✅ **Pre-configured family structure** - Define family members and clics (family units)
- ✅ **Real-time updates** - All participants see draws happen live (with Pusher)
- ✅ **Automatic validation** - No self-draws, no drawing within your own clic
- ✅ **Sequential draws** - Pre-defined order with visual feedback
- ✅ **Mobile-friendly** - Beautiful responsive UI with celebration animations
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
2. **Draw Order** - Each person draws in the pre-defined order
3. **Validation** - The app automatically ensures:
   - No one draws themselves
   - No one draws someone in their own clic
4. **Real-time Sync** - When someone draws, everyone sees it happen simultaneously
5. **Celebration** - Beautiful animations celebrate each draw

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
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main game screen
│   └── api/
│       ├── draw/route.ts    # Execute draw endpoint
│       └── state/route.ts   # Game state sync endpoint
├── components/
│   ├── GameBoard.tsx        # Main game display
│   ├── PlayerCard.tsx       # Individual player status
│   ├── DrawButton.tsx       # Draw action button
│   └── RevealAnimation.tsx  # Name reveal effect
├── lib/
│   ├── game-logic.ts        # Draw algorithm & validation
│   ├── pusher.ts            # Pusher client/server setup
│   ├── family-config.ts     # Family structure data
│   └── store.ts             # State management (Zustand)
└── types/
    └── index.ts             # TypeScript interfaces
```

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
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
- This happens if the random draw order makes it impossible to complete
- Click "Reset Game" to restart with a new random sequence
- Consider adjusting your clic configuration if this happens frequently

## License

MIT License - feel free to use and modify for your family!
Web-based application for a family secret Santa draw, with special rules for our family annual draw.
