import { DESTINATION_MOTIFS } from '../lib/destination-motifs.js';

/**
 * Nueve insignias repartidas por el fondo COMPLETO de la vista Destinos.
 * Un símbolo por destino. Solo presentación: sin controles, eventos ni peticiones.
 */
export default function CatalogMotifs() {
  return <div className="catalog-motif-constellation" aria-hidden="true" data-catalog-motifs="nine-destinations">
    {Object.entries(DESTINATION_MOTIFS).map(([destinationId, motifs], index) =>
      <span className={`catalog-motif catalog-motif--${index + 1}`} key={destinationId} data-destination={destinationId}>
        <span className="catalog-motif__icon">{motifs[0]}</span>
      </span>
    )}
  </div>;
}
