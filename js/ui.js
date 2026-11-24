// Small UI helpers shared by both apps: toasts, number count-up, haptics.
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function toast(text, kind = "") {
  let box = document.getElementById("toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
  const el = document.createElement("div"); el.className = "toast " + kind; el.textContent = text;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 3200);
}

// Numbers count up when a page opens; on later updates they glide from the last value.
const last = new Map();
export const resetCounts = prefix => { for (const k of [...last.keys()]) if (k.startsWith(prefix)) last.delete(k); };
export function countAll(root, prefix) { root.querySelectorAll("[data-count]").forEach((el, i) => { el.dataset.k ||= prefix + i; countUp(el); }); }
export function countUp(el) {
  const to = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.pre || "", suf = el.dataset.suf || "", k = el.dataset.k;
  const from = k && last.has(k) ? last.get(k) : 0; if (k) last.set(k, to);
  const fmt = v => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString()) + suf;
  if (reduce() || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = from === 0 ? 1100 : 600;
  const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
  el.textContent = fmt(from); requestAnimationFrame(step);
}

export function haptic(ms = 8) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch {} }

// Line icons (lucide shapes), one size and stroke, colour from the text role.
const P = {
  pin: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cloud: '<path d="M17.5 19H8a5 5 0 1 1 1.2-9.9A6 6 0 0 1 20 11.5a3.5 3.5 0 0 1-2.5 7.5z"/>',
  rain: '<path d="M16 13V9a4 4 0 0 0-8 0v4"/><path d="M4 13h16"/><path d="M8 17v2M12 17v4M16 17v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
export const ico = (n, size = 16) => `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
