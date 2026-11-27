// Shared demo state for the customer app and the store portal.
// Saved in this browser only (localStorage). Other open tabs update live (storage event).
import { ITEMS } from "./model.js";
import { STORES, menuFor, chainOf } from "./stores.js";

const KEY = "gochi_v3";
const listeners = new Set();
export const FEE = 0.08; // Gochi Cycle platform fee on completed sales

function seed() {
  let a = 11; const rnd = () => ((a = (a * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const listings = [];
  for (const s of STORES) {
    const menu = menuFor(s);
    [...menu].sort(() => rnd() - 0.5).slice(0, 2 + Math.floor(rnd() * 2)).forEach((m, k) => listings.push({
      id: `${s.id}-${m.id}-seed${k}`, store: s.id, item: m.id, price: m.price,
      discount: [20, 30, 40][Math.floor(rnd() * 3)], qty: 1 + Math.floor(rnd() * 4), sold: 0,
      bestBefore: "03:00", from: "21:00", to: "00:30", by: "AI", at: Date.now() - 3600e3,
    }));
  }
  const staff = {};
  for (const s of STORES) staff[s.id] = [
    { id: "m", name: "Tanaka", role: "manager", pin: "1111" },
    { id: "a", name: "Sato", role: "staff", pin: "2222" },
  ];
  return { listings, orders: [], wallet: {}, payouts: {}, notes: {}, staff, user: null, session: null, admin: false, accounts: { customers: [], stores: [] } };
}

export let DB = load();
DB.accounts ||= { customers: [], stores: [] };
// Ready-made demo accounts (PIN 1111 / password demo1234), so sign-in works without registering first.
const DEMO_STORE = { store: "s1", name: "Tanaka", email: "store@gochi.demo", pin: "0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c", staff: "m", at: 0 };
const DEMO_CUST = { name: "Demo", email: "demo@gochi.demo", pw: "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d", at: 0 };
function ensureDemo() {
  if (!DB.accounts.stores.some(a => a.email === DEMO_STORE.email)) DB.accounts.stores.push({ ...DEMO_STORE });
  if (!DB.accounts.customers.some(a => a.email === DEMO_CUST.email)) DB.accounts.customers.push({ ...DEMO_CUST });
}
ensureDemo();
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.listings) return v; } catch {} return seed(); }
export function commit(note) {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch {}
  listeners.forEach(f => f(note));
}
export const subscribe = f => (listeners.add(f), () => listeners.delete(f));
window.addEventListener("storage", e => { if (e.key === KEY) { DB = load(); DB.accounts ||= { customers: [], stores: [] }; listeners.forEach(f => f({ remote: true })); } });
export function resetAll() { const keepUser = DB.user, keepAcc = DB.accounts; DB = seed(); DB.user = keepUser; DB.accounts = keepAcc; ensureDemo(); commit({ reset: true }); }

// ---------- listings ----------
export const listingsFor = store => DB.listings.filter(l => l.store === store && l.qty - l.sold > 0);
export const allLive = () => DB.listings.filter(l => l.qty - l.sold > 0);
export function addListing(l) { DB.listings.unshift({ ...l, id: `${l.store}-${l.item}-${Date.now()}`, sold: 0, at: Date.now() }); commit({ listing: true }); }
export function updateListing(id, patch) { Object.assign(DB.listings.find(l => l.id === id), patch); commit({ listing: true }); }
export function removeListing(id) { DB.listings = DB.listings.filter(l => l.id !== id); commit({ listing: true }); }

// AI discount suggestion: more time left and fewer expected leftovers -> smaller discount
export function suggestDiscount(hoursLeft, qty) {
  let d = hoursLeft > 6 ? 10 : hoursLeft > 3 ? 20 : hoursLeft > 1.5 ? 30 : 40;
  if (qty >= 5) d += 10;
  return Math.min(50, d);
}

