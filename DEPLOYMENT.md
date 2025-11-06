# Deployment Guide

This guide will help you deploy your Secret Santa application to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- Optional: Pusher account (free tier) for multi-device sync

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/secret-santa.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up Pusher (Optional but Recommended)

For multi-device real-time synchronization:

1. Go to [Pusher.com](https://pusher.com) and sign up for free
2. Create a new Channels app
3. Go to "App Keys" and note down:
   - app_id
   - key
   - secret
   - cluster

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure your project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. Add Environment Variables:
   - `NEXT_PUBLIC_PUSHER_KEY`: Your Pusher key
   - `NEXT_PUBLIC_PUSHER_CLUSTER`: Your Pusher cluster (e.g., "us2")
   - `PUSHER_APP_ID`: Your Pusher app ID
   - `PUSHER_SECRET`: Your Pusher secret

6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

4. Follow the prompts to link your project

5. Add environment variables:

```bash
vercel env add NEXT_PUBLIC_PUSHER_KEY
vercel env add NEXT_PUBLIC_PUSHER_CLUSTER
vercel env add PUSHER_APP_ID
vercel env add PUSHER_SECRET
```

6. Redeploy with environment variables:

```bash
vercel --prod
```

## Step 4: Verify Deployment

1. Visit your deployed URL (provided by Vercel)
2. Test the app by clicking "Draw a Name"
3. Open the URL on multiple devices to verify real-time sync

## Step 5: Share with Family

Share your Vercel URL with your family members. They can all access the app simultaneously from their devices!

Example: `https://secret-santa-yourname.vercel.app`

## Customization Before Deployment

### Update Family Configuration

Make sure to update `lib/family-config.ts` with your actual family structure before deploying!

```typescript
export const familyConfig: FamilyConfig = {
  clics: [
    { id: "clic1", name: "Your Family Name", memberIds: ["person1", "person2"] },
    // ... your actual family structure
  ],
  members: [
    { id: "person1", name: "Actual Name", clicId: "clic1" },
    // ... your actual family members
  ],
  drawOrder: ["person1", "person2", /* your order */],
};
```

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Ensure no linting errors: `npm run lint`
- Test the build locally: `npm run build`

### Environment Variables Not Working

- Make sure variables starting with `NEXT_PUBLIC_` are accessible on the client side
- Redeploy after adding environment variables
- Check Vercel logs for specific errors

### Pusher Not Connecting

- Verify all four Pusher environment variables are set correctly
- Check that your Pusher app is active
- Look for errors in browser console (F12)

### App Works Locally But Not in Production

- Check Vercel deployment logs
- Verify environment variables are set in production
- Ensure all files are committed to Git

## Cost Estimate

- **Vercel Hosting**: Free (Hobby plan)
- **Pusher**: Free tier (100 connections, 200k messages/day - more than enough for family use)
- **Total**: $0/month 🎉

## Updating After Deployment

To update your app after making changes:

1. Make your changes locally
2. Test locally: `npm run dev`
3. Commit and push to GitHub:

```bash
git add .
git commit -m "Your update message"
git push
```

4. Vercel will automatically deploy the update!

## Security Notes

- The current setup has no authentication (anyone with the URL can participate)
- For a private family event, consider:
  - Not sharing the URL publicly
  - Using a hard-to-guess Vercel project name
  - Deploying just before your event and deleting after
- Environment variables are secure and not exposed to clients (except those prefixed with `NEXT_PUBLIC_`)

## Support

If you encounter issues:
1. Check the README.md troubleshooting section
2. Review Vercel deployment logs
3. Check browser console for errors
4. Ensure all dependencies are installed

Enjoy your Secret Santa! 🎅🎁

