import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf7",
          100: "#d8f4e6",
          500: "#18a36b",
          700: "#147d53",
          900: "#0f5137"
        }
      }
    }
  },
  plugins: []
};

export default config;
