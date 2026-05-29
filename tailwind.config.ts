import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Stitch-like named sizes (kept for older pages)
        "label-caps": ["11px", { lineHeight: "14px", letterSpacing: "0.06em", fontWeight: "600" }],
        "headline-md": ["18px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "data-mono": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "body-reg": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
      },
      spacing: {
        unit: "4px",
        gutter: "12px",
        compact: "8px",
        comfortable: "16px",
        "page-x": "24px",
        "page-y": "24px",
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)",
        soft: "0 4px 16px -8px rgba(15, 23, 42, 0.08)",
        focus: "0 0 0 3px rgba(79, 70, 229, 0.18)",
      },
      letterSpacing: {
        widest2: "0.06em",
      },
      colors: {
        // === Enterprise palette ===
        canvas: "#f8fafc",          // app bg (slate-50)
        surface: "#ffffff",          // cards
        line: "#e5e7eb",             // gray-200
        "line-strong": "#d1d5db",    // gray-300
        // Text
        ink: {
          DEFAULT: "#111827",       // gray-900
          soft: "#374151",          // gray-700
          muted: "#6b7280",         // gray-500
          subtle: "#9ca3af",        // gray-400
          faint: "#d1d5db",
        },
        // Indigo accent
        accent: {
          DEFAULT: "#4f46e5",       // indigo-600
          hover: "#4338ca",
          soft: "#eef2ff",          // indigo-50
          softer: "#f5f7ff",
          border: "#c7d2fe",        // indigo-200
          text: "#3730a3",          // indigo-800
        },
        // Status
        warn: {
          bg: "#fffbeb",            // amber-50
          softer: "#fef3c7",        // amber-100
          border: "#fde68a",        // amber-200
          text: "#92400e",          // amber-800
          textStrong: "#78350f",
          solid: "#f59e0b",         // amber-500
        },
        danger: {
          bg: "#fef2f2",            // red-50
          softer: "#fee2e2",        // red-100
          border: "#fecaca",        // red-200
          text: "#991b1b",          // red-800
          textStrong: "#7f1d1d",
          solid: "#ef4444",         // red-500
        },
        ok: {
          bg: "#f0fdf4",            // green-50
          border: "#bbf7d0",        // green-200
          text: "#166534",          // green-800
          solid: "#16a34a",         // green-600
        },

        // === Backwards-compat aliases (old pages still compile) ===
        background: "#f8fafc",
        "on-background": "#111827",
        "on-surface": "#111827",
        "on-surface-variant": "#6b7280",
        outline: "#9ca3af",
        "outline-variant": "#e5e7eb",
        "surface-bright": "#ffffff",
        "surface-dim": "#f1f5f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8fafc",
        "surface-container": "#f1f5f9",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest": "#cbd5e1",
        "surface-variant": "#f1f5f9",
        primary: "#111827",
        "on-primary": "#ffffff",
        "primary-container": "#4f46e5",
        "on-primary-container": "#ffffff",
        secondary: "#4f46e5",
        "secondary-container": "#eef2ff",
        "on-secondary-container": "#3730a3",
        error: "#ef4444",
        "on-error": "#ffffff",
        "error-container": "#fef2f2",
        "on-error-container": "#991b1b",
        "warning-bg": "#fffbeb",
        "warning-border": "#fde68a",
        "warning-text": "#92400e",
        "warning-text-strong": "#78350f",
        "tertiary-on": "#92400e",
        "success-text": "#16a34a",

        card: "#ffffff",
        paper: { DEFAULT: "#f8fafc", card: "#ffffff" },
        nav: {
          activeBg: "#eef2ff",
          activeText: "#111827",
          activeBar: "#4f46e5",
          hover: "#f1f5f9",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
