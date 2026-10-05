/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins_400Regular', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          foreground: "hsl(var(--primary-foreground))",
        }
      }
    },
  },
  plugins: [],
}
