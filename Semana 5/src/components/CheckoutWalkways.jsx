/**
 * Tres pasillos móviles de aeropuerto en el margen del checkout.
 * Son solamente ambientación: no contienen texto, controles ni eventos.
 * Sus superficies avanzan en una dirección y se detienen con movimiento reducido.
 */
export default function CheckoutWalkways() {
  return <div className="checkout-moving-walkways" data-checkout-decoration="moving-walkways" aria-hidden="true">
    <span className="checkout-moving-walkway checkout-moving-walkway--one" />
    <span className="checkout-moving-walkway checkout-moving-walkway--two" />
    <span className="checkout-moving-walkway checkout-moving-walkway--three" />
  </div>;
}
