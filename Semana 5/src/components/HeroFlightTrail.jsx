import { useEffect, useRef } from 'react';
import { flightAt } from '../lib/flight-routes.js';

const COLORS = ['#fa7759', '#f39b56', '#ffcd64', '#197f7e', '#7bc8b9', '#fff3d8'];
const MAX_PARTICLES = 95;

function createParticle(plane, index) {
  const angle = plane.angle * Math.PI / 180;
  const sideways = angle - Math.PI / 2;
  const drift = (Math.random() - 0.5) * 1.8;
  const behind = 24 + Math.random() * 10;
  const offset = drift * 6;
  return {
    x: plane.x - Math.cos(angle) * behind + Math.cos(sideways) * offset,
    y: plane.y - Math.sin(angle) * behind + Math.sin(sideways) * offset,
    dx: -Math.cos(angle) * (0.012 + Math.random() * 0.025) + Math.cos(sideways) * drift * 0.018,
    dy: -Math.sin(angle) * (0.012 + Math.random() * 0.025) + Math.sin(sideways) * drift * 0.018 - 0.010,
    size: 1.7 + Math.random() * 2.7,
    age: 0,
    duration: 1550 + Math.random() * 1100,
    pulse: Math.random() * Math.PI * 2,
    color: COLORS[index % COLORS.length],
  };
}

function drawParticle(ctx, particle, delta) {
  particle.age += delta;
  if (particle.age >= particle.duration) return false;

  particle.x += particle.dx * delta;
  particle.y += particle.dy * delta + Math.sin(particle.pulse + particle.age / 250) * delta * 0.007;

  const progress = particle.age / particle.duration;
  const fade = (1 - progress) ** 1.6;
  const twinkle = 0.83 + 0.17 * Math.sin(particle.pulse + particle.age / 175);
  const radius = particle.size * (1 - 0.35 * progress);
  ctx.globalAlpha = Math.min(0.8, fade * twinkle * 0.75);
  ctx.shadowColor = particle.color;
  ctx.shadowBlur = 9;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, Math.max(radius, 0.75), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  return true;
}

/** Animación exclusivamente decorativa: no modifica el estado React por frame. */
export default function HeroFlightTrail() {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const planeRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrapper || !ctx || !plane) return undefined;

    const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = Boolean(motionPreference?.matches);
    let raf = 0;
    let playing = true;
    let visible = true;
    let frameOrigin = null;
    let lastFrame = null;
    let lastEmission = 0;
    let lastRoute = null;
    let particles = [];
    let width = 1;
    let height = 1;

    const resize = () => {
      const bounds = wrapper.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.25 : 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const showStillPlane = () => {
      wrapper.dataset.depth = 'behind';
      plane.style.visibility = 'visible';
      plane.style.transform = `translate3d(${width * 0.70 - 22}px, ${height * 0.17 - 22}px, 0) rotate(-9deg)`;
      ctx.clearRect(0, 0, width, height);
    };

    function frame(now) {
      if (!playing || reduceMotion || !visible) return;
      if (frameOrigin === null) frameOrigin = now;
      if (lastFrame === null) lastFrame = now;
      const delta = Math.min(Math.max(now - lastFrame, 0), 50);
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);

      const route = flightAt(now - frameOrigin, width, height);
      if (route) {
        // Cambia la profundidad en cada ruta, sin mover el collage ni los textos.
        // Se alternan el avión Y su estela para que ambos pasen detrás o delante.
        if (wrapper.dataset.depth !== route.depth) wrapper.dataset.depth = route.depth;
        plane.style.visibility = 'visible';
        plane.style.transform = `translate3d(${route.x - 22}px, ${route.y - 22}px, 0) rotate(${route.angle}deg)`;
        // Nunca se emiten partículas durante una escala ni en una entrada repentina.
        if (lastRoute === route.route && now - lastEmission >= 75 && route.progress > 0.035 && route.progress < 0.985) {
          for (let i = 0; i < 2; i += 1) {
            particles.push(createParticle(route, Math.floor(now / 75) + i));
          }
          if (particles.length > MAX_PARTICLES) particles = particles.slice(-MAX_PARTICLES);
          lastEmission = now;
        }
        lastRoute = route.route;
      } else {
        plane.style.visibility = 'hidden';
        lastRoute = null;
      }

      particles = particles.filter((particle) => drawParticle(ctx, particle, delta));
      raf = window.requestAnimationFrame(frame);
    }

    const stop = () => {
      window.cancelAnimationFrame(raf);
      raf = 0;
      frameOrigin = null;
      lastFrame = null;
      lastEmission = 0;
      lastRoute = null;
      particles = [];
      ctx.clearRect(0, 0, width, height);
    };

    const startIfNeeded = () => {
      stop();
      if (reduceMotion) {
        showStillPlane();
      } else if (playing && visible) {
        raf = window.requestAnimationFrame(frame);
      } else {
        plane.style.visibility = 'hidden';
      }
    };

    const onMotionChange = () => {
      reduceMotion = Boolean(motionPreference?.matches);
      startIfNeeded();
    };
    const onWindowVisibility = () => {
      playing = !document.hidden;
      startIfNeeded();
    };

    resize();
    if (typeof ResizeObserver !== 'undefined') {
      var resizeObserver = new ResizeObserver(() => {
        resize();
        if (reduceMotion) showStillPlane();
      });
      resizeObserver.observe(wrapper);
    } else {
      window.addEventListener('resize', resize);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      var intersectionObserver = new IntersectionObserver((entries) => {
        const nextVisible = entries[0]?.isIntersecting ?? true;
        if (visible !== nextVisible) {
          visible = nextVisible;
          startIfNeeded();
        }
      }, { threshold: 0.01 });
      intersectionObserver.observe(wrapper);
    }

    motionPreference?.addEventListener?.('change', onMotionChange);
    document.addEventListener('visibilitychange', onWindowVisibility);
    startIfNeeded();

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      motionPreference?.removeEventListener?.('change', onMotionChange);
      document.removeEventListener('visibilitychange', onWindowVisibility);
    };
  }, []);

  return (
    <div className="hero-flight-trail" data-depth="behind" ref={wrapperRef} aria-hidden="true">
      <canvas ref={canvasRef} className="hero-flight-canvas" />
      <div className="hero-plane" ref={planeRef}>
        <svg className="hero-plane-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">
          <path className="hero-plane-outline" d="M60 32c0-3-3.5-5.1-9-5.6l-14-1.6L24 5c-1-1.8-2.6-2.8-5-2.8h-6l8 24.9-10.4 1.4-5-6.3H1.7l3.7 9.8-3.7 9.8h3.9l5-6.3L21 36.9l-8 24.9h6c2.4 0 4-1 5-2.8l13-19.8 14-1.6c5.5-.5 9-2.6 9-5.6Z"/>
          <path className="hero-plane-highlight" d="M22 31.9h25"/>
          <circle cx="50.5" cy="31.9" r="2.3" fill="#ffd16e"/>
        </svg>
      </div>
    </div>
  );
}
