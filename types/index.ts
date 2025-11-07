// Core type definitions for Secret Santa app

export interface FamilyMember {
  id: string;
  name: string;
  clicId: string;
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

export interface GameState {
  currentDrawerIndex: number;
  assignments: Record<string, string>; // drawerId -> gifteeId
  availableGiftees: string[];
  isComplete: boolean;
  
  // New fields for interactive selection
  selectionPhase: SelectionPhase;
  currentOptions: string[]; // viable gifteeIds for current drawer
  selectedIndex: number | null;
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

