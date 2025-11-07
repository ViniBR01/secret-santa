import { FamilyConfig } from "@/types";

// Example family configuration
// Replace this with your actual family structure
export const familyConfig: FamilyConfig = {
  clics: [
    {
      id: "abuelos",
      name: "Los Abuelos",
      memberIds: ["abuela", "abuelo"],
    },
    {
      id: "pelaez-soni",
      name: "Los Pelaez-Soni",
      memberIds: ["beni", "laura", "ale"],
    },
    {
      id: "sanches-pelaez",
      name: "Los de Quito",
      memberIds: ["mimi", "matias"],
    },
    {
      id: "silva-pelaez",
      name: "Los de EEUU",
      memberIds: ["vini", "tipi"],
    },
    {
      id: "soni-cortez",
      name: "Los Soni Cortez",
      memberIds: ["carton", "irene", "marifer", "dani"],
    },
    {
      id: "perez-soni",
      name: "Los Perez",
      memberIds: ["hugo-grande", "mari", "huguito", "mariu", "diana", "olivia"],
    },
    {
      id: "magos-luz",
      name: "Tia Magos y Luz",
      memberIds: ["magos", "luz"],
    },
  ],
  members: [
    // Los Abuelos
    { id: "abuela", name: "bis. Maricela", clicId: "abuelos" },
    { id: "abuelo", name: "bis. Victor Manuel", clicId: "abuelos" },
    // Los Pelaez-Soni
    { id: "beni", name: "Benigno", clicId: "pelaez-soni" },
    { id: "laura", name: "Laura Soni", clicId: "pelaez-soni" },
    { id: "ale", name: "Ale Pelaez", clicId: "pelaez-soni" },
    // Los de Quito
    { id: "mimi", name: "Laura Pelaez", clicId: "sanches-pelaez" },
    { id: "matias", name: "Matias Sanches", clicId: "sanches-pelaez" },
    // Los de EEUU
    { id: "vini", name: "Vinicius da Silva", clicId: "silva-pelaez" },
    { id: "tipi", name: "Maria Jose", clicId: "silva-pelaez" },
    // Los Soni Cortez
    { id: "carton", name: "Jose Carlos", clicId: "soni-cortez" },
    { id: "irene", name: "Irene Cortez", clicId: "soni-cortez" },
    { id: "marifer", name: "Maria Fernanda", clicId: "soni-cortez" },
    { id: "dani", name: "Daniela", clicId: "soni-cortez" },
    // Los Perez
    { id: "hugo-grande", name: "Hugo Perez Sr.", clicId: "perez-soni" },
    { id: "mari", name: "Mari", clicId: "perez-soni" },
    { id: "huguito", name: "Hugo Perez Jr.", clicId: "perez-soni" },
    { id: "mariu", name: "Mariu Perez", clicId: "perez-soni" },
    { id: "diana", name: "Diana Perez", clicId: "perez-soni" },
    { id: "olivia", name: "Baby Olivia", clicId: "perez-soni" },
    // Tia Magos y Luz
    { id: "magos", name: "Magos", clicId: "magos-luz" },
    { id: "luz", name: "Luz", clicId: "magos-luz" },
  ],
  // Order in which family members will draw
  drawOrder: [
    "abuelo", "abuela", "magos", 
    "beni", "hugo-grande", "laura", "mari", "luz", "carton", "irene",
    "mimi", "vini",  "ale", "tipi",
    "mariu", "diana", "huguito",
    "marifer", "dani",
    "matias", "olivia"
  ],
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

