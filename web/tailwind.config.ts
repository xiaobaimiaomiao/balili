import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFF0F5",
          100: "#FFE0EB",
          200: "#FFC3D0",
          300: "#FFA3B5",
          400: "#FF85A0",
          500: "#FF6B9D",
          600: "#E8508A",
          700: "#C44569",
          800: "#9F3A58",
          900: "#7A2F47",
        },
        sakura: "#FFB7C5",
        lavender: "#E8D5F5",
        mint: "#B5EAD7",
        peach: "#FFDAB9",
        sky: "#B5D8F7",
        admin: {
          bg: "#F8FAFC",
          sidebar: "#1E293B",
          "sidebar-hover": "#334155",
          accent: "#6366F1",
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ['"M PLUS Rounded 1c"', "sans-serif"],
        admin: ['"Inter"', "system-ui", "sans-serif"],
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
