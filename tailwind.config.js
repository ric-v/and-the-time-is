module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      "nova-flat": '"Nova Flat"',
    },
    extend: {},
  },
  plugins: [require("tailwind-scrollbar")],
};
