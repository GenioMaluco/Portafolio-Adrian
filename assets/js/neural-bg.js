/**
 * Fondo animado del hero: red neuronal / grafo de nodos.
 * Respeta prefers-reduced-motion y se pausa cuando no es visible.
 */
import { prefersReducedMotion } from './utils.js';

export function startNeuralBackground(canvas) {
  if (!canvas?.getContext) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const LINK_DIST = 140;
  let nodes = [];
  let width = 0;
  let height = 0;
  let running = true;
  let frame = 0;

  const color = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '56, 189, 248';

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(Math.min(90, (width * height) / 14000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8,
    }));
  }

  function draw() {
    const rgb = color();
    ctx.clearRect(0, 0, width, height);
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(${rgb}, ${(1 - d / LINK_DIST) * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${rgb}, 0.9)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    if (!running) return;
    draw();
    frame = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', () => { resize(); draw(); });

  if (prefersReducedMotion()) {
    draw(); // un solo cuadro estático
    return;
  }

  new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting;
    cancelAnimationFrame(frame);
    if (running) loop();
  }).observe(canvas);
}
