import type { Config } from "tailwindcss";

// Every semantic color is backed by a CSS variable holding "R G B" channels,
// so opacity modifiers (e.g. bg-surface/95) keep working and the whole palette
// can flip under the `.dark` class (see globals.css :root / .dark).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
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
        // === Enterprise palette (CSS-variable backed; flips in dark mode) ===
        canvas: v("canvas"),
        surface: v("surface"),
        line: v("line"),
        "line-strong": v("line-strong"),
        ink: {
          DEFAULT: v("ink"),
          soft: v("ink-soft"),
          muted: v("ink-muted"),
          subtle: v("ink-subtle"),
          faint: v("ink-faint"),
        },
        accent: {
          DEFAULT: v("accent"),
          hover: v("accent-hover"),
          soft: v("accent-soft"),
          softer: v("accent-softer"),
          border: v("accent-border"),
          text: v("accent-text"),
        },
        warn: {
          bg: v("warn-bg"),
          softer: v("warn-softer"),
          border: v("warn-border"),
          text: v("warn-text"),
          textStrong: v("warn-text-strong"),
          solid: v("warn-solid"),
        },
        danger: {
          bg: v("danger-bg"),
          softer: v("danger-softer"),
          border: v("danger-border"),
          text: v("danger-text"),
          textStrong: v("danger-text-strong"),
          solid: v("danger-solid"),
        },
        ok: {
          bg: v("ok-bg"),
          border: v("ok-border"),
          text: v("ok-text"),
          solid: v("ok-solid"),
        },

        // === Backwards-compat aliases (map to the same variables) ===
        background: v("canvas"),
        "on-background": v("ink"),
        "on-surface": v("ink"),
        "on-surface-variant": v("ink-muted"),
        outline: v("ink-subtle"),
        "outline-variant": v("line"),
        "surface-bright": v("surface"),
        "surface-dim": v("surface-dim"),
        "surface-container-lowest": v("surface"),
        "surface-container-low": v("canvas"),
        "surface-container": v("surface-container"),
        "surface-container-high": v("surface-container-high"),
        "surface-container-highest": v("surface-container-highest"),
        "surface-variant": v("surface-container"),
        primary: v("ink"),
        "on-primary": v("white"),
        "primary-container": v("accent"),
        "on-primary-container": v("white"),
        secondary: v("accent"),
        "secondary-container": v("accent-soft"),
        "on-secondary-container": v("accent-text"),
        error: v("danger-solid"),
        "on-error": v("white"),
        "error-container": v("danger-bg"),
        "on-error-container": v("danger-text"),
        "warning-bg": v("warn-bg"),
        "warning-border": v("warn-border"),
        "warning-text": v("warn-text"),
        "warning-text-strong": v("warn-text-strong"),
        "tertiary-on": v("warn-text"),
        "success-text": v("ok-solid"),

        card: v("surface"),
        paper: { DEFAULT: v("canvas"), card: v("surface") },
        nav: {
          activeBg: v("accent-soft"),
          activeText: v("ink"),
          activeBar: v("accent"),
          hover: v("surface-container"),
        },
        white: v("white"),
      },
    },
  },
  plugins: [],
} satisfies Config;
