/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeInUp: "fadeInUp 0.5s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: 0, transform: "translateY(15px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      animationDelay: {
        100: "100ms",
        200: "200ms",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        manrope: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
