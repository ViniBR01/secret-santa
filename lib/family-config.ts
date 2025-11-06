import { FamilyConfig } from "@/types";

// Example family configuration
// Replace this with your actual family structure
export const familyConfig: FamilyConfig = {
  clics: [
    {
      id: "clic1",
      name: "Family Unit 1",
      memberIds: ["alice", "bob"],
    },
    {
      id: "clic2",
      name: "Family Unit 2",
      memberIds: ["charlie", "diana"],
    },
    {
      id: "clic3",
      name: "Family Unit 3",
      memberIds: ["eve", "frank"],
    },
    {
      id: "clic4",
      name: "Singles",
      memberIds: ["grace", "henry"],
    },
  ],
  members: [
    { id: "alice", name: "Alice", clicId: "clic1" },
    { id: "bob", name: "Bob", clicId: "clic1" },
    { id: "charlie", name: "Charlie", clicId: "clic2" },
    { id: "diana", name: "Diana", clicId: "clic2" },
    { id: "eve", name: "Eve", clicId: "clic3" },
    { id: "frank", name: "Frank", clicId: "clic3" },
    { id: "grace", name: "Grace", clicId: "clic4" },
    { id: "henry", name: "Henry", clicId: "clic4" },
  ],
  // Order in which family members will draw
  drawOrder: ["alice", "bob", "charlie", "diana", "eve", "frank", "grace", "henry"],
};

// Helper function to get member by ID
export function getMemberById(memberId: string) {
  return familyConfig.members.find((m) => m.id === memberId);
}

// Helper function to get clic by ID
export function getClicById(clicId: string) {
  return familyConfig.clics.find((c) => c.id === clicId);
}

// Helper function to get members in the same clic
export function getMembersInSameClic(memberId: string): string[] {
  const member = getMemberById(memberId);
  if (!member) return [];
  
  const clic = getClicById(member.clicId);
  if (!clic) return [];
  
  return clic.memberIds;
}

