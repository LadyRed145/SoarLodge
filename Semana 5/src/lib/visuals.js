import { assetPath } from './asset-path.js';
/** Fotos referenciales con licencia Unsplash. No retratan las ofertas ficticias.
 * En caso de no haber conexión, se presentan las ilustraciones locales existentes.
 */
const photos = Object.freeze({
  'torres-del-paine': ['photo-1741388033008-effb52da2d38', 'Mattia Marinangeli'],
  kioto: ['photo-1758940887296-f564f07e295d', 'Ran Ding'],
  reikiavik: ['photo-1787946178574-190abf6472fb', 'Nir Himi'],
  lisboa: ['photo-1748279944004-f1d733dc711b', 'Aleksandr Zaitsev'],
  marrakech: ['photo-1770970389629-86cac3ef3e12', 'Val Vesa'],
  bali: ['photo-1735991087874-febd3c05544e', 'Jeremy Wermeille'],
  banff: ['photo-1531764411937-45495415d84d', 'Ryan Stone'],
  tofino: ['photo-1507525428034-b723cf961d3e', 'Jeremy Bishop'],
  sydney: ['photo-1719402715882-46a5120d491c', 'Dominic Kurniawan Suryaputra'],
});
const hotelPhotos = Object.freeze({
  'refugio': ['photo-1689729739836-7fcc2c84d788', 'Sidath Vimukthi'],
  'boutique': ['photo-1777383504729-bd8364d28de8', 'Khanh Do'],
});
function makeUrl(photoId, width = 1100) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}
export const destinationPhotoIds = Object.freeze(Object.keys(photos));
export function destinationVisual(id) {
  const data = photos[id];
  return {
    src: data ? makeUrl(data[0]) : assetPath(`destinations/${id}.svg`),
    fallback: assetPath(`destinations/${id}.svg`),
    credit: data ? data[1] : 'Ilustración Soarlodge',
  };
}
export function hotelVisual(hotelId) {
  const boutique = hotelId?.endsWith('-2');
  const data = hotelPhotos[boutique ? 'boutique' : 'refugio'];
  return {
    src: makeUrl(data[0], 850),
    fallback: assetPath(`hotels/${boutique ? 'escapada-boutique' : 'refugio-hotel'}.svg`),
    credit: data[1],
  };
}
