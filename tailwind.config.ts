import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Ensure all family clic colors are included in dark mode
    // Abuelos - amber/yellow
    "dark:bg-amber-800/40",
    "dark:from-amber-700/40",
    "dark:to-yellow-600/40",
    // Pelaez-Soni - orange/amber
    "dark:bg-orange-800/40",
    "dark:from-orange-700/40",
    "dark:to-amber-600/40",
    // Sanches-Pelaez - red/rose
    "dark:bg-red-900/35",
    "dark:from-red-800/40",
    "dark:to-rose-700/40",
    // Silva-Pelaez - yellow/amber
    "dark:bg-yellow-800/35",
    "dark:from-yellow-700/40",
    "dark:to-amber-700/40",
    // Soni-Cortez - lime/yellow
    "dark:bg-lime-800/35",
    "dark:from-lime-700/40",
    "dark:to-yellow-700/35",
    // Perez-Soni - orange/amber (original)
    "dark:bg-orange-700/45",
    "dark:from-orange-600/45",
    "dark:to-amber-500/45",
    // Diana-Olivia - rose/pink
    "dark:bg-rose-800/40",
    "dark:from-rose-700/45",
    "dark:to-pink-600/40",
    // Magos - amber/orange
    "dark:bg-amber-900/35",
    "dark:from-amber-800/40",
    "dark:to-orange-700/35",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "reveal": {
          "0%": { transform: "scale(0.8) rotateY(-90deg)", opacity: "0" },
          "100%": { transform: "scale(1) rotateY(0deg)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "reveal": "reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

