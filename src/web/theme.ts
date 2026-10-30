// Tema Neobrutalism adalah default produksi. Kern sandbox diterapkan melalui preset CSS
// terpisah (lihat kern-theme.ts), sehingga nilai default ini tidak mengubah produksi.
export const THEME = {
  ink: '#0B192C',
  inkSoft: '#26364A',
  muted: '#64748B',
  lineSoft: '#CBD5E1',
  blue: '#1D61E7',
  blueDeep: '#0F3E99',
  accent: '#FDE047',
  shadowOffset: '6px 7px 0',
  radius: '10px',
  borderW: '3px',
  font: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
} as const;

// CSS custom properties utk :root — diinjeksi setiap halaman terkonversi.
export function themeCss(): string {
  return `:root{--ink:${THEME.ink};--ink-soft:${THEME.inkSoft};--muted:${THEME.muted};--line-soft:${THEME.lineSoft};--blue:${THEME.blue};--blue-deep:${THEME.blueDeep};--accent:${THEME.accent};--shadow-offset:${THEME.shadowOffset};--radius:${THEME.radius};--border-w:${THEME.borderW};--font-ui:${THEME.font};}`;
}
