# Secret Santa Web App

## Tech Stack Recommendation

### Frontend & Backend
- **Next.js 14+** (App Router) - Full-stack React framework, perfect for Vercel deployment
- **TypeScript** - Type safety for configuration and game logic
- **Tailwind CSS** - Rapid UI development with mobile-first design
- **Shadcn/ui** - Beautiful, accessible UI components

### Real-time Communication
- **Pusher Channels** (Free tier: 100 connections, 200k messages/day) - WebSocket-based real-time updates
- Alternative: **Ably** (Free tier similar) or **Supabase Realtime** (if using Supabase)

### State & Data
- **Zustand** or React Context - Client-side state management
- **LocalStorage/SessionStorage** - Persist draw state (no database needed for prototype)
- Alternative: **Vercel KV** (Redis) for persistence if needed later

### Why This Stack?
1. **Zero backend complexity** - Next.js API routes handle server logic
2. **Free hosting** - Vercel's hobby plan is perfect for this
3. **Mobile-optimized** - Tailwind + Next.js = responsive by default
4. **Real-time ready** - Pusher free tier is sufficient for family use
5. **Fast iteration** - Hot reload, TypeScript safety, component library

## Implementation Plan

### Phase 1: Setup & Configuration

**1. Project Initialization**
- Initialize Next.js with TypeScript and Tailwind CSS
- Install dependencies: Pusher, Shadcn/ui components
- Set up project structure with clear separation of concerns

**2. Define Data Models**
```typescript
// Family configuration
interface FamilyMember {
  id: string;
  name: string;
  clicId: string;
}

interface Clic {
  id: string;
  name: string;
  memberIds: string[];
}

interface DrawOrder {
  memberId: string;
  order: number;
}

interface GameState {
  currentDrawerIndex: number;
  assignments: Record<string, string>; // drawerId -> gifteeId
  availableGiftees: string[];
}
```

**3. Create Family Configuration File**
- Create a configuration file with your family structure
- Define all family members and their clics
- Set the draw order for the prototype

### Phase 2: Core Game Logic

**4. Implement Draw Algorithm**
- Create function to validate if a draw is legal (not self, not same clic)
- Implement smart draw that only presents valid options
- Add randomization logic for selecting from valid pool

**5. Build State Management**
- Set up game state initialization
- Implement draw execution logic
- Add completion detection

### Phase 3: User Interface

**6. Create Main Game Screen**
- Display all family members with their status (waiting/drawing/completed)
- Show current drawer with highlight/animation
- Create "Draw" button for current drawer (or auto-draw)
- Display beautiful reveal animation when name is drawn

**7. Build Setup/Admin Screen**
- Simple form to initialize a new game session
- Generate shareable link for family members
- Option to reset/restart the draw

**8. Mobile-First Design**
- Large, touch-friendly buttons
- Celebration animations (confetti, transitions)
- Clear visual hierarchy
- Dark mode support for evening gatherings

### Phase 4: Real-Time Synchronization

**9. Integrate Pusher**
- Set up Pusher app and get credentials
- Implement event broadcasting (draw executed, game state updated)
- Add client-side event listeners
- Handle reconnection and state sync

**10. Multi-Device Testing**
- Test with multiple browser windows
- Verify real-time updates work correctly
- Ensure draw restrictions are enforced

### Phase 5: Polish & Deploy

**11. Add UX Enhancements**
- Loading states and optimistic updates
- Error handling (network issues, invalid draws)
- Success feedback and celebrations
- Instructions/help modal

**12. Deployment Setup**
- Configure environment variables in Vercel
- Set up Pusher credentials
- Deploy to Vercel
- Test production build

## File Structure

```
secret-santa/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main game screen
│   ├── setup/
│   │   └── page.tsx         # Admin setup screen
│   └── api/
│       ├── draw/route.ts    # Execute draw endpoint
│       ├── state/route.ts   # Get game state
│       └── pusher/route.ts  # Pusher auth (if needed)
├── components/
│   ├── GameBoard.tsx        # Main game display
│   ├── PlayerCard.tsx       # Individual player status
│   ├── DrawButton.tsx       # Draw action button
│   ├── RevealAnimation.tsx  # Name reveal effect
│   └── ui/                  # Shadcn components
├── lib/
│   ├── game-logic.ts        # Draw algorithm & validation
│   ├── pusher.ts            # Pusher client/server setup
│   └── family-config.ts     # Family structure data
├── types/
│   └── index.ts             # TypeScript interfaces
└── public/                  # Static assets
```

## Configuration Example

Your family configuration might look like:

```typescript
export const familyConfig = {
  clics: [
    { id: "clic1", name: "Your Nuclear Family", memberIds: ["you", "wife"] },
    { id: "clic2", name: "Siblings", memberIds: ["sibling1", "sibling1-spouse"] },
    // ... more clics
  ],
  members: [
    { id: "you", name: "Your Name", clicId: "clic1" },
    { id: "wife", name: "Wife Name", clicId: "clic1" },
    // ... more members
  ],
  drawOrder: ["you", "wife", "sibling1", "sibling1-spouse", ...]
};
```

## Key Features for Prototype

1. ✅ Pre-configured family structure
2. ✅ Real-time updates visible to all participants
3. ✅ Enforced clic restrictions (automatic validation)
4. ✅ No self-draws (automatic validation)
5. ✅ Sequential draws in pre-defined order
6. ✅ Mobile-friendly interface
7. ✅ Celebration animations for each draw
8. ✅ Simple reset functionality

## Future Enhancements (Post-Prototype)

- Dynamic family configuration UI
- Save configurations for reuse year-to-year
- Draw history and past assignments
- Email notifications with assignments
- Budget/gift idea suggestions
- Anonymous messaging between secret santa pairs
- Admin override to manually assign if algorithm fails


