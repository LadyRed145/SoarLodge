<div align="center">

<img src="./Semana%205/public/favicon.svg" alt="Emblema oficial de Soarlodge" width="104" height="104" />

# ☀️ soarlodge.

### ✈️ Viajes con chispa. Aventuras a tu manera.

**«El mundo te espera. Planea una escapada con chispa».**

Una agencia de viajes ficticia para descubrir destinos, imaginar escapadas y construir tu próximo itinerario en una experiencia cálida, dinámica y adaptable.

![React](https://img.shields.io/badge/React-19-20817F?style=flat-square&logo=react&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-FF745A?style=flat-square&logo=reactrouter&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F4B667?style=flat-square&logo=javascript&logoColor=282D36)
![API](https://img.shields.io/badge/API-REST_%2B_GraphQL-247C80?style=flat-square)
![Pruebas](https://img.shields.io/badge/Pruebas-190%2F190-358D73?style=flat-square)
![Estado](https://img.shields.io/badge/Semana_5-Verificada-FF8F68?style=flat-square)

</div>

---

## 🌞 Sobre Soarlodge

**Soarlodge** es una agencia de viajes **ficticia** desarrollada para **Desarrollo Frontend II (PFY2202) · Semana 5**. Está construida con **HTML, CSS, JavaScript, React 19 y React Router 7**; utiliza una **API REST mock** para destinos y regiones, y una **API GraphQL mock** para consultar vuelos y alojamientos.

El recorrido conecta exploración, filtros, destinos favoritos y planificación de un viaje con una confirmación de **demostración**. Sus fondos, ilustraciones y detalles animados construyen una identidad propia: tonos de sol y mar, postales, nubes, un avión viajero y una noria pastel.

> **Aviso académico:** destinos, vuelos, alojamientos, tarifas, descuentos y comprobantes se usan únicamente para demostrar la aplicación. **No se realizan pagos, emisiones de pasajes, reservas hoteleras ni transacciones reales.** El voucher no es un documento comercial o tributario.

### ✨ Funcionalidades

| Experiencia | Implementación |
| :--- | :--- |
| 🌎 **Destinos** | Catálogo REST con **9 destinos** distribuidos en **5 regiones** |
| 🔎 **Exploración** | Búsqueda por destino, país o actividad; filtros por región y ordenamiento alfabético |
| 📍 **Fichas** | Información, imágenes referenciales y acceso a opciones del destino |
| ♡ **Favoritos** | Guardado y eliminación de destinos, con persistencia en el navegador |
| ✈️ **Vuelos y hoteles** | Ofertas ficticias consultadas mediante **GraphQL**, con fechas y disponibilidad simulada |
| 🧳 **Mi viaje** | Selección persistente de destino, vuelo, alojamiento, viajeros y habitaciones |
| 🎁 **Promociones** | **8 %** por pack vuelo + hotel y **3 %** adicional para destino favorito, cuando corresponde |
| 🧾 **Checkout y voucher** | Confirmación REST con folio `SOAR-XXXXXXXX`; impresión/PDF y descarga TXT |
| ☁️ **Identidad visual** | Diseño responsive, nubes y avión animados, noria SVG y fondos temáticos por página |
| 🛡️ **Resiliencia** | Estados de carga, errores claros, reintentos, caché temporal y solicitudes deduplicadas |

## 🗂️ Estructura y versionado

La entrega se organiza dentro de **`Semana 5/`**, separando interfaz, servicios mock, pruebas y configuración. El **único README** está en la raíz del repositorio; la aplicación, las APIs y sus pruebas están dentro de `Semana 5/`. El `.gitignore` también está en la raíz.

```text
Soarlodge/
├── README.md                      # Presentación general del proyecto
├── .gitignore                     # Exclusiones del repositorio
└── Semana 5/
    ├── public/                    # Favicon e ilustraciones SVG de respaldo
    │   ├── favicon.svg
    │   ├── destinations/
    │   └── hotels/
    ├── scripts/                   # Arranque conjunto y pruebas de integración
    ├── server/                    # API REST, GraphQL y confirmación ficticia
    │   ├── handler.mjs
    │   ├── graphql-engine.mjs
    │   ├── schema.graphql
    │   └── bookings.mjs
    ├── src/
    │   ├── components/            # Tarjetas, decoración, formularios y navegación
    │   ├── context/               # Favoritos y planificador persistentes
    │   ├── hooks/                 # Consultas y estado de recursos
    │   ├── lib/                   # Clientes API, validaciones y precios
    │   ├── pages/                 # Vistas y página 404
    │   ├── styles/                # Base, accesibilidad y estilos por dispositivo
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── styles.css
    ├── evidencias/                 # Seis capturas en Brave y Firefox
    ├── tests/                      # Pruebas automatizadas
    ├── index.html
    ├── package.json
    ├── package-lock.json
    └── vite.config.js
```

| Entrega | Estado | Código |
| :--- | :--- | :--- |
| **Semana 5 · REST + GraphQL y experiencia de viaje** | ✅ Completada y verificada localmente | [📂 Abrir Semana 5](./Semana%205/) |

## 🚀 Instalación y ejecución

**Requisitos:** Node.js **20.19+**, npm y los puertos locales **5173** (Vite) y **4174** (servidor REST + GraphQL) disponibles.

Desde la **raíz de Soarlodge**, en terminal **Fish**:

```fish
cd 'Semana 5'
npm ci
npm run check
npm run dev
```

Abre **http://127.0.0.1:5173/**. `npm run dev` inicia el frontend y las dos APIs mock en un mismo entorno de desarrollo. Para detenerlos, utiliza `Ctrl+C`.

No abras `index.html` directamente: el proyecto necesita Vite y el servidor de datos.

También puedes ejecutar `npm run mock` y `npm run dev:frontend` en terminales distintas. El proxy de Vite dirige `/api` y `/graphql` al puerto **4174**.

## 🔗 APIs REST y GraphQL mock

**REST** proporciona los datos de exploración y confirma únicamente pedidos de demostración:

| Método y endpoint | Función |
| :--- | :--- |
| `GET /api/health` | Comprobar el estado del servidor mock |
| `GET /api/regions` | Consultar las 5 regiones |
| `GET /api/destinations` | Obtener los 9 destinos del catálogo |
| `GET /api/destinations?region=america` | Filtrar destinos por región |
| `GET /api/destinations?q=chile` | Buscar destinos por nombre, país, lugar o actividad |
| `GET /api/destinations/kioto` | Consultar la ficha de un destino |
| `POST /api/bookings` | Validar el viaje y generar una confirmación ficticia |

**GraphQL** utiliza `POST /graphql`, con contenido JSON y un esquema definido en `server/schema.graphql`. Sus consultas principales son `flights(destinationId: ID!)` y `hotels(destinationId: ID!)`.

Ejemplo de consulta GraphQL:

```graphql
query Viaje($destino: ID!) {
  flights(destinationId: $destino) {
    id
    airline
    departureDate
    price
    available
  }
  hotels(destinationId: $destino) {
    id
    name
    nightlyPrice
    roomsLeft
  }
}
```

En el cuerpo JSON, utiliza `"variables": {"destino": "kioto"}` junto a `"query"`. Este es un **intérprete GraphQL académico de alcance limitado**, no un servicio externo ni una implementación completa de la especificación.

Las respuestas se entregan en JSON. Los servicios validan métodos, formato y contenido; devuelven estados HTTP controlados ante solicitudes erróneas. El servidor **recalcula el precio con sus propios datos** y no acepta un total arbitrario enviado por el navegador.

## 🧭 Navegación con React Router

| Ruta | Vista |
| :--- | :--- |
| `/` | Inicio, presentación y búsqueda de aventuras |
| `/destinos` | Catálogo con regiones, búsqueda y ordenamiento |
| `/destinos/:id` | Ficha del destino, vuelos y alojamientos |
| `/favoritos` | Destinos guardados |
| `/mi-viaje` | Resumen y edición del itinerario |
| `/checkout` | Confirmación de prueba y revisión del total |
| `/comprobante/:id` | Voucher generado para la simulación |
| `/nosotros` | Presentación de Soarlodge |
| Ruta desconocida | Página 404 personalizada |

La búsqueda desde Inicio reconoce destinos, países y regiones; cuando corresponde, lleva al resultado o a la ficha pertinente. El catálogo también puede dirigir hacia vuelos u hoteles de una ficha concreta.

## 🧳 Planificador, promociones y comprobante

El recorrido completo se puede demostrar sin pagos ni cuentas de usuario:

1. **Explorar.** Buscar un destino, consultar su ficha y, si se desea, guardarlo como favorito.
2. **Elegir.** Consultar vuelos y hoteles de demostración mediante GraphQL, seleccionar fechas compatibles y ajustar de **1 a 6 viajeros** y **1 a 4 habitaciones**.
3. **Revisar.** En **Mi viaje**, comprobar los detalles seleccionados, cambiar opciones o limpiar la selección.
4. **Aplicar promociones.** Cuando el viaje incluye **vuelo + hotel**, el cálculo contempla **8 %** de descuento sobre el subtotal y **3 % adicional** si el destino está en favoritos. Los descuentos no se aplican a una compra de solo vuelo o solo alojamiento.
5. **Confirmar una simulación.** Introducir un nombre y correo válidos, escoger tarjeta o transferencia **simuladas** y aceptar expresamente la naturaleza académica de la operación. `POST /api/bookings` valida fechas, cupos y tarifas.
6. **Consultar el voucher.** El servidor devuelve un folio `SOAR-XXXXXXXX`; el documento puede **imprimirse**, **guardarse como PDF** desde el navegador o **descargarse en TXT**.

**Persistencia y privacidad:** `localStorage` conserva los identificadores de favoritos, el plan de viaje y el **último voucher**. Los datos del nombre y correo introducidos en el formulario **no forman parte del voucher guardado**; el servidor mock no almacena clientes ni efectúa cobros o reservas. Si se borran los datos del navegador, también se pierden esas selecciones locales.

## 🛡️ Errores, carga y eficiencia

- Indicadores de carga, mensajes de estado y vistas vacías donde corresponde.
- Errores comprensibles ante fallos REST/GraphQL, respuestas inválidas, errores HTTP y falta de conexión.
- Acciones de **Reintentar** para recuperar datos sin recargar toda la aplicación.
- Caché temporal de **60 segundos** y **deduplicación de solicitudes simultáneas** para REST y GraphQL.
- Búsqueda, filtros y ordenamiento aplicados sobre el catálogo cargado, evitando peticiones repetidas innecesarias.
- Tiempo máximo de espera de solicitudes de **8 segundos**; las respuestas fallidas no quedan guardadas en la caché.

**Escenarios para probar con la aplicación iniciada:**

| URL local o acción | Resultado esperado |
| :--- | :--- |
| `/destinos?demoError=500` | Error REST 500 simulado |
| `/destinos?demoError=404` | Error REST 404 simulado |
| `/destinos/no-existe` | Destino no encontrado |
| Buscar un texto sin coincidencias | Estado sin resultados |

## 📱 Presentación responsive

Soarlodge mantiene una **única aplicación React** y organiza sus estilos por rango de pantalla, sin duplicar las páginas:

| Presentación | Archivo principal |
| :--- | :--- |
| Móvil, hasta **760 px** | `src/styles/responsive/mobile.css` |
| Tablet, de **761 a 1024 px** | `src/styles/responsive/tablet.css` |
| Escritorio, desde **1025 px** | `src/styles/base.css`, con ajustes de `desktop.css` |
| Ajustes compartidos | `src/styles/responsive/compact.css` |
| Accesibilidad e impresión | `src/styles/accessibility.css` |

La experiencia visual incluye una **noria SVG** en Destinos, nubes y avión animados en Mi viaje, recursos decorativos por lugar, y pasillos móviles estilizados en Checkout. Las capas visuales no interceptan clics, contemplan `prefers-reduced-motion` y se ocultan o simplifican al imprimir.

Los ajustes recientes alinean las tarjetas y botones de **Mi viaje** en PC y tablet, preservando el espacio lateral para las nubecitas y el avión. Las vistas se comprobaron en diferentes anchuras, sin desbordamiento horizontal en los tamaños verificados.

## 🧪 Pruebas y compilación

```fish
# Dentro de Semana 5
npm run test
npm run build

# Validación integral: pruebas + API + proxy + compilación
npm run check
```

**Resultados registrados en la versión corregida (22 de noviembre de 2026):**

| Comprobación | Resultado |
| :--- | :--- |
| Pruebas automatizadas | ✅ **190/190 aprobadas**, sin fallos |
| Smoke API REST | ✅ Salud, catálogo y respuestas HTTP |
| Smoke GraphQL | ✅ Vuelos y hoteles por destino |
| Smoke de checkout | ✅ Voucher ficticio, sin cobro |
| Integración Vite/proxy | ✅ Frontend, REST, GraphQL y errores controlados |
| Compilación de producción | ✅ **Vite 7.3.7 · 87 módulos transformados** |
| Revisión de presentación | ✅ Seis capturas de Destinos: Brave y Firefox en PC, tablet y móvil (ver tabla de evidencias) |

`dist/` es una salida generada por Vite y está excluida del control de versiones mediante `.gitignore`.

## 🌐 Publicación (GitHub Pages + API mock)

**GitHub Pages solo aloja archivos estáticos.** Para que catálogo, vuelos y voucher funcionen desde el sitio público, este repositorio separa el despliegue del frontend y del servidor Node mock:

1. Publica la API Node en Render usando el `render.yaml` de la raíz como **Blueprint**. La API debe responder `https://TU-SERVICIO.onrender.com/api/health`. Puedes elegir otro proveedor Node compatible; no es obligatorio Render.
2. En GitHub → **Settings → Secrets and variables → Actions → Variables**, crea la variable `SOARLODGE_API_ORIGIN` con la URL HTTPS de la API (solo origen, sin `/api`, `/graphql` ni barra final).
3. En GitHub → **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**.
4. En **Actions**, ejecuta el flujo **Publicar Soarlodge en GitHub Pages**, o haz un nuevo push a `main`. El workflow corre `npm run check`, compila con la ruta pública del repositorio y publica `dist/`.
5. Comprueba el sitio `https://ladyred145.github.io/SoarLodge/` y prueba un destino, un vuelo, un hotel y el voucher DEMO. En Pages las rutas usan `#/...` para permitir recargas y enlaces directos.

La API real sigue siendo **mock**: precios y reservas son ficticios. El servidor recalcula los totales. Si usas el servicio gratuito de Render, podría suspenderse por inactividad y la primera consulta podría demorar; abre `/api/health` para despertarlo antes de la demostración. **Hasta que el proveedor y la variable estén configurados, Pages no está operativo.**

### Navegadores y evidencia

La pauta no fija una cantidad exacta de navegadores. Se documentó la **vista Destinos** en Brave (Chromium) y Firefox (Gecko), en PC, tablet y móvil. Las seis imágenes están en `Semana 5/evidencias/`:

| Dispositivo | Brave | Firefox |
| :--- | :--- | :--- |
| **PC** | [📸 Captura](./Semana%205/evidencias/brave-pc.png) | [📸 Captura](./Semana%205/evidencias/firefox-pc.png) |
| **Tablet** | [📸 Captura](./Semana%205/evidencias/brave-tablet.png) | [📸 Captura](./Semana%205/evidencias/firefox-tablet.png) |
| **Móvil** | [📸 Captura](./Semana%205/evidencias/brave-movil.png) | [📸 Captura](./Semana%205/evidencias/firefox-movil.png) |

Las capturas son **evidencia visual de una página**, no sustituyen pruebas funcionales de todas las rutas. Además, el despliegue en Pages con API pública deberá verificarse por separado una vez configurado.

## 🎯 Correspondencia con los objetivos técnicos

| Área | Evidencia del proyecto |
| :--- | :--- |
| **Consumo REST** | `server/handler.mjs`, `src/lib/api.js` y catálogo de Destinos |
| **Consultas GraphQL** | `server/schema.graphql`, `server/graphql-engine.mjs` y opciones de viaje |
| **Estados y errores** | `useApiResource.js`, `useGraphQLResource.js` y `ResourceStatus.jsx` |
| **Optimización** | Caché TTL de 60 s, solicitudes concurrentes compartidas y filtros locales |
| **Enrutamiento** | `src/App.jsx` y `src/components/SiteLayout.jsx` |
| **Estado persistente** | `FavoritesContext.jsx` y `TripPlannerContext.jsx` |
| **Confirmación ficticia** | `server/bookings.mjs`, `Checkout.jsx` y `Voucher.jsx` |
| **Responsive y accesibilidad** | CSS por dispositivo, decoraciones accesibles y pruebas de regresión |

Esta tabla resume la implementación técnica; **no supone una calificación ni una validación de puntajes de la rúbrica docente**.

## ✅ Checklist de Semana 5

- [x] Catálogo REST con **9 destinos** y **5 regiones**.
- [x] Navegación React Router, búsqueda, filtros y ordenamiento.
- [x] Consulta GraphQL de vuelos y hoteles ficticios.
- [x] Favoritos y planificador persistentes entre páginas.
- [x] Validaciones de selección, disponibilidad y checkout.
- [x] Descuentos de demostración y voucher imprimible/descargable.
- [x] Diseño Soarlodge adaptable a móvil, tablet y escritorio.
- [x] Errores, cargas, reintentos y caché optimizada.
- [x] **190/190 pruebas** aprobadas, smoke tests y build exitosos.

---

<div align="center">

### ☀️ S O A R L O D G E ✈️

*Un poquito de sol, muchos lugares por descubrir.*

**Desarrollo Frontend II · PFY2202 · Semana 5**

**100 % experiencia de demostración.**

</div>
