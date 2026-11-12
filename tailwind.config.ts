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
          50: "#eeedff",
          100: "#dcd9ff",
          200: "#bcb7ff",
          300: "#9890ff",
          400: "#766cff",
          500: "#6c63ff",
          600: "#584fe6",
          700: "#463dc2",
          800: "#342d91",
          900: "#211d5e",
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
