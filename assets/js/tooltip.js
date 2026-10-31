/**
 * Tooltip accesible y reutilizable.
 * Se muestra con hover (mouse) y con focus (teclado). Se posiciona junto al
 * puntero o, en foco por teclado, sobre el elemento. Escape lo cierra.
 */
import { h } from './utils.js';

const OFFSET = 16;

export class Tooltip {
  constructor() {
    this.el = h('div', { class: 'tooltip', role: 'tooltip', id: 'app-tooltip', 'aria-hidden': 'true' });
    document.body.append(this.el);
    this.current = null;

    document.addEventListener('keydown', (e) => e.key === 'Escape' && this.hide());
    window.addEventListener('scroll', () => this.current && this.hide(), { passive: true });
  }

  /**
   * Registra un elemento.
   * @param {HTMLElement} target
   * @param {() => Node} render función que construye el contenido
   */
  attach(target, render) {
    target.setAttribute('aria-describedby', this.el.id);
    target.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') this.show(target, render, e);
    });
    target.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && this.current === target) this.moveTo(e.clientX, e.clientY);
    });
    target.addEventListener('pointerleave', () => this.hide());
    target.addEventListener('focusin', () => this.show(target, render));
    target.addEventListener('focusout', () => this.hide());
  }

  show(target, render, pointerEvent) {
    this.current = target;
    this.el.replaceChildren(render());
    this.el.classList.add('is-visible');
    this.el.setAttribute('aria-hidden', 'false');
    if (pointerEvent) {
      this.moveTo(pointerEvent.clientX, pointerEvent.clientY);
    } else {
      const r = target.getBoundingClientRect();
      this.moveTo(r.left + r.width / 2, r.top + 24);
    }
  }

  moveTo(x, y) {
    const { offsetWidth: w, offsetHeight: hgt } = this.el;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x + OFFSET;
    let top = y + OFFSET;
    if (left + w > vw - 8) left = x - w - OFFSET;
    if (top + hgt > vh - 8) top = y - hgt - OFFSET;
    this.el.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
  }

  hide() {
    this.current = null;
    this.el.classList.remove('is-visible');
    this.el.setAttribute('aria-hidden', 'true');
  }
}
