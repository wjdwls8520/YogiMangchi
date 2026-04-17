const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./stores/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "trade-buy": "#E12343",
        "trade-buy-hover": "#C81F3C",
        "trade-sell": "#1763B6",
        "trade-sell-hover": "#14579F",
      },
      fontSize: {
        xxs: ["11px", { lineHeight: "1.4" }],
      },
    },
  },
};

export default config;
