import { BrowserRouter, HashRouter, Route, Routes } from 'react-router';
import SiteLayout from './components/SiteLayout.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import DestinationDetail from './pages/DestinationDetail.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import TripReview from './pages/TripReview.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import Favorites from './pages/Favorites.jsx';
import Checkout from './pages/Checkout.jsx';
import Voucher from './pages/Voucher.jsx';
import { TripPlannerProvider } from './context/TripPlannerContext.jsx';

/** BrowserRouter en local; HashRouter solo en Pages para soportar rutas directas. */
const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter;

export default function App() {
  return (
    <FavoritesProvider>
      <TripPlannerProvider>
        <Router>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="destinos" element={<Catalog />} />
              <Route path="destinos/:id" element={<DestinationDetail />} />
              <Route path="nosotros" element={<About />} />
              <Route path="mi-viaje" element={<TripReview />} />
              <Route path="favoritos" element={<Favorites />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="comprobante/:id" element={<Voucher />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </TripPlannerProvider>
    </FavoritesProvider>
  );
}
