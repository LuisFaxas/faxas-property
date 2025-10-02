import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          500: '#8EE3C8',
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        graphite: {
          900: '#0f1115',
          800: '#14161b',
          700: '#1b1e24',
          600: '#232730',
          500: '#2c313c',
          400: '#3b4150',
          300: '#4a5163',
          200: '#5a6278',
          100: '#6b7490',
        },
      },
      height: {
        'modal-detail': 'var(--modal-detail)',
        'modal-form': 'var(--modal-form)',
        'modal-fullscreen': 'var(--modal-fullscreen)',
        'modal-compact': 'var(--modal-compact)',
        'dropdown': 'var(--dropdown)',
        'modal-min': 'var(--modal-min)',
      },
      maxHeight: {
        'modal-detail': 'var(--modal-detail)',
        'modal-form': 'var(--modal-form)',
        'modal-fullscreen': 'var(--modal-fullscreen)',
        'modal-compact': 'var(--modal-compact)',
        'dropdown': 'var(--dropdown)',
      },
      minHeight: {
        'modal-min': 'var(--modal-min)',
      },
      opacity: {
        'backdrop-light': '0.5',        // 50% - BottomSheet backdrop
        'backdrop-heavy': '0.8',        // 80% - Dialog/Sheet backdrop
        'border-default': '0.1',        // 10% - Borders/dividers
        'text-muted': '0.6',            // 60% - Secondary text
        'text-disabled': '0.4',         // 40% - Disabled text
        'handle': '0.3',                // 30% - Drag handles
        'glass-bg': '0.55',             // 55% - Glass morphism backgrounds
        'card-bg': '0.5',               // 50% - Card backgrounds
        'sticky-header': '0.95',        // 95% - Sticky headers with blur
      },
      zIndex: {
        'modal': 'var(--z-modal)',      // All modals/overlays
        'header': 'var(--z-header)',    // Page header
        'sidebar': 'var(--z-sidebar)',  // Navigation sidebar
        'sticky': 'var(--z-sticky)',    // Sticky content within modals
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config