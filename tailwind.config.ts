import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6f5ef",
          100: "#c5e9d9",
          200: "#9ad7bd",
          300: "#6bbf9b",
          400: "#3fa37a",
          500: "#0b6e4f",
          600: "#0a6045",
          700: "#084f39",
          800: "#063f2e",
          900: "#042f23",
        },
        clay: {
          500: "#c45c26",
          600: "#a64b1e",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
