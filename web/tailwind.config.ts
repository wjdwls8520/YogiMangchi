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
        "brand-primary": "#0058FF",
        "trade-buy": "#E12343",
        "trade-buy-hover": "#C81F3C",
        "trade-sell": "#1763B6",
        "trade-sell-hover": "#14579F",
        "futures-trade": "#161A1E",
        "futures-border": "rgba(255, 255, 255, 0.05)",
        "futures-border-strong": "rgba(255, 255, 255, 0.1)",
        "trade-long": "#2EBD85",
        "trade-short": "#F6465D",
      },
      fontSize: {
        xxs: ["11px", { lineHeight: "1.4" }],
      },
    },
  },
};

export default config;
