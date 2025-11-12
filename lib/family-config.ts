import { FamilyConfig } from "@/types";

// Example family configuration
// Replace this with your actual family structure
export const familyConfig: FamilyConfig = {
  clics: [
    {
      id: "abuelos",
      name: "Los Abuelos",
      memberIds: ["abuela", "abuelo"],
      bgColor: "bg-amber-50 dark:bg-amber-800/40",
      bgGradient: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-700/40 dark:to-yellow-600/40",
    },
    {
      id: "pelaez-soni",
      name: "Los Pelaez-Soni",
      memberIds: ["beni", "laura", "ale"],
      bgColor: "bg-blue-50 dark:bg-orange-800/40",
      bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-orange-700/40 dark:to-amber-600/40",
    },
    {
      id: "sanches-pelaez",
      name: "Los de Quito",
      memberIds: ["mimi", "matias"],
      bgColor: "bg-purple-50 dark:bg-red-900/35",
      bgGradient: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-red-800/40 dark:to-rose-700/40",
    },
    {
      id: "silva-pelaez",
      name: "Los de EEUU",
      memberIds: ["vini", "tipi"],
      bgColor: "bg-yellow-50 dark:bg-yellow-800/35",
      bgGradient: "bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-700/40 dark:to-amber-700/40",
    },
    {
      id: "soni-cortez",
      name: "Los Soni Cortez",
      memberIds: ["carton", "irene", "marifer", "dani"],
      bgColor: "bg-green-50 dark:bg-lime-800/35",
      bgGradient: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-lime-700/40 dark:to-yellow-700/35",
    },
    {
      id: "perez-soni",
      name: "Los Perez",
      memberIds: ["hugo-grande", "mari", "huguito", "mariu"],
      bgColor: "bg-orange-50 dark:bg-orange-700/45",
      bgGradient: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-600/45 dark:to-amber-500/45",
    },
    {
      id: "diana-olivia",
      name: "Familia de Olivia",
      memberIds: ["diana", "olivia"],
      bgColor: "bg-pink-50 dark:bg-rose-800/40",
      bgGradient: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-rose-700/45 dark:to-pink-600/40",
    },
    {
      id: "magos",
      name: "Tia Magos",
      memberIds: ["magos"],
      bgColor: "bg-indigo-50 dark:bg-amber-900/35",
      bgGradient: "bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-amber-800/40 dark:to-orange-700/35",
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
    { id: "magos", name: "Magos", clicId: "magos", avatar: "/avatars/magos.png", emoji: "🔮" }
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

// Helper function to extract confetti colors from clic based on member
export function getConfettiColorsForMember(memberId: string): string[] {
  const clic = getClicThemeByMemberId(memberId);
  if (!clic) {
    // Default festive colors if no clic found
    return ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#a855f7"];
  }

  // Map Tailwind color names to hex values based on clic bgGradient
  const clicColorMap: Record<string, string[]> = {
    "abuelos": ["#f59e0b", "#fbbf24", "#fcd34d", "#fde047"], // amber-yellow
    "pelaez-soni": ["#3b82f6", "#06b6d4", "#60a5fa", "#0ea5e9"], // blue-cyan
    "sanches-pelaez": ["#a855f7", "#8b5cf6", "#c084fc", "#a78bfa"], // purple-violet
    "silva-pelaez": ["#eab308", "#22c55e", "#84cc16", "#65a30d"], // yellow-green
    "soni-cortez": ["#22c55e", "#10b981", "#34d399", "#059669"], // green-emerald
    "perez-soni": ["#f97316", "#f59e0b", "#fb923c", "#fdba74"], // orange-amber
    "diana-olivia": ["#ec4899", "#f43f5e", "#fb7185", "#fda4af"], // pink-rose
    "magos": ["#6366f1", "#8b5cf6", "#818cf8", "#a78bfa"], // indigo-violet
  };

  return clicColorMap[clic.id] || ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#a855f7"];
}