// ---------- orders ----------
// status: 0 placed · 1 accepted · 2 ready · 3 picked up
export function placeOrder({ store, kind, lines, day, slot }) {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const order = { id: "o" + Date.now() + Math.floor(Math.random() * 99), code, store, kind, lines, day, slot, total, status: 0, at: Date.now(), user: DB.user?.name || "Guest" };
  DB.orders.push(order);
  if (kind === "deal") for (const l of lines) { const li = DB.listings.find(x => x.id === l.listing); if (li) li.sold = Math.min(li.qty, li.sold + l.qty); }
  notify(store, { type: "sold", order: order.id, text: lines.map(l => `${l.qty}× ${l.item}`).join(", "), total });
  commit({ order: order.id });
  setTimeout(() => { const o = DB.orders.find(x => x.id === order.id); if (o && o.status === 0) { o.status = 1; commit({ status: o.id }); } }, 3500); // demo auto-accept
  return order;
}
export function setStatus(id, status) {
  const o = DB.orders.find(x => x.id === id); if (!o) return;
  o.status = status;
  if (status === 3) { // picked up -> money to the store wallet
    const w = DB.wallet[o.store] || (DB.wallet[o.store] = []);
    w.unshift({ order: o.id, gross: o.total, fee: Math.round(o.total * FEE), net: o.total - Math.round(o.total * FEE), at: Date.now(), kind: o.kind });
  }
  commit({ status: id });
}
export const ordersFor = store => DB.orders.filter(o => o.store === store);
export const myOrders = () => DB.orders.filter(o => o.user === (DB.user?.name || "Guest"));

// ---------- notifications ----------
export function notify(store, n) { (DB.notes[store] || (DB.notes[store] = [])).unshift({ ...n, at: Date.now(), read: false }); }
export const notesFor = store => DB.notes[store] || [];
export function markRead(store) { (DB.notes[store] || []).forEach(n => (n.read = true)); commit({}); }

// ---------- wallet ----------
export function walletFor(store) {
  const tx = DB.wallet[store] || [], paid = (DB.payouts[store] || []).reduce((s, p) => s + p.amount, 0);
  const gross = tx.reduce((s, t) => s + t.gross, 0), fee = tx.reduce((s, t) => s + t.fee, 0), net = tx.reduce((s, t) => s + t.net, 0);
  return { tx, gross, fee, net, paid, balance: net - paid, payouts: DB.payouts[store] || [] };
}
export function requestPayout(store) {
  const w = walletFor(store); if (w.balance <= 0) return 0;
  (DB.payouts[store] || (DB.payouts[store] = [])).unshift({ amount: w.balance, at: Date.now() });
  commit({ payout: true }); return w.balance;
}

// ---------- staff ----------
export const staffFor = store => DB.staff[store];
export function addStaff(store, name, role) { DB.staff[store].push({ id: "s" + Date.now(), name, role, pin: "0000" }); commit({}); }

// ---------- impact (for reports / profile) ----------
export function impactOf(orders) {
  let kg = 0, saved = 0, income = 0;
  for (const o of orders) if (o.kind === "deal") for (const l of o.lines) {
    const it = ITEMS.find(i => i.id === l.item); kg += l.qty * it.kg; saved += l.qty * (l.full - l.price); income += l.qty * l.price;
  }
  return { kg, saved, income, co2: kg * (3.19 * 0.5 - 0.10) };
}
export { chainOf };

// ---------- accounts (demo: stored only in this browser; passwords hashed with SHA-256) ----------
export async function hash(x) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x));
  return [...new Uint8Array(b)].map(v => v.toString(16).padStart(2, "0")).join("");
}
const norm = e => (e || "").trim().toLowerCase();
export async function signUpCustomer({ name, email, pw }) {
  email = norm(email);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || (pw || "").length < 6) return "invalid";
  if (DB.accounts.customers.some(a => a.email === email)) return "exists";
  DB.accounts.customers.push({ name, email, pw: await hash(pw), at: Date.now() });
  DB.user = { name, email }; commit({ account: true }); return "ok";
}
export async function signInCustomer(email, pw) {
  email = norm(email); const a = DB.accounts.customers.find(x => x.email === email);
  if (!a || a.pw !== await hash(pw || "")) return "wrong";
  DB.user = { name: a.name, email }; commit({}); return "ok";
}
export async function signUpStore({ store, name, email, pin }) {
  email = norm(email);
  if (!store || !name || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{4}$/.test(pin || "")) return "invalid";
  if (DB.accounts.stores.some(a => a.email === email)) return "exists";
  const id = "u" + Date.now();
  DB.accounts.stores.push({ store, name, email, pin: await hash(pin), staff: id, at: Date.now() });
  DB.staff[store].unshift({ id, name, role: "manager", pin });
  DB.session = { store, staff: id, role: "manager", name }; commit({ account: true }); return "ok";
}
export async function signInStore(email, pin) {
  email = norm(email); const a = DB.accounts.stores.find(x => x.email === email);
  if (!a || a.pin !== await hash(pin || "")) return "wrong";
  DB.session = { store: a.store, staff: a.staff, role: "manager", name: a.name }; commit({}); return "ok";
}

