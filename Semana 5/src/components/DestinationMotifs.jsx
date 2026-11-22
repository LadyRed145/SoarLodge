import { motifsForPath } from '../lib/destination-motifs.js';

/**
 * Pequeñas postales flotantes por destino. Presentación pura: sin eventos,
 * temporizadores, estados, peticiones ni cambios en la navegación.
 */
export default function DestinationMotifs({ pathname }) {
  const motifs = motifsForPath(pathname);
  if (!motifs) return null;

  return <div className="destination-motifs" aria-hidden="true" data-destination-motifs="true">
    {motifs.map((symbol, index) => <span className={`destination-motif destination-motif--${index + 1}`} key={`${index}-${symbol}`}>
      <span className="destination-motif__symbol">{symbol}</span>
    </span>)}
  </div>;
}
