/** Elige un ambiente visual propio para cada ruta; Inicio conserva el avión existente. */
export function atmosphereForPath(pathname = '/') {
  if (pathname === '/') return null;
  if (pathname === '/destinos') return 'catalog';
  if (pathname.startsWith('/destinos/')) return 'detail';
  if (pathname === '/favoritos') return 'favorites';
  if (pathname === '/mi-viaje') return 'trip';
  if (pathname === '/checkout') return 'checkout';
  if (pathname.startsWith('/comprobante/')) return 'voucher';
  if (pathname === '/nosotros') return 'about';
  return 'not-found';
}
