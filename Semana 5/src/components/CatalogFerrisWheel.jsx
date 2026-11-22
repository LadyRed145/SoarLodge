/** Noria decorativa del catálogo: ocho góndolas niveladas en todo momento. */
const cabins = [
  { x: 90, y: 22, color: '#ffb69d' },
  { x: 132, y: 40, color: '#ffe1a4' },
  { x: 150, y: 82, color: '#b8e9de' },
  { x: 132, y: 124, color: '#cdbfee' },
  { x: 90, y: 142, color: '#ffb69d' },
  { x: 48, y: 124, color: '#ffe1a4' },
  { x: 30, y: 82, color: '#b8e9de' },
  { x: 48, y: 40, color: '#cdbfee' },
];

export default function CatalogFerrisWheel() {
  return <svg className="catalog-ferris-wheel" viewBox="0 0 180 180" role="presentation" focusable="false" aria-hidden="true">
    <ellipse cx="90" cy="162" rx="39" ry="5" fill="#74a9a0" opacity=".18"/>
    <path d="M90 81 65 157 M90 81l25 76" fill="none" stroke="#f8a37a" strokeWidth="4.5" strokeLinecap="round"/>
    <path d="M62 159h56" stroke="#ef9376" strokeWidth="5" strokeLinecap="round"/>
    <g className="catalog-ferris-wheel__rotor">
      <circle cx="90" cy="82" r="60" fill="none" stroke="#fffdf6" strokeWidth="5"/>
      <circle cx="90" cy="82" r="54" fill="none" stroke="#64bab0" strokeWidth="2.5" strokeDasharray="2 5" opacity=".85"/>
      {cabins.map(({x,y}, i) => <line key={`spoke-${i}`} x1="90" y1="82" x2={x} y2={y} stroke={i%2 ? '#f5b08d' : '#8ccdc1'} strokeWidth="2.5" strokeLinecap="round"/>)}
      <circle cx="90" cy="82" r="10" fill="#ffce82" stroke="#fff8e7" strokeWidth="3"/>
      <circle cx="90" cy="82" r="3" fill="#358987"/>
      {cabins.map(({x,y,color}, i) => <g key={`cabin-${i}`} transform={`translate(${x} ${y})`}>
        <g className="catalog-ferris-wheel__cabin">
          <path d="M-8 -8h16l3 4H-11Z" fill="#fffdf2" opacity=".94"/>
          <path d="M-9 -3H9L7 10Q0 14-7 10Z" fill={color} stroke="#fff8ed" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M-3 0v5m6-5v5" stroke="#ffffffc0" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      </g>)}
    </g>
  </svg>;
}
