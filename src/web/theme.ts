// Utas tema global (rencana 2026-10-29): satu sumber identitas visual.
// Nilai = persis nilai neobrutalism saat ini — mengubah di sini mengubah semua halaman
// yang sudah dikonversi. Halaman belum dikonversi masih memakai hex literal.
export const THEME = {
  ink: '#0B192C',        // teks utama & outline tebal
  inkSoft: '#26364A',    // teks sekunder + warna hard shadow
  muted: '#64748B',      // teks redup
  lineSoft: '#CBD5E1',   // garis pemisah halus
  blue: '#1D61E7',       // aksi utama (cobalt)
  blueDeep: '#0F3E99',   // teks di atas kuning / aksi gelap
  accent: '#FDE047',     // kuning marker (mode pasar)
  shadowOffset: '6px 7px 0', // offset hard shadow khas neobrutalism
  radius: '10px',        // penyudut kartu
  borderW: '3px',        // tebal outline
  font: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
} as const;

// CSS custom properties utk :root — diinjeksi setiap halaman terkonversi.
export function themeCss(): string {
  return `:root{--ink:${THEME.ink};--ink-soft:${THEME.inkSoft};--muted:${THEME.muted};--line-soft:${THEME.lineSoft};--blue:${THEME.blue};--blue-deep:${THEME.blueDeep};--accent:${THEME.accent};--shadow-offset:${THEME.shadowOffset};--radius:${THEME.radius};--border-w:${THEME.borderW};--font-ui:${THEME.font};}`;
}
