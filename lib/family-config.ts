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
      memberIds: ["hugo-grande", "mari", "huguito", "mariu"],
    },
    {
      id: "diana-olivia",
      name: "Familia de Olivia",
      memberIds: ["diana", "olivia"],
    },
    {
      id: "magos",
      name: "Tia Magos",
      memberIds: ["magos"],
    },
  ],
  members: [
    // Los Abuelos
    { id: "abuela", name: "bis. Maricela", clicId: "abuelos", avatar: "/avatars/abuela.png" },
    { id: "abuelo", name: "bis. Victor Manuel", clicId: "abuelos", avatar: "/avatars/abuelo.png" },
    // Los Pelaez-Soni
    { id: "beni", name: "Benigno", clicId: "pelaez-soni", avatar: "/avatars/beni.png" },
    { id: "laura", name: "Laura Soni", clicId: "pelaez-soni", avatar: "/avatars/laura.png" },
    { id: "ale", name: "Ale Pelaez", clicId: "pelaez-soni", avatar: "/avatars/ale.png" },
    // Los de Quito
    { id: "mimi", name: "Laura Pelaez", clicId: "sanches-pelaez", avatar: "/avatars/lau.png" },
    { id: "matias", name: "Matias Sanches", clicId: "sanches-pelaez", avatar: "/avatars/matias.png" },
    // Los de EEUU
    { id: "vini", name: "Vinicius da Silva", clicId: "silva-pelaez", avatar: "/avatars/vini.png" },
    { id: "tipi", name: "Maria Jose", clicId: "silva-pelaez", avatar: "/avatars/tipi.png" },
    // Los Soni Cortez
    { id: "carton", name: "Juan Carlos", clicId: "soni-cortez", avatar: "/avatars/carlos.png" },
    { id: "irene", name: "Irene Cortez", clicId: "soni-cortez", avatar: "/avatars/irene.png" },
    { id: "marifer", name: "Maria Fernanda", clicId: "soni-cortez", avatar: "/avatars/marifer.png" },
    { id: "dani", name: "Daniela", clicId: "soni-cortez", avatar: "/avatars/dani.jpeg" },
    // Los Perez
    { id: "hugo-grande", name: "Hugo Perez Sr.", clicId: "perez-soni", avatar: "/avatars/hugo.png" },
    { id: "mari", name: "Mari", clicId: "perez-soni", avatar: "/avatars/mari.png" },
    { id: "huguito", name: "Hugo Perez Jr.", clicId: "perez-soni", avatar: "/avatars/huguito.png" },
    { id: "mariu", name: "Mariu Perez", clicId: "perez-soni", avatar: "/avatars/mariu.png" },
    { id: "diana", name: "Diana Perez", clicId: "diana-olivia", avatar: "/avatars/diana.png" },
    { id: "olivia", name: "Baby Olivia", clicId: "diana-olivia", avatar: "/avatars/olivia.png" },
    // Tia Magos
    { id: "magos", name: "Magos", clicId: "magos-luz", avatar: "/avatars/magos.png" }
  ],
  // Order in which family members will draw
  drawOrder: [
    "abuelo", "abuela", "magos", 
    "beni", "hugo-grande", "laura", "mari", "carton", "irene",
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

