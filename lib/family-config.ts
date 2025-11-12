import { FamilyConfig } from "@/types";

// Example family configuration
// Replace this with your actual family structure
export const familyConfig: FamilyConfig = {
  clics: [
    {
      id: "abuelos",
      name: "Los Abuelos",
      memberIds: ["abuela", "abuelo"],
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      bgGradient: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20",
    },
    {
      id: "pelaez-soni",
      name: "Los Pelaez-Soni",
      memberIds: ["beni", "laura", "ale"],
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    },
    {
      id: "sanches-pelaez",
      name: "Los de Quito",
      memberIds: ["mimi", "matias"],
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      bgGradient: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
    },
    {
      id: "silva-pelaez",
      name: "Los de EEUU",
      memberIds: ["vini", "tipi"],
      bgColor: "bg-yellow-50 dark:bg-green-950/20",
      bgGradient: "bg-gradient-to-br from-yellow-50 to-green-50 dark:from-rose-950/20 dark:to-red-950/20",
    },
    {
      id: "soni-cortez",
      name: "Los Soni Cortez",
      memberIds: ["carton", "irene", "marifer", "dani"],
      bgColor: "bg-green-50 dark:bg-green-950/20",
      bgGradient: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    },
    {
      id: "perez-soni",
      name: "Los Perez",
      memberIds: ["hugo-grande", "mari", "huguito", "mariu"],
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      bgGradient: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
    },
    {
      id: "diana-olivia",
      name: "Familia de Olivia",
      memberIds: ["diana", "olivia"],
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      bgGradient: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20",
    },
    {
      id: "magos",
      name: "Tia Magos",
      memberIds: ["magos"],
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      bgGradient: "bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20",
    },
  ],
  members: [
    // Los Abuelos
    { id: "abuela", name: "bis. Maricela", clicId: "abuelos", avatar: "/avatars/abuela.png", emoji: "👵" },
    { id: "abuelo", name: "bis. Victor Manuel", clicId: "abuelos", avatar: "/avatars/abuelo.png", emoji: "🎩" },
    // Los Pelaez-Soni
    { id: "beni", name: "Benigno", clicId: "pelaez-soni", avatar: "/avatars/beni.png", emoji: "🎸" },
    { id: "laura", name: "Laura Soni", clicId: "pelaez-soni", avatar: "/avatars/laura.png", emoji: "🌸" },
    { id: "ale", name: "Ale Pelaez", clicId: "pelaez-soni", avatar: "/avatars/ale.png", emoji: "⚖️" },
    // Los de Quito
    { id: "mimi", name: "Laura Pelaez", clicId: "sanches-pelaez", avatar: "/avatars/lau.png", emoji: "🌺" },
    { id: "matias", name: "Matias Sanches", clicId: "sanches-pelaez", avatar: "/avatars/matias.png", emoji: "⚽" },
    // Los de EEUU
    { id: "vini", name: "Vinicius da Silva", clicId: "silva-pelaez", avatar: "/avatars/vini.png", emoji: "🇧🇷" },
    { id: "tipi", name: "Maria Jose", clicId: "silva-pelaez", avatar: "/avatars/tipi.png", emoji: "🎨" },
    // Los Soni Cortez
    { id: "carton", name: "Juan Carlos", clicId: "soni-cortez", avatar: "/avatars/carlos.png", emoji: "🏋️" },
    { id: "irene", name: "Irene Cortez", clicId: "soni-cortez", avatar: "/avatars/irene.png", emoji: "📚" },
    { id: "marifer", name: "Maria Fernanda", clicId: "soni-cortez", avatar: "/avatars/marifer.png", emoji: "💃" },
    { id: "dani", name: "Daniela", clicId: "soni-cortez", avatar: "/avatars/dani.jpeg", emoji: "🎭" },
    // Los Perez
    { id: "hugo-grande", name: "Hugo Perez Sr.", clicId: "perez-soni", avatar: "/avatars/hugo.png", emoji: "👨‍💼" },
    { id: "mari", name: "Mari", clicId: "perez-soni", avatar: "/avatars/mari.png", emoji: "🌹" },
    { id: "huguito", name: "Hugo Perez Jr.", clicId: "perez-soni", avatar: "/avatars/huguito.png", emoji: "🎮" },
    { id: "mariu", name: "Mariu Perez", clicId: "perez-soni", avatar: "/avatars/mariu.png", emoji: "✨" },
    { id: "diana", name: "Diana Perez", clicId: "diana-olivia", avatar: "/avatars/diana.png", emoji: "💐" },
    { id: "olivia", name: "Baby Olivia", clicId: "diana-olivia", avatar: "/avatars/olivia.png", emoji: "👶" },
    // Tia Magos
    { id: "magos", name: "Magos", clicId: "magos-luz", avatar: "/avatars/magos.png", emoji: "🔮" }
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

// Helper function to get clic theme by member ID
export function getClicThemeByMemberId(memberId: string) {
  const member = getMemberById(memberId);
  if (!member) return null;
  const clic = getClicById(member.clicId);
  return clic;
}

