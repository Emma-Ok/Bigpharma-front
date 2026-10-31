/** Íconos de línea de los mockups (viewBox 24×24, trazo currentColor). */
export const ICONOS = {
  anterior: '<path d="M15 6l-6 6 6 6"/>',
  siguiente: '<path d="M9 6l6 6-6 6"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'flecha-atras': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ubicacion: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  pausa: '<path d="M9 6v12M15 6v12"/>',
  reproducir: '<path d="M8 5.5v13l11-6.5z"/>',
  papelera: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  bolsa: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  camion: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  'cat-todo':
    '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  'cat-dolor': '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
  'cat-gripa': '<path d="M3 9h10a3 3 0 1 0-3-3"/><path d="M3 13h14a3 3 0 1 1-3 3"/><path d="M3 17h6"/>',
  'cat-estomago': '<path d="M7 4h10l-1.5 16h-7z"/><path d="M7.6 10h8.8"/>',
  'cat-piel':
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'cat-bebes': '<path d="M10 2h4v3h-4z"/><path d="M9 5h6l1 4v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9z"/><path d="M8 13h8"/>',
  'cat-auxilios': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2"/><path d="M12 10.5v6M9 13.5h6"/>',
  'cat-formula':
    '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9.5 16v-5h2.5a1.8 1.8 0 0 1 0 3.6H9.5"/><path d="M12 14.6l3 3"/>',
} as const;

export type NombreIcono = keyof typeof ICONOS;
