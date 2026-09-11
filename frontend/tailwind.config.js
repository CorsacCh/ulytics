/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // UACh Corporativo - Paleta Institucional
        "uach-blue": "#003366",      // Azul marino corporativo
        "uach-light-blue": "#004d99", // Azul más claro
        "uach-gold": "#D4AF37",       // Dorado para acentos
        "uach-green": "#2D7C5E",      // Verde institucional
        "uach-dark": "#001a4d",       // Oscuro muy profundo
        
        // Backgrounds
        "bg-light": "#F5F7FA",        // Fondo muy claro
        "bg-card": "#FFFFFF",         // Tarjetas blancas
        
        // Text colors
        "text-primary": "#001a4d",    // Texto principal muy oscuro
        "text-secondary": "#556B7B",  // Texto secundario gris-azulado
        
        // UI Colors
        sidebar: "#003366",           // Sidebar azul marino
        "sidebar-foreground": "#FFFFFF",
        "sidebar-accent": "#D4AF37",  // Dorado
        primary: "#D4AF37",           // Dorado para CTAs
        secondary: "#2D7C5E",         // Verde para acciones secundarias
        success: "#22C55E",           // Verde éxito
        warning: "#F59E0B",           // Ámbar advertencia
        error: "#EF4444",             // Rojo error
        tertiary: "#161616",
        dimWhite: "rgba(255, 255, 255, 0.7)",
        dimBlue: "rgba(0, 51, 102, 0.1)",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
    },
    screens: {
      xs: "480px",
      ss: "620px",
      sm: "768px",
      md: "1060px",
      lg: "1200px",
      xl: "1700px",
    },
  },
  plugins: [],
};