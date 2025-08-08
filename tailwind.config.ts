import type { Config } from "tailwindcss"
const config: Config = {
  darkMode: ["class"],
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0c0d0f",
        foreground: "#e7e7e7",
        card: "#121316",
        accent: "#3ee06a"
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" }
    }
  },
  plugins: []
}
export default config
