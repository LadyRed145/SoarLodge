/**
 * Sellos y postales decorativos de la historia de Soarlodge.
 * No hay elementos interactivos, ni información sobre reservas reales.
 */
export default function AboutTravelBackdrop() {
  return <div className="about-travel-backdrop" aria-hidden="true" data-about-backdrop="passport-postcards">
    <div className="about-travel-backdrop__route">
      <svg viewBox="0 0 780 260" preserveAspectRatio="none" focusable="false">
        <path d="M-8 170C135 64 228 255 391 125S670 38 790 90"/>
      </svg>
    </div>
    <div className="about-passport-stamp about-passport-stamp--one">
      <span className="about-passport-stamp__top">SOARLODGE · EXPLORE</span>
      <span className="about-passport-stamp__icon">✈</span>
      <span className="about-passport-stamp__bottom">VIAJES CON CHISPA</span>
    </div>
    <div className="about-passport-stamp about-passport-stamp--two">
      <span className="about-passport-stamp__top">POSTALES DEL MUNDO</span>
      <span className="about-passport-stamp__icon">✦</span>
      <span className="about-passport-stamp__bottom">EXPLORA · DESCUBRE</span>
    </div>
    <div className="about-postcard">
      <span className="about-postcard__corner">✧</span>
      <span className="about-postcard__hill"/>
      <span className="about-postcard__sun"/>
      <span className="about-postcard__caption">HOLA, MUNDO</span>
    </div>
    <div className="about-compass">
      <span className="about-compass__north">N</span>
      <span className="about-compass__rose">✦</span>
      <span className="about-compass__south">S</span>
    </div>
  </div>;
}
