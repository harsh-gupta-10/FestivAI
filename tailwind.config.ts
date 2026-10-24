import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Superhuman Editorial Design Tokens
        "midnight-wine": "#421d24",
        "royal-violet": "#714cb6",
        "lilac-mist": "#d4c7ff",
        "deep-lagoon": "#0c4243",
        "warm-parchment": "#f2f0eb",
        "soft-mist": "#e3e3e2",
        "ink-charcoal": "#292827",
        "stone-gray": "#666666",
        "paper-white": "#ffffff",
      },
      fontWeight: {
        w460: "460",
        w540: "540",
      },
      letterSpacing: {
        "display": "-0.028em",
        "heading-lg": "-0.027em",
        "heading-sm": "-0.022em",
      },
      borderRadius: {
        "tabs": "8px",
        "cards": "16px",
        "buttons": "16px",
        "small-buttons": "8px",
        "floating-cards": "16px",
      },
      boxShadow: {
        subtle: "rgb(113, 76, 182) 0px 0px 0px 1px inset",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
