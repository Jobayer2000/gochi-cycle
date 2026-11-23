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
