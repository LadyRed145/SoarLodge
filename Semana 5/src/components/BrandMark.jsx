import { useId } from 'react';
/** Monograma de Soarlodge: sol, sendero y horizonte, cálido y propio. */
export default function BrandMark({ className = '' }) {
  const unique = useId().replaceAll(':', '');
  const bgId = `soarlodge-bg-${unique}`;
  const waveId = `soarlodge-wave-${unique}`;
  return <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={bgId} x1="12" y1="10" x2="68" y2="70" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ff8f68"/>
        <stop offset="1" stopColor="#ffc76d"/>
      </linearGradient>
      <linearGradient id={waveId} x1="19" y1="31" x2="60" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1f8b88"/>
        <stop offset="1" stopColor="#83d4c4"/>
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="64" height="64" rx="21" fill={`url(#${bgId})`} transform="rotate(-8 40 40)"/>
    <circle cx="53" cy="25" r="7" fill="#fff5d9" opacity=".95"/>
    <path d="M18 51c7-7 16-11 27-11 9 0 18 3 26 9" stroke={`url(#${waveId})`} strokeWidth="4.6" strokeLinecap="round"/>
    <path d="M20 60c11-4 22-6 33-6 8 0 16 1 24 4" stroke="#fff7e8" strokeWidth="3.2" strokeLinecap="round" opacity=".92"/>
    <path d="M24 22c7 3 12 8 15 15" stroke="#fff7ea" strokeWidth="2.8" strokeLinecap="round" strokeDasharray="1 7"/>
    <path d="m41 39 5.8 1.2-3.6 4.3-.4-2.7-2.7-.8Z" fill="#fff7ea"/>
  </svg>;
}
