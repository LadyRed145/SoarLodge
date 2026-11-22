import { useEffect, useRef } from 'react';
import { peekDistance, tripSkyAt } from '../lib/trip-sky-choreography.js';

/** Avión de Inicio: misma silueta, ahora guiada por una coreografía real. */
function AirplaneShape() {
  return <svg className="trip-sky__airplane" viewBox="0 0 64 64" focusable="false" aria-hidden="true">
    <path className="hero-plane-outline" d="M60 32c0-3-3.5-5.1-9-5.6l-14-1.6L24 5c-1-1.8-2.6-2.8-5-2.8h-6l8 24.9-10.4 1.4-5-6.3H1.7l3.7 9.8-3.7 9.8h3.9l5-6.3L21 36.9l-8 24.9h6c2.4 0 4-1 5-2.8l13-19.8 14-1.6c5.5-.5 9-2.6 9-5.6Z" />
    <path className="hero-plane-highlight" d="M22 31.9h25" />
    <circle cx="50.5" cy="31.9" r="2.3" fill="#ffd16e" />
  </svg>;
}

function PastelCloud({ color, foreground = false }) {
  return <div className={`trip-cloud trip-cloud--${color}${foreground ? ' trip-cloud--foreground' : ''}`}>
    <svg viewBox="0 0 230 125" focusable="false" aria-hidden="true">
      <path className="trip-cloud__body" d="M35 99C17 99 5 86 5 70c0-16 12-28 28-29C38 19 56 5 79 5c19 0 35 10 42 26 9-7 19-11 31-11 24 0 43 17 46 40 14 3 23 16 23 29 0 18-14 30-32 30H35Z" />
      <path className="trip-cloud__shine" d="M31 68c2-10 9-16 19-18M62 28c8-7 18-10 29-7" />
    </svg>
  </div>;
}


const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

function planePresence(point) {
  if (!point) return 0;
  if (point.kind === 'peek') {
    return clamp(Math.pow(peekDistance(point.progress), 0.92));
  }
  const progress = clamp(point.progress);
  if (progress < 0.12) return ease(progress / 0.12);
  if (progress > 0.88) return ease((1 - progress) / 0.12);
  return 1;
}

/**
 * Escena decorativa: las nubes flotan con CSS; un único avión sigue las
 * distintas fases, reaparece por donde se escondió y usa las rutas del Inicio.
 * Sin actualizaciones de React en cada fotograma ni interacción con la página.
 */
export default function TripSkyScene() {
  const skyRef = useRef(null);
  const planeRef = useRef(null);

  useEffect(() => {
    const sky = skyRef.current;
    const plane = planeRef.current;
    if (!sky || !plane) return undefined;

    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = Boolean(motion?.matches);
    let visible = true;
    let raf = 0;
    let startAt = null;
    let width = 1;
    let height = 1;

    const resize = () => {
      const bounds = sky.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
    };

    function tick(now) {
      if (reduceMotion || document.hidden || !visible) return;
      if (startAt === null) startAt = now;
      const point = tripSkyAt(now - startAt, width, height);
      if (point) {
        const presence = planePresence(point);
        plane.style.visibility = 'visible';
        plane.style.opacity = String(presence);
        plane.style.filter = `drop-shadow(0 7px 14px rgba(128, 184, 175, ${0.22 + presence * 0.18})) blur(${(1 - presence) * 1.6}px)`;
        plane.style.transform = `translate3d(${point.x - 29}px, ${point.y - 29}px, 0) rotate(${point.angle}deg) scale(${0.95 + presence * 0.05})`;
        plane.dataset.mode = point.kind;
      } else {
        plane.style.visibility = 'hidden';
        plane.style.opacity = '0';
        plane.style.filter = 'drop-shadow(0 7px 14px rgba(128, 184, 175, 0.22))';
        plane.dataset.mode = 'pause';
      }
      raf = window.requestAnimationFrame(tick);
    }

    const refresh = () => {
      window.cancelAnimationFrame(raf);
      raf = 0;
      startAt = null;
      plane.style.visibility = 'hidden';
      plane.style.opacity = '0';
      plane.style.filter = 'drop-shadow(0 7px 14px rgba(128, 184, 175, 0.22))';
      if (!reduceMotion && !document.hidden && visible) raf = window.requestAnimationFrame(tick);
    };
    const onMotionChange = () => { reduceMotion = Boolean(motion?.matches); refresh(); };

    resize();
    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize);
      observer.observe(sky);
    } else window.addEventListener('resize', resize);

    let visibilityObserver;
    if (typeof IntersectionObserver !== 'undefined') {
      visibilityObserver = new IntersectionObserver((entries) => {
        const next = entries[0]?.isIntersecting ?? true;
        if (next !== visible) { visible = next; refresh(); }
      }, { threshold: 0.01 });
      visibilityObserver.observe(sky);
    }

    motion?.addEventListener?.('change', onMotionChange);
    document.addEventListener('visibilitychange', refresh);
    refresh();
    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
      visibilityObserver?.disconnect();
      if (!observer) window.removeEventListener('resize', resize);
      motion?.removeEventListener?.('change', onMotionChange);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return <div className="trip-sky" ref={skyRef} data-trip-sky="hide-and-seek" aria-hidden="true">
    <div className="trip-sky__back">
      <PastelCloud color="lilac" /><PastelCloud color="butter" /><PastelCloud color="blue" />
    </div>
    <div className="trip-sky__plane" ref={planeRef} data-mode="pause" style={{ visibility: 'hidden' }}>
      <span className="trip-sky__sparkle trip-sky__sparkle--one" />
      <span className="trip-sky__sparkle trip-sky__sparkle--two" />
      <AirplaneShape />
    </div>
    <div className="trip-sky__front">
      <PastelCloud color="mint" foreground />
      <PastelCloud color="peach" foreground />
    </div>
  </div>;
}
