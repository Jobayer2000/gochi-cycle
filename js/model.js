// Gochi Cycle: synthetic demo data + machine-learning demand forecast (ridge regression).
// Everything runs in the browser. No real store data is used.

// ---------- seeded random numbers (same demo data every time) ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rnd) { // Box-Muller
  const u = 1 - rnd(), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- menu (demo prices) ----------
export const ITEMS = [
  { id: "bento",   en: "Makunouchi bento",   jp: "幕の内弁当",       price: 550, kg: 0.45, base: 22, rainEffect: +3, tempEffect: -0.15 },
  { id: "karaage", en: "Karaage bento",      jp: "唐揚げ弁当",       price: 580, kg: 0.45, base: 18, rainEffect: +2, tempEffect: -0.10 },
  { id: "salmon",  en: "Salmon rice ball",   jp: "鮭おにぎり",       price: 160, kg: 0.11, base: 45, rainEffect: -4, tempEffect: +0.10 },
  { id: "tuna",    en: "Tuna-mayo rice ball",jp: "ツナマヨおにぎり", price: 150, kg: 0.11, base: 50, rainEffect: -5, tempEffect: +0.12 },
  { id: "sand",    en: "Katsu sandwich",     jp: "カツサンド",       price: 330, kg: 0.18, base: 20, rainEffect: -2, tempEffect: +0.20 },
  { id: "salad",   en: "Fresh salad",        jp: "サラダ",           price: 300, kg: 0.20, base: 12, rainEffect: -2, tempEffect: +0.35 },
];
// weekday multipliers, Sun..Sat
const WEEKDAY = [0.80, 1.08, 1.04, 1.03, 1.05, 1.12, 0.88];
export const WEATHER = ["sunny", "cloudy", "rain"];

// ---------- 120 days of synthetic sales history ----------
export function makeHistory(days = 120, seed = 2026) {
  const rnd = mulberry32(seed);
  const rows = [];
  const start = new Date(2026, 6, 1); // 1 Jul 2026
  for (let d = 0; d < days; d++) {
    const date = new Date(start); date.setDate(start.getDate() + d);
    const wd = date.getDay();
    const season = 18 + 9 * Math.cos(((d - 30) / 365) * 2 * Math.PI); // summer to autumn
    const temp = Math.round(season + gauss(rnd) * 3);
    const r = rnd();
    const weather = r < 0.5 ? "sunny" : r < 0.78 ? "cloudy" : "rain";
    const event = rnd() < 0.06 ? 1 : 0; // local event / festival nearby
    for (const it of ITEMS) {
      const pre = Math.max(0, Math.round((it.id.includes("bento") || it.id === "karaage" ? 2.5 : 1.2) * rnd() * (wd >= 1 && wd <= 5 ? 1.6 : 0.6)));
      let mu = it.base * WEEKDAY[wd]
        + (weather === "rain" ? it.rainEffect : weather === "cloudy" ? it.rainEffect * 0.3 : 0)
        + it.tempEffect * (temp - 18)
        + event * it.base * 0.25;
      const walkin = Math.max(0, Math.round(mu + gauss(rnd) * Math.sqrt(mu) * 0.8));
      const sold = walkin + pre; // pre-orders are certain sales
      rows.push({ day: d, date, wd, temp, weather, event, item: it.id, pre, sold });
    }
  }
  return rows;
}

// ---------- features ----------
// [bias, Mon..Sat one-hot (6), cloudy, rain, temp-18, event]  (the model predicts walk-in demand; pre-orders are added on top)
export function features(wd, weather, temp, event) {
  const f = [1];
  for (let k = 1; k <= 6; k++) f.push(wd === k ? 1 : 0);
  f.push(weather === "cloudy" ? 1 : 0, weather === "rain" ? 1 : 0, temp - 18, event);
  return f;
}
export const FEATURE_NAMES = ["base", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "cloudy", "rain", "temperature", "local event"];

// ---------- ridge regression: w = (XᵀX + λI)⁻¹ Xᵀy ----------
function solve(A, b) { // Gaussian elimination with partial pivoting
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j]; x[r] = s / M[r][r]; }
  return x;
}
export function fitRidge(X, y, lambda = 1.0) {
  const p = X[0].length;
  const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
  for (let i = 0; i < X.length; i++) for (let j = 0; j < p; j++) {
    b[j] += X[i][j] * y[i];
    for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k];
  }
  for (let j = 1; j < p; j++) A[j][j] += lambda; // don't penalise the bias
  return solve(A, b);
}
export const predict = (w, f) => Math.max(0, w.reduce((s, wi, i) => s + wi * f[i], 0));

