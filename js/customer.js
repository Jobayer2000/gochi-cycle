// Gochi Cycle customer app: demo login, nearby stores of all three chains,
// pre-order menus with pickup slots, tonight's leftover deals, cart, checkout and live order status.
import { ITEMS } from "./model.js";
import { CHAINS, STORES, SLOTS, storeName, menuFor, seedDeals } from "./stores.js";

const C = {
  en: {
    hello: n => `Hi, ${n}`, near: "Near Noboricho, Hiroshima", search: "Search food or store",
    all: "All", modePre: "Pre-order", modeDeal: "Tonight's deals", oneApp: "Three chains, one app",
    preHint: "Order before the store cooks. It makes the right amount, and you skip the queue.",
    dealHint: "Still-good food at a lower price. Pick up 21:00–00:30.",
    deals: n => `${n} deals`, km: k => `${k} km`, orderBy: c => `order by ${c}`,
    menu: "Pre-order menu", tonight: "Tonight's deals", add: "Add", added: "Added",
    cart: "Your cart", empty: "Your cart is empty.", slot: "Pickup time", today: "Today", tomorrow: "Tomorrow",
    total: "Total", saved: s => `You save ${s}`, place: "Place order", payNote: "Demo: pay at pickup. No real payment.",
    other: "Your cart has items from another store. Start a new cart?", yes: "New cart", no: "Keep",
    orders: "Orders", noOrders: "No orders yet. Pre-order lunch or grab a deal tonight.",
    st: ["Order placed", "Store accepted", "Being prepared", "Ready for pickup"], code: "Pickup code",
    home: "Home", profile: "Profile", logout: "Log out", impactMine: "Your impact",
    foodSaved: "food rescued", money: "saved", orderCount: "orders",
    loginTitle: "Waste nothing, cycle everything.", loginLead: "Pre-order from Seven-Eleven, FamilyMart and Lawson near you, and rescue good food tonight.",
    name: "Your name", ward: "Area", go: "Continue", guest: "Try as guest", loginNote: "Demo login: nothing leaves this browser. No password needed.",
    demo: "Demo stores: no partnership with any chain yet.", left: n => `${n} left`,
  },
  jp: {
    hello: n => `こんにちは、${n}さん`, near: "広島市・幟町付近", search: "食品や店舗を検索",
    all: "すべて", modePre: "予約注文", modeDeal: "今夜のお得", oneApp: "大手3社を、ひとつのアプリで",
    preHint: "調理前に注文。お店は作りすぎず、あなたは待たずに受け取れます。",
    dealHint: "まだおいしい食品をお得に。受取 21:00〜00:30。",
    deals: n => `お得 ${n}件`, km: k => `${k} km`, orderBy: c => `${c}までに注文`,
    menu: "予約メニュー", tonight: "今夜のお得", add: "追加", added: "追加済み",
    cart: "カート", empty: "カートは空です。", slot: "受取時間", today: "今日", tomorrow: "明日",
    total: "合計", saved: s => `${s} お得`, place: "注文する", payNote: "デモ：店頭でお支払い。実際の決済はありません。",
    other: "カートに別の店舗の商品があります。新しいカートにしますか？", yes: "新しいカート", no: "そのまま",
    orders: "注文", noOrders: "まだ注文はありません。ランチを予約するか、今夜のお得をどうぞ。",
    st: ["注文完了", "店舗が受付", "準備中", "受取できます"], code: "受取コード",
    home: "ホーム", profile: "プロフィール", logout: "ログアウト", impactMine: "あなたのインパクト",
    foodSaved: "救った食品", money: "節約", orderCount: "注文",
    loginTitle: "ムダにしない。すべてを循環させる。", loginLead: "近くのセブン-イレブン、ファミリーマート、ローソンで予約注文。今夜はおいしい食品を救おう。",
    name: "お名前", ward: "エリア", go: "はじめる", guest: "ゲストで試す", loginNote: "デモ用ログイン：データはこのブラウザ内だけ。パスワード不要。",
    demo: "デモ店舗：現在どのチェーンとも提携していません。", left: n => `残り${n}個`,
  },
};
const WARDS = { en: ["Naka", "Minami", "Higashi", "Nishi", "Asaminami"], jp: ["中区", "南区", "東区", "西区", "安佐南区"] };

