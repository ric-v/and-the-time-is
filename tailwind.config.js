module.exports = {
  darkMode: "class",
  content: ["./**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      "nova-flat": '"Nova Flat"',
    },
    extend: {},
  },
  plugins: [require("tailwind-scrollbar")],
};
