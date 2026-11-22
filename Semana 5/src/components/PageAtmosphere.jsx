import { atmosphereForPath } from '../lib/atmosphere.js';
import TripSkyScene from './TripSkyScene.jsx';
import DestinationMotifs from './DestinationMotifs.jsx';
import AboutTravelBackdrop from './AboutTravelBackdrop.jsx';
import CatalogMotifs from './CatalogMotifs.jsx';
import CheckoutWalkways from './CheckoutWalkways.jsx';

/** Ambiente decorativo por página. Animaciones CSS de bajo costo, sin eventos ni estado. */
export default function PageAtmosphere({ pathname }) {
  const variant = atmosphereForPath(pathname);
  if (!variant) return null; // Inicio sigue utilizando exclusivamente HeroFlightTrail.

  return <div className={`page-atmosphere page-atmosphere--${variant}`} aria-hidden="true" data-atmosphere={variant}>
    {variant === 'trip' ? <TripSkyScene /> : variant === 'detail' ? <DestinationMotifs pathname={pathname} /> : variant === 'about' ? <AboutTravelBackdrop /> : variant === 'checkout' ? <>
      <CheckoutWalkways />
      <span className="page-atmosphere__shape page-atmosphere__shape--b" />
    </> : <>
      <span className="page-atmosphere__shape page-atmosphere__shape--a" />
      <span className="page-atmosphere__shape page-atmosphere__shape--b" />
      <span className="page-atmosphere__shape page-atmosphere__shape--c" />
      {variant === 'favorites' && <>
        <span className="page-atmosphere__shape page-atmosphere__shape--d" />
        <span className="page-atmosphere__shape page-atmosphere__shape--e" />
      </>}
      {variant === 'catalog' && <CatalogMotifs />}
    </>}
  </div>;
}
