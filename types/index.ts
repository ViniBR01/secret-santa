// Core type definitions for Secret Santa app

export interface FamilyMember {
  id: string;
  name: string;
  clicId: string;
  avatar: string;
}

export interface Clic {
  id: string;
  name: string;
  memberIds: string[];
}

export interface DrawOrder {
  memberId: string;
  order: number;
}

export type SelectionPhase = 'waiting' | 'selecting' | 'revealing' | 'complete';

export type GameLifecycle = 'not_started' | 'in_progress' | 'completed';

// Session and role management types
export type UserRole = 'admin' | 'player' | 'spectator';

export interface PlayerSession {
  playerId: string;
  connectedAt: number;
  lastSeen: number;
  isOnline: boolean;
}

export interface SessionData {
  role: UserRole;
  playerId?: string; // undefined for admin/spectator
}

export interface GameState {
  currentDrawerIndex: number;
  assignments: Record<string, string>; // drawerId -> gifteeId
  availableGiftees: string[];
  isComplete: boolean;
  
  // Game lifecycle management
  gameLifecycle: GameLifecycle;
  
  // Interactive selection fields
  selectionPhase: SelectionPhase;
  currentOptions: string[]; // viable gifteeIds for current drawer
  selectedIndex: number | null;
  
  // Session management fields
  activePlayerSessions: Record<string, PlayerSession>; // playerId -> session
  adminId: string | null;
  turnLocked: boolean; // prevents simultaneous selections
}

export interface FamilyConfig {
  clics: Clic[];
  members: FamilyMember[];
  drawOrder: string[];
}

export interface DrawResult {
  drawerId: string;
  gifteeId: string;
  gifteeName: string;
}

export interface DrawOptions {
  drawerId: string;
  viableGifteeIds: string[];
}

export type PlayerStatus = 'waiting' | 'drawing' | 'completed';

export interface PlayerState {
  member: FamilyMember;
  status: PlayerStatus;
  order: number;
}