// ---------- platform (Gochi Cycle's own side) ----------
export const PROCESSING = 0.03; // payment processing cost (assumption from the team model)
export function platformStats() {
  const done = DB.orders.filter(o => o.status === 3);
  const gmv = done.reduce((s, o) => s + o.total, 0);
  const commission = done.reduce((s, o) => s + Math.round(o.total * FEE), 0);
  const processing = Math.round(gmv * PROCESSING);
  const stores = STORES.map(s => { const w = walletFor(s.id), os = DB.orders.filter(o => o.store === s.id);
    return { id: s.id, orders: os.length, gmv: w.gross, fee: w.fee, balance: w.balance, paid: w.paid, live: listingsFor(s.id).length }; });
  const im = impactOf(done);
  const customers = new Set([...DB.accounts.customers.map(a => a.email), ...DB.orders.map(o => o.user)]).size;
  return { gmv, commission, processing, net: commission - processing, orders: DB.orders.length, done: done.length, customers,
    pending: stores.reduce((s, x) => s + x.balance, 0), paid: stores.reduce((s, x) => s + x.paid, 0),
    activeStores: stores.filter(x => x.orders || x.live).length, stores, im, accounts: DB.accounts.stores.length };
}

// How impact is counted (shown in the customer profile, store reports and HQ).
export const METHOD = {
  en: [
    "Counted only after pickup: an order becomes rescued food when the store marks it Picked up. Before that the app shows it as potential impact.",
    "Rescued food (leftovers bought and picked up): kg × (3.19 × 50% − 0.10) = 1.495 kg CO₂e per kg.",
    "3.19 kg CO₂e per kg: average production footprint of food in Too Good To Go bags, EU, 2022–23 (Blonk & Mérieux NutriSciences, 2024, Table 9). Not a Japanese factor.",
    "50% displacement: our assumption that about half of rescued food replaces food the customer would otherwise have bought new; the other half is extra eating that saves no production. Not measured; to be tested in a pilot (e.g. by asking customers).",
    "0.10 kg CO₂e per kg: our rough allowance for the service itself, covering customer travel to the store, packaging and app/server energy. Not measured.",
    "Prevented food (made or ordered less because of the forecast) is shown separately in the store plan and is not added to rescued food, so nothing is counted twice. Its CO₂e is not in these totals.",
    "Avoided disposal emissions (collection, incineration) are not included, so the estimate is conservative.",
    "The class-pitch scenarios also assume 50% of sales are additional and 90% is eaten; the app counts each confirmed pickup as eaten.",
  ],
  jp: [
    "受け取り後にのみ計上：店舗が「受け渡し完了」にした時点で救った食品になります。それまでは見込みとして表示します。",
    "救った食品（購入・受け取り済みの値引き品）：kg ×（3.19 × 50% − 0.10）＝ 1kgあたり1.495 kg CO₂e。",
    "3.19 kg CO₂e/kg：Too Good To Goの袋に入る食品の平均生産時排出量（EU、2022–23年、Blonk & Mérieux NutriSciences 2024、表9）。日本の係数ではありません。",
    "代替率50%：救った食品の約半分が、本来新しく買うはずだった食品の代わりになるという仮定。残り半分は追加の消費で生産削減なし。未測定で、試験導入で検証予定（例：利用者アンケート）。",
    "1kgあたり0.10 kg CO₂e：サービス自体の排出の概算（来店移動・包装・アプリ／サーバー）。未測定。",
    "防いだ食品（予測により作る・発注する量を減らした分）は店舗プランで別に表示し、救った食品には足さないため二重計上しません。そのCO₂eはこの合計に含みません。",
    "廃棄時の排出（収集・焼却）は含めていないため、控えめな推計です。",
    "授業発表のシナリオでは、売上の50%が追加分・90%が食べられると仮定。アプリでは受け取り済みの注文を食べられたものとして数えます。",
  ],
};
export const methodHTML = (lang, title) => `<details class="method"><summary>${title}</summary><ol>${METHOD[lang].map(x => `<li>${x}</li>`).join("")}</ol></details>`;
