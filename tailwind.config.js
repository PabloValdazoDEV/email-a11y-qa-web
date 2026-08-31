/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 20px 50px -24px rgb(24 24 27 / 0.25)",
      },
    },
  },
  plugins: [],
};
