import { useState, useEffect } from 'react';
/** Imagen con respaldo local: evita tarjetas vacías cuando falla una foto externa. */
export default function Photo({ src, fallback, alt, className = '', loading = 'lazy' }) {
  const [current, setCurrent] = useState(src);
  useEffect(() => setCurrent(src), [src]);
  return <img src={current} alt={alt} className={className} loading={loading} decoding="async" onError={() => {
    if (current !== fallback) setCurrent(fallback);
  }} />;
}
