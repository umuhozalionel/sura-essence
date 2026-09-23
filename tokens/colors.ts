/**
 * SURA Essence palette.
 *
 * `brand` holds the two identity colours; `colors` maps the semantic
 * shadcn slots onto them. Changing a brand value in app/globals.css
 * updates every semantic class site-wide.
 */
export const brand = {
  green: "#125740",       // primary   — 8.53:1 on white
  greenDeep: "#0E4231",   // green, pressed/hover
  gold: "#EAB308",        // secondary — 10.04:1 on ink; never on white
  goldDeep: "#CA9A04",    // gold, pressed/hover
  ink: "#0A1128",
  white: "#FFFFFF",
  /** Sampled from public/brand/sura-logo.png, if you want the exact mark. */
  logoGreen: "#0B4F46",
} as const;

export const colors = {
  background: "var(--color-background)",
  foreground: "var(--color-foreground)",
  primary: "var(--color-primary)",
  primaryForeground: "var(--color-primary-foreground)",
  secondary: "var(--color-secondary)",
  accent: "var(--color-accent)",
  destructive: "var(--color-destructive)",
  border: "var(--color-border)"
};