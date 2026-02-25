import type { Config } from "tailwindcss";

const config: Config & {
  daisyui: {
    themes: any[];
  };
} = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },
        accent: {
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-200)",
          300: "var(--color-accent-300)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
          800: "var(--color-accent-800)",
          900: "var(--color-accent-900)",
        },
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(139, 92, 246, 0.1), 0 10px 20px -2px rgba(139, 92, 246, 0.05)",
        "soft-lg": "0 10px 40px -10px rgba(139, 92, 246, 0.2)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#8b5cf6",
          "primary-focus": "#7c3aed",
          "primary-content": "#ffffff",
          secondary: "#06b6d4",
          "secondary-focus": "#0891b2",
          "secondary-content": "#ffffff",
          accent: "#06b6d4",
          "accent-focus": "#0891b2",
          "accent-content": "#ffffff",
          neutral: "#404040",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#e5e5e5",
        },
      },
    ],
  },
};

export default config;