// ---------- train one model per item; test on the last 14 days ----------
export function trainAll(history, testDays = 14) {
  const lastDay = Math.max(...history.map(r => r.day));
  const models = {};
  for (const it of ITEMS) {
    const rows = history.filter(r => r.item === it.id);
    const train = rows.filter(r => r.day <= lastDay - testDays), test = rows.filter(r => r.day > lastDay - testDays);
    const w = fitRidge(train.map(r => features(r.wd, r.weather, r.temp, r.event)), train.map(r => r.sold - r.pre));
    // accuracy: AI forecast vs a "same weekday last week" habit
    let errAI = 0, errHabit = 0;
    for (const r of test) {
      errAI += Math.abs(predict(w, features(r.wd, r.weather, r.temp, r.event)) + r.pre - r.sold);
      const lastWeek = rows.find(q => q.day === r.day - 7);
      errHabit += Math.abs((lastWeek ? lastWeek.sold : r.sold) - r.sold);
    }
    const meanSold = test.reduce((s, r) => s + r.sold, 0) / test.length;
    const wFull = fitRidge(rows.map(r => features(r.wd, r.weather, r.temp, r.event)), rows.map(r => r.sold - r.pre));
    models[it.id] = { w: wFull, maeAI: errAI / test.length, maeHabit: errHabit / test.length, meanSold, rows };
  }
  return models;
}

// ---------- store decisions ----------
// Habit plan = what the store would make without AI: same weekday last week + 15% safety stock.
export function plan(models, ctx) {
  return ITEMS.map(it => {
    const m = models[it.id];
    const pre = ctx.preorders[it.id] || 0;
    const walk = predict(m.w, features(ctx.wd, ctx.weather, ctx.temp, ctx.event));
    const fc = walk + pre;
    const sameDay = [...m.rows].reverse().find(r => r.wd === ctx.wd);
    const habit = Math.round(((sameDay ? sameDay.sold - sameDay.pre : m.meanSold)) * 1.15) + pre; // usual: last week's walk-ins + 15%, plus known pre-orders
    const aiMake = Math.round(fc + Math.sqrt(walk) * 0.5); // pre-orders + walk-in forecast + small buffer on walk-ins only
    const leftoverHabit = Math.max(0, habit - Math.round(fc));
    const leftoverAI = Math.max(0, aiMake - Math.round(fc));
    // markdown suggestion for expected leftovers
    const risk = leftoverAI / Math.max(1, aiMake);
    const discount = risk > 0.15 ? 40 : risk > 0.08 ? 30 : 20;
    const f = features(ctx.wd, ctx.weather, ctx.temp, ctx.event);
    const contrib = f.map((x, i) => [FEATURE_NAMES[i], m.w[i] * x]).filter(([, v], i) => i === 0 || Math.abs(v) > 0.05);
    const lastWeek = sameDay ? sameDay.sold - sameDay.pre : m.meanSold;
    return { ...it, pre, walk, lastWeek, buffer: Math.sqrt(walk) * 0.5, contrib, forecast: fc, habit, aiMake, leftoverHabit, leftoverAI, discount, markdownAt: "21:00" };
  });
}

// ---------- impact (method from the team's model) ----------
export const FACTORS = { co2PerKg: 3.19, opsPerKg: 0.10, offerShare: 300 / 500 };
// rescued items: count * kg * factor; prevented items: avoided production
export function impact(prevented, rescued) {
  const kgPrevented = prevented.reduce((s, x) => s + x.qty * x.kg, 0);
  const kgRescued = rescued.reduce((s, x) => s + x.qty * x.kg, 0);
  const customerSaving = rescued.reduce((s, x) => s + x.qty * x.price * (x.discount / 100), 0);
  const storeIncome = rescued.reduce((s, x) => s + x.qty * x.price * (1 - x.discount / 100), 0);
  const co2 = kgPrevented * FACTORS.co2PerKg + kgRescued * (FACTORS.co2PerKg * 0.5 - FACTORS.opsPerKg);
  return { kgPrevented, kgRescued, customerSaving, storeIncome, co2 };
}
