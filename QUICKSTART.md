# Quick Start Guide

Get your Secret Santa app running in 5 minutes!

## Step 1: Configure Your Family (2 minutes)

Edit `lib/family-config.ts` and replace the example data with your family:

```typescript
export const familyConfig: FamilyConfig = {
  clics: [
    { id: "clic1", name: "My Family", memberIds: ["john", "jane"] },
    { id: "clic2", name: "Siblings", memberIds: ["bob", "alice"] },
  ],
  members: [
    { id: "john", name: "John", clicId: "clic1" },
    { id: "jane", name: "Jane", clicId: "clic1" },
    { id: "bob", name: "Bob", clicId: "clic2" },
    { id: "alice", name: "Alice", clicId: "clic2" },
  ],
  drawOrder: ["john", "jane", "bob", "alice"],
};
```

**Rules:**
- Members in the same `clic` cannot draw each other
- Draw order determines who draws when
- Each member must have a unique `id`

## Step 2: Run Locally (1 minute)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 3: Test It Out (1 minute)

1. Click "Draw a Name" button
2. Watch the celebration animation
3. See the player status update
4. Continue until everyone has drawn
5. Click "Reset Game" to try again

## Step 4: Deploy (Optional - 1 minute)

### Quick Deploy to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Follow the prompts, and you'll get a URL to share with your family!

## Multi-Device Sync (Optional)

To enable real-time synchronization across devices:

1. Sign up at [pusher.com](https://pusher.com) (free)
2. Create a Channels app
3. Create `.env.local`:

```bash
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
```

4. Restart the dev server

Without Pusher, the app works perfectly in "local-only" mode (single device).

## Troubleshooting

**Q: Build fails?**
```bash
npm install
npm run build
```

**Q: Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**Q: Family member draws themselves?**
- Check your `family-config.ts` - each member must have a unique ID

## Next Steps

- Read `README.md` for detailed documentation
- Read `DEPLOYMENT.md` for production deployment guide
- Customize colors in `app/globals.css`
- See `PLAN.md` for future feature ideas

## Support

Having issues? Check:
1. `README.md` - Troubleshooting section
2. Browser console (F12) for errors
3. Terminal output for build errors

Enjoy your Secret Santa! 🎅🎁

