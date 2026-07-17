
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