const ls = {
  get(k, d) { try { const v = localStorage.getItem("gc_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("gc_" + k, JSON.stringify(v)); } catch {} },
};
const S = {
  user: ls.get("user", null), cart: ls.get("cart", { store: null, lines: [] }), orders: ls.get("orders", []),
  deals: ls.get("deals", null) || seedDeals(), screen: "home", store: null, mode: "pre", chain: "all", q: "",
  sheet: false, day: "tomorrow", slot: "noon",
};
const save = () => { ls.set("user", S.user); ls.set("cart", S.cart); ls.set("orders", S.orders); ls.set("deals", S.deals); };

let ctx, root, timer;
const L = () => ctx.lang();
const t = k => C[L()][k];
const yen = n => "¥" + Math.round(n).toLocaleString();
const item = id => ITEMS.find(i => i.id === id);
const iname = id => (L() === "jp" ? item(id).jp : item(id).en);
const storeById = id => STORES.find(s => s.id === id);
const priceAt = (sid, id) => menuFor(storeById(sid)).find(m => m.id === id).price;
const ICON = { bento: "🍱", karaage: "🍗", salmon: "🍙", tuna: "🍙", sand: "🥪", salad: "🥗" };

// ---------- public API for the store dashboard and impact screen ----------
export const getOrders = () => S.orders;
export const preordersFor = (storeId, day = "tomorrow") => {
  const out = {};
  for (const o of S.orders) if (o.store === storeId && o.kind === "pre" && o.day === day)
    for (const l of o.lines) out[l.id] = (out[l.id] || 0) + l.qty;
  return out;
};
export const rescuedLines = () => S.orders.filter(o => o.kind === "deal").flatMap(o => o.lines.map(l => ({ id: l.id, qty: l.qty, kg: item(l.id).kg, price: l.full, discount: l.discount })));
export function publishDeals(storeId, list) { S.deals[storeId] = list; save(); if (root) render(); }
export function resetCustomer() { S.cart = { store: null, lines: [] }; S.orders = []; S.deals = seedDeals(); save(); if (root) render(); }

// ---------- helpers ----------
function go(fn) {
  const run = () => { fn(); render(); };
  if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(run); else run();
}
const cartCount = () => S.cart.lines.reduce((s, l) => s + l.qty, 0);
const dealCount = sid => (S.deals[sid] || []).reduce((s, d) => s + d.qty, 0);
const chainTag = s => `<span class="chain c-${s.chain}">${CHAINS[s.chain].short}</span>`;
function statusOf(o) {
  const sec = (Date.now() - o.at) / 1000;
  return sec < 4 ? 0 : sec < 10 ? 1 : sec < 18 ? 2 : 3; // demo-speed status updates
}
function qr(code) { // decorative pattern derived from the code
  let h = [...code].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), cells = "";
  for (let i = 0; i < 49; i++) { h = (h * 1103515245 + 12345) >>> 0; const corner = (i % 7 < 2 && i < 14) || (i % 7 > 4 && i < 14) || (i % 7 < 2 && i > 34);
    cells += `<i class="${corner || (h >> 16) & 1 ? "on" : ""}"></i>`; }
  return `<div class="qr">${cells}</div>`;
}

// ---------- screens ----------
function loginView() {
  return `<div class="login">
    <svg class="biglogo" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 27a22 22 0 0 1 44 0" fill="none" stroke="#9CCBC4" stroke-width="8" stroke-linecap="round"/><path d="M54 37a22 22 0 0 1-44 0" fill="none" stroke="#E07A5F" stroke-width="8" stroke-linecap="round"/></svg>
    <h2>${t("loginTitle")}</h2><p>${t("loginLead")}</p>
    <div class="chainrow">${Object.keys(CHAINS).map(k => `<span class="chain c-${k}">${CHAINS[k].short}</span><small>${CHAINS[k][L()]}</small>`).join("")}</div>
    <label>${t("name")}<input id="cName" maxlength="24" autocomplete="nickname" placeholder="Jobayer"></label>
    <label>${t("ward")}<select id="cWard">${WARDS[L()].map((w, i) => `<option value="${i}">${w}</option>`).join("")}</select></label>
    <button class="cbtn primary" data-act="login">${t("go")}</button>
    <button class="cbtn ghost" data-act="guest">${t("guest")}</button>
    <p class="fine">${t("loginNote")}</p></div>`;
}

function homeView() {
  const q = S.q.toLowerCase();
  const list = STORES.filter(s => S.chain === "all" || s.chain === S.chain)
    .filter(s => !q || storeName(s, L()).toLowerCase().includes(q) || menuFor(s).some(m => (m.en + m.jp).toLowerCase().includes(q)))
    .filter(s => S.mode === "pre" || dealCount(s.id) > 0)
    .sort((a, b) => a.km - b.km);
  return `<div class="hello"><div><b>${t("hello")(S.user.name)}</b><small>📍 ${t("near")}</small></div><span class="avatar">${S.user.name.slice(0, 1).toUpperCase()}</span></div>
    <div class="banner"><b>${t("oneApp")}</b><span>${Object.keys(CHAINS).map(k => `<span class="chain c-${k}">${CHAINS[k].short}</span>`).join("")}</span></div>
    <div class="mode"><button class="${S.mode === "pre" ? "on" : ""}" data-mode="pre">${t("modePre")}</button><button class="${S.mode === "deal" ? "on" : ""}" data-mode="deal">${t("modeDeal")}</button><i style="transform:translateX(${S.mode === "pre" ? 0 : 100}%)"></i></div>
    <p class="hint">${S.mode === "pre" ? t("preHint") : t("dealHint")}</p>
    <input class="search" id="cSearch" placeholder="${t("search")}" value="${S.q.replace(/"/g, "")}">
    <div class="chips">${["all", ...Object.keys(CHAINS)].map(k => `<button class="${S.chain === k ? "on" : ""}" data-chain="${k}">${k === "all" ? t("all") : CHAINS[k][L()]}</button>`).join("")}</div>
    <div class="map">${STORES.map(s => `<button class="pin c-${s.chain} ${list.includes(s) ? "" : "dim"}" style="left:${s.x}%;top:${s.y}%" data-store="${s.id}" title="${storeName(s, L())}">${CHAINS[s.chain].short}${dealCount(s.id) && S.mode === "deal" ? `<em>${dealCount(s.id)}</em>` : ""}</button>`).join("")}<span class="me" style="left:50%;top:46%"></span></div>
    <div class="slist">${list.map((s, i) => `<button class="srow" style="--i:${i}" data-store="${s.id}">${chainTag(s)}<span class="sinfo"><b>${storeName(s, L())}</b><small>${t("km")(s.km)} · ${S.mode === "pre" ? t("orderBy")(SLOTS[1].cutoff) : t("deals")(dealCount(s.id))}</small></span><span class="go">›</span></button>`).join("")}</div>
    <p class="fine">${t("demo")}</p>`;
}

function storeView() {
  const s = storeById(S.store), menu = menuFor(s), deals = S.deals[s.id] || [];
  const inCart = id => S.cart.store === s.id && S.cart.lines.some(l => l.id === id && l.kind === (S.mode === "pre" ? "pre" : "deal"));
  return `<div class="shead"><button class="back" data-act="home" aria-label="Back">‹</button>${chainTag(s)}<div><b>${storeName(s, L())}</b><small>${t("km")(s.km)}</small></div></div>
    <div class="mode"><button class="${S.mode === "pre" ? "on" : ""}" data-mode="pre">${t("menu")}</button><button class="${S.mode === "deal" ? "on" : ""}" data-mode="deal">${t("tonight")} (${dealCount(s.id)})</button><i style="transform:translateX(${S.mode === "pre" ? 0 : 100}%)"></i></div>
    <div class="grid">${S.mode === "pre"
      ? menu.map((m, i) => `<div class="pcard" style="--i:${i}"><span class="emo">${ICON[m.id]}</span><b>${iname(m.id)}</b><span class="price">${yen(m.price)}</span>
          <button class="add ${inCart(m.id) ? "done" : ""}" data-add="${m.id}" data-kind="pre">${inCart(m.id) ? "✓ " + t("added") : "+ " + t("add")}</button></div>`).join("")
      : deals.length ? deals.map((d, i) => { const full = priceAt(s.id, d.id), now = full * (1 - d.discount / 100);
          return `<div class="pcard deal" style="--i:${i}"><span class="off">−${d.discount}%</span><span class="emo">${ICON[d.id]}</span><b>${iname(d.id)}</b>
            <span class="price"><s>${yen(full)}</s> ${yen(now)}</span><small>${t("left")(d.qty)}</small>
            <button class="add ${inCart(d.id) ? "done" : ""}" data-add="${d.id}" data-kind="deal" ${d.qty ? "" : "disabled"}>${inCart(d.id) ? "✓ " + t("added") : "+ " + t("add")}</button></div>`; }).join("")
      : `<p class="emptyc">—</p>`}</div>`;
}

function ordersView() {
  if (!S.orders.length) return `<h3 class="ttl">${t("orders")}</h3><p class="emptyc">${t("noOrders")}</p>`;
  return `<h3 class="ttl">${t("orders")}</h3>` + [...S.orders].reverse().map(o => {
    const st = statusOf(o), s = storeById(o.store);
    return `<div class="ocard">${qr(o.code)}<div class="oinfo"><b>${storeName(s, L())}</b>
      <small>${o.kind === "pre" ? (o.day === "today" ? t("today") : t("tomorrow")) + " · " + SLOTS.find(x => x.id === o.slot).label : "21:00–00:30"}</small>
      <small>${o.lines.map(l => `${iname(l.id)} ×${l.qty}`).join(", ")}</small>
      <div class="steps">${t("st").map((x, i) => `<span class="${i <= st ? "on" : ""}"></span>`).join("")}</div>
      <span class="stat ${st === 3 ? "ready" : ""}">${t("st")[st]}</span></div>
      <div class="ocode"><small>${t("code")}</small><b>${o.code}</b></div></div>`;
  }).join("");
}

function profileView() {
  const mine = rescuedLines();
  const kg = mine.reduce((s, l) => s + l.qty * l.kg, 0), sv = mine.reduce((s, l) => s + l.qty * l.price * l.discount / 100, 0);
  return `<div class="prof"><span class="avatar big">${S.user.name.slice(0, 1).toUpperCase()}</span><b>${S.user.name}</b><small>${WARDS[L()][S.user.ward] || ""}</small></div>
    <h3 class="ttl">${t("impactMine")}</h3>
    <div class="mini"><div><b>${S.orders.length}</b><small>${t("orderCount")}</small></div><div><b>${kg.toFixed(2)} kg</b><small>${t("foodSaved")}</small></div><div><b>${yen(sv)}</b><small>${t("money")}</small></div></div>
    <button class="cbtn ghost" data-act="logout">${t("logout")}</button>`;
}

function sheetView() {
  const s = S.cart.store && storeById(S.cart.store);
  const lines = S.cart.lines;
  const total = lines.reduce((a, l) => a + l.qty * l.price, 0), saved = lines.reduce((a, l) => a + l.qty * (l.full - l.price), 0);
  const hasPre = lines.some(l => l.kind === "pre");
  return `<div class="scrim ${S.sheet ? "on" : ""}" data-act="close"></div>
  <div class="sheet ${S.sheet ? "on" : ""}" role="dialog" aria-label="${t("cart")}"><span class="grab"></span><h3>${t("cart")}</h3>
    ${!lines.length ? `<p class="emptyc">${t("empty")}</p>` : `<small class="muted">${storeName(s, L())}</small>
    ${lines.map((l, i) => `<div class="line"><span class="emo sm">${ICON[l.id]}</span><span class="ln">${iname(l.id)}${l.kind === "deal" ? ` <em>−${l.discount}%</em>` : ""}</span>
      <span class="qty"><button data-qty="${i}" data-d="-1" aria-label="minus">−</button><b>${l.qty}</b><button data-qty="${i}" data-d="1" aria-label="plus">+</button></span><span class="lp">${yen(l.qty * l.price)}</span></div>`).join("")}
    ${hasPre ? `<div class="slotpick"><small>${t("slot")}</small><div class="seg2">${["today", "tomorrow"].map(d => `<button class="${S.day === d ? "on" : ""}" data-day="${d}">${t(d)}</button>`).join("")}</div>
      <div class="seg2">${SLOTS.map(x => `<button class="${S.slot === x.id ? "on" : ""}" data-slot="${x.id}">${x.label}</button>`).join("")}</div></div>` : ""}
    <div class="tot"><span>${t("total")}</span><b>${yen(total)}</b></div>${saved > 0 ? `<p class="save">${t("saved")(yen(saved))}</p>` : ""}
    <button class="cbtn primary" data-act="place">${t("place")}</button><p class="fine">${t("payNote")}</p>`}</div>`;
}

function render() {
  if (!root) return;
  const logged = !!S.user;
  const body = !logged ? loginView() : S.screen === "store" ? storeView() : S.screen === "orders" ? ordersView() : S.screen === "profile" ? profileView() : homeView();
  root.innerHTML = `<div class="app">
    <div class="sbar"><span>${new Date().toTimeString().slice(0, 5)}</span><span>Gochi Cycle</span><span>●●●</span></div>
    <div class="scr" style="view-transition-name:scr">${body}</div>
    ${logged ? `<button class="fab ${cartCount() ? "" : "hide"}" data-act="cart" aria-label="${t("cart")}">🛒<b class="badge" key="${cartCount()}">${cartCount()}</b></button>
    <nav class="bnav">${[["home", "⌂", t("home")], ["orders", "▤", t("orders")], ["profile", "◉", t("profile")]].map(([k, i, l]) => `<button class="${S.screen === k || (k === "home" && S.screen === "store") ? "on" : ""}" data-nav="${k}"><span>${i}</span>${l}</button>`).join("")}</nav>${sheetView()}` : ""}
  </div>`;
  const inp = root.querySelector("#cSearch");
  if (inp) inp.oninput = e => { S.q = e.target.value; const pos = e.target.selectionStart; render(); const n = root.querySelector("#cSearch"); n.focus(); n.setSelectionRange(pos, pos); };
}

// ---------- actions ----------
function addToCart(id, kind) {
  const s = storeById(S.store);
  if (S.cart.store && S.cart.store !== s.id && S.cart.lines.length) { if (!confirm(t("other"))) return; S.cart = { store: null, lines: [] }; }
  S.cart.store = s.id;
  const full = priceAt(s.id, id);
  const deal = kind === "deal" ? (S.deals[s.id] || []).find(d => d.id === id) : null;
  const price = deal ? Math.round(full * (1 - deal.discount / 100)) : full;
  const ex = S.cart.lines.find(l => l.id === id && l.kind === kind);
  if (ex) { if (!deal || ex.qty < deal.qty) ex.qty++; } else S.cart.lines.push({ id, kind, qty: 1, price, full, discount: deal ? deal.discount : 0 });
  save(); render();
  const b = root.querySelector(".badge"); if (b) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
}
function placeOrder() {
  const st = S.cart.store, code = String(Math.floor(1000 + Math.random() * 9000));
  for (const kind of ["pre", "deal"]) {
    const lines = S.cart.lines.filter(l => l.kind === kind); if (!lines.length) continue;
    S.orders.push({ code, store: st, kind, day: S.day, slot: S.slot, lines, at: Date.now() });
    if (kind === "deal") for (const l of lines) { const d = (S.deals[st] || []).find(x => x.id === l.id); if (d) d.qty = Math.max(0, d.qty - l.qty); }
  }
  S.cart = { store: null, lines: [] }; S.sheet = false; save();
  go(() => { S.screen = "orders"; }); ctx.onChange();
}

export function mountCustomer(el, context) {
  ctx = context; root = el; render();
  root.addEventListener("click", e => {
    const b = e.target.closest("button, .scrim"); if (!b) return;
    const d = b.dataset;
    if (d.act === "login" || d.act === "guest") {
      const n = (root.querySelector("#cName")?.value || "").trim();
      S.user = { name: d.act === "guest" || !n ? (L() === "jp" ? "ゲスト" : "Guest") : n, ward: +(root.querySelector("#cWard")?.value || 0) };
      save(); go(() => { S.screen = "home"; }); return;
    }
    if (d.act === "logout") { S.user = null; save(); go(() => {}); return; }
    if (d.act === "home") { go(() => { S.screen = "home"; }); return; }
    if (d.act === "cart") { S.sheet = true; render(); return; }
    if (d.act === "close") { S.sheet = false; render(); return; }
    if (d.act === "place") { placeOrder(); return; }
    if (d.mode) { S.mode = d.mode; render(); return; }
    if (d.chain) { S.chain = d.chain; render(); return; }
    if (d.store) { go(() => { S.store = d.store; S.screen = "store"; }); return; }
    if (d.nav) { go(() => { S.screen = d.nav; }); return; }
    if (d.add) { addToCart(d.add, d.kind); return; }
    if (d.qty) { const l = S.cart.lines[+d.qty]; l.qty += +d.d; if (l.qty <= 0) S.cart.lines.splice(+d.qty, 1); if (!S.cart.lines.length) S.cart.store = null; save(); render(); return; }
    if (d.day) { S.day = d.day; render(); return; }
    if (d.slot) { S.slot = d.slot; render(); return; }
  });
  clearInterval(timer);
  timer = setInterval(() => { if (S.user && S.screen === "orders" && !S.sheet) render(); }, 2000);
}
export const rerenderCustomer = () => render();
