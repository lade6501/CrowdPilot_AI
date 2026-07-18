export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      spacing: {
        21.25: "5.3125rem",
        27.5: "6.875rem",
        40: "10rem",
        55: "13.75rem",
        65: "16.25rem",
        70: "17.5rem",
        95: "23.75rem",
        105: "26.25rem",
        115: "28.75rem",
        130: "32.5rem",
        150: "37.5rem",
      },
      colors: {
        stadium: {
          bg: "#0B0F19",
          card: "rgba(17, 24, 39, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(204, 163, 82, 0.15)",
        },
        fifa: {
          blue: "#0F1E36",
          gold: "#D4AF37",
          green: "#10B981",
          red: "#EF4444",
          yellow: "#F59E0B",
          navy: "#1E293B",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
