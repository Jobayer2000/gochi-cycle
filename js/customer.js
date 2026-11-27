// Gochi Cycle customer app (mobile first): login, 3-chain store map, pre-order menus,
// tonight's leftover deals (listed by stores), cart, checkout, live order status, profile impact.
import { ITEMS } from "./model.js";
import { CHAINS, STORES, SLOTS, PHOTO, storeById, storeLabel, storeName, menuFor } from "./stores.js";
import { DB, commit, subscribe, listingsFor, placeOrder, myOrders, impactOf, signInCustomer, signUpCustomer, methodHTML } from "./state.js";
import { countAll, resetCounts, toast, haptic, ico, esc } from "./ui.js";

const C = {
  en: {
    hello: n => `Signed in as ${n}`, near: "Noboricho, Hiroshima", homeTitle: "Food near you", search: "Search food or store",
    all: "All", modePre: "Pre-order", modeDeal: "Tonight's deals", oneApp: "Three chains, one app",
    preHint: "Order ahead: the store can order the right amount, and you skip the queue.",
    dealHint: "Still-good food at a lower price. Pick up 21:00–00:30.",
    deals: n => `${n} deals`, km: k => `${k} km`, orderBy: c => `order by ${c}`, left: n => `${n} left`,
    menu: "Pre-order menu", tonight: "Tonight's deals", add: "Add", bb: t => `best before ${t}`,
    cart: "Your cart", empty: "Your cart is empty.", slot: "Pickup time", today: "Today", tomorrow: "Tomorrow",
    total: "Total", saved: s => `You save ${s}`, place: "Place order", payNote: "Demo: pay at pickup. No real payment.",
    other: "Your cart has items from another store. Start a new cart?",
    orders: "Orders", noOrders: "No orders yet. Pre-order lunch or rescue a deal tonight.",
    st: ["Order placed", "Store accepted", "Ready for pickup", "Picked up"], code: "Pickup code",
    home: "Home", profile: "Profile", logout: "Log out", impactMine: "Your impact", confirmed: "Confirmed: picked up", potential: "Potential: not picked up yet", potentialNote: "Counts as rescued only after the store hands it over.", howCount: "How we count impact",
    foodSaved: "food rescued", money: "saved", orderCount: "orders", co2: "CO₂e avoided",
    loginTitle: "Waste nothing,\ncycle everything.", loginLead: "Pre-order from Seven-Eleven, FamilyMart and Lawson near you, and rescue good food tonight.",
    name: "Your name", go: "Continue", guest: "Try as guest", loginNote: "Demo accounts are saved only in this browser (password hashed). Please don't use a real password.",
    signin: "Sign in", signup: "Create account", email: "Email", pw: "Password", pw6: "Password (6+ characters)", noAcc: "New here?", haveAcc: "Already have an account?",
    errWrong: "Email or password is wrong.", errExists: "An account with this email already exists.", errInvalid: "Please fill in name, a valid email and a 6+ character password.", welcome: n => `Signed in as ${n}`, bye: "Signed out",
    demo: "Demo stores: no partnership with any chain yet.", checked: "Checked by staff", allergen: "Allergens: please check the label in the store or ask staff. The app does not judge allergens or food safety.", done: "Order placed", doneSub: c => `Show code ${c} at the counter`,
    readyToast: s => `Your order at ${s} is ready for pickup`, addedToast: n => `${n} added`,
  },
  jp: {
    hello: n => `${n}さんでログイン中`, near: "広島市・幟町", homeTitle: "近くの食品", search: "食品や店舗を検索",
    all: "すべて", modePre: "予約注文", modeDeal: "今夜のお得", oneApp: "大手3社を、ひとつのアプリで",
    preHint: "事前に予約：お店はちょうどいい量を発注でき、あなたは待たずに受け取れます。",
    dealHint: "まだおいしい食品をお得に。受取 21:00〜00:30。",
    deals: n => `お得 ${n}件`, km: k => `${k} km`, orderBy: c => `${c}までに注文`, left: n => `残り${n}個`,
    menu: "予約メニュー", tonight: "今夜のお得", add: "追加", bb: t => `消費期限 ${t}`,
    cart: "カート", empty: "カートは空です。", slot: "受取時間", today: "今日", tomorrow: "明日",
    total: "合計", saved: s => `${s} お得`, place: "注文する", payNote: "デモ：店頭でお支払い。実際の決済はありません。",
    other: "カートに別の店舗の商品があります。新しいカートにしますか？",
    orders: "注文", noOrders: "まだ注文はありません。ランチを予約するか、今夜のお得を救いましょう。",
    st: ["注文完了", "店舗が受付", "受取できます", "受取済み"], code: "受取コード",
    home: "ホーム", profile: "マイページ", logout: "ログアウト", impactMine: "あなたのインパクト", confirmed: "確定：受け取り済み", potential: "見込み：まだ受け取っていない分", potentialNote: "店舗で受け渡しが完了してから、救った食品として計上します。", howCount: "インパクトの数え方",
    foodSaved: "救った食品", money: "節約", orderCount: "注文", co2: "CO₂e削減",
    loginTitle: "ムダにしない。\nすべてを循環させる。", loginLead: "近くのセブン-イレブン、ファミリーマート、ローソンで予約注文。今夜はおいしい食品を救おう。",
    name: "お名前", go: "はじめる", guest: "ゲストで試す", loginNote: "デモ用アカウントはこのブラウザ内だけに保存されます（パスワードはハッシュ化）。実際のパスワードは使わないでください。",
    signin: "ログイン", signup: "アカウント作成", email: "メールアドレス", pw: "パスワード", pw6: "パスワード（6文字以上）", noAcc: "はじめての方", haveAcc: "アカウントをお持ちの方",
    errWrong: "メールアドレスまたはパスワードが違います。", errExists: "このメールアドレスは登録済みです。", errInvalid: "名前・正しいメール・6文字以上のパスワードを入力してください。", welcome: n => `${n}さんでログインしました`, bye: "ログアウトしました",
    demo: "デモ店舗：現在どのチェーンとも提携していません。", checked: "スタッフ確認済み", allergen: "アレルギー：店頭のラベルを確認するか、スタッフにお尋ねください。アプリはアレルギーや食品の安全を判断しません。", done: "注文しました", doneSub: c => `レジでコード ${c} を提示`,
    readyToast: s => `${s}のご注文が受取できます`, addedToast: n => `${n}を追加`,
  },
};

const V = { auth: "in", screen: "home", store: null, mode: "pre", chain: "all", q: "", sheet: false, day: "tomorrow", slot: "noon", cart: { store: null, lines: [] }, done: null };
let ctx, root, seenReady = new Set();
const L = () => ctx.lang();
const t = k => C[L()][k];
const yen = n => "¥" + Math.round(n).toLocaleString();
const item = id => ITEMS.find(i => i.id === id);
const iname = id => (L() === "jp" ? item(id).jp : item(id).en);
const dealsOf = sid => listingsFor(sid);
const dealCount = sid => dealsOf(sid).reduce((s, l) => s + l.qty - l.sold, 0);
const cartCount = () => V.cart.lines.reduce((s, l) => s + l.qty, 0);
const chip = s => `<span class="chain" style="--c:${CHAINS[s.chain].color}">${CHAINS[s.chain].short}</span>`;
const img = (id, cls = "") => `<img class="ph ${cls}" src="${PHOTO(id)}" alt="${iname(id)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 3%22%3E%3Crect width=%224%22 height=%223%22 fill=%22%23E4F0EE%22/%3E%3C/svg%3E'">`;

function go(fn) {
  const run = () => { fn(); resetCounts("c:"); render(); root.querySelector(".scr")?.scrollTo(0, 0); };
  run(); root.querySelector(".scr")?.classList.add("enter");
}

// ---------- views ----------
function loginView() {
  return `<div class="login">
    <svg class="biglogo" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 27a22 22 0 0 1 44 0" fill="none" stroke="var(--soft)" stroke-width="8" stroke-linecap="round"/><path d="M54 37a22 22 0 0 1-44 0" fill="none" stroke="var(--coral)" stroke-width="8" stroke-linecap="round"/></svg>
    <div class="hero-photos">${["bento", "salmon", "sand", "salad", "karaage"].map((id, i) => `<span style="--i:${i}">${img(id)}</span>`).join("")}</div>
    <h2>${t("loginTitle").replace("\n", "<br>")}</h2><p>${t("loginLead")}</p>
    <div class="chainnames">${Object.values(CHAINS).map(c => `<b style="color:${c.color}">${c[L()]}</b>`).join("<i>·</i>")}</div>
    <div class="mode auth"><button class="${V.auth === "in" ? "on" : ""}" data-auth="in">${t("signin")}</button><button class="${V.auth === "up" ? "on" : ""}" data-auth="up">${t("signup")}</button><i style="transform:translateX(${V.auth === "in" ? 0 : 100}%)"></i></div>
    <form class="authf" onsubmit="return false">
      ${V.auth === "up" ? `<label class="fld"><span>${t("name")}</span><input id="cName" maxlength="24" autocomplete="nickname" placeholder="Jobayer"></label>` : ""}
      <label class="fld"><span>${t("email")}</span><input id="cEmail" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${V.auth === "in" ? "demo@gochi.demo" : ""}"></label>
      <label class="fld"><span>${V.auth === "up" ? t("pw6") : t("pw")}</span><input id="cPw" type="password" autocomplete="${V.auth === "up" ? "new-password" : "current-password"}" value="${V.auth === "in" ? "demo1234" : ""}"></label>
      <button class="cbtn primary" data-act="${V.auth === "up" ? "signup" : "signin"}">${V.auth === "up" ? t("signup") : t("signin")}</button>
    </form>
    <button class="cbtn ghost" data-act="guest">${t("guest")}</button>
    <p class="fine">Demo login is filled in: just tap Sign in. (demo@gochi.demo · demo1234)</p>
    <p class="fine">${t("loginNote")}</p></div>`;
}

function homeView() {
  const q = V.q.toLowerCase();
  const list = STORES.filter(s => V.chain === "all" || s.chain === V.chain)
    .filter(s => !q || storeName(s, L()).toLowerCase().includes(q) || menuFor(s).some(m => (m.en + m.jp).toLowerCase().includes(q)))
    .filter(s => V.mode === "pre" || dealCount(s.id) > 0).sort((a, b) => a.km - b.km);
  const u = DB.user.name;
  return `<header class="hello"><div><small>${ico("pin", 14)} ${t("near")}</small><b>${t("homeTitle")}</b></div><button class="avatar" data-nav="profile">${esc(u.slice(0, 1).toUpperCase())}</button></header>
    <div class="banner"><div><b>${t("oneApp")}</b><small>${Object.values(CHAINS).map(c => `<span style="color:${c.color}">${c[L()]}</span>`).join(" · ")}</small></div>${img("bento", "bannerimg")}</div>
    <div class="mode" role="tablist"><button class="${V.mode === "pre" ? "on" : ""}" data-mode="pre">${t("modePre")}</button><button class="${V.mode === "deal" ? "on" : ""}" data-mode="deal">${t("modeDeal")}</button><i style="transform:translateX(${V.mode === "pre" ? 0 : 100}%)"></i></div>
    <p class="hint">${V.mode === "pre" ? t("preHint") : t("dealHint")}</p>
    <input class="search" id="cSearch" type="search" placeholder="${t("search")}" value="${V.q.replace(/"/g, "")}">
    <div class="chips">${["all", ...Object.keys(CHAINS)].map(k => `<button class="${V.chain === k ? "on" : ""}" data-chain="${k}" ${k !== "all" ? `style="--c:${CHAINS[k].color}"` : ""}>${k === "all" ? t("all") : CHAINS[k][L()]}</button>`).join("")}</div>
    <div class="map">${STORES.map(s => `<button class="pin ${list.includes(s) ? "" : "dim"}" style="left:${s.x}%;top:${s.y}%;--c:${CHAINS[s.chain].color}" data-store="${s.id}" aria-label="${storeName(s, L())}">${CHAINS[s.chain].short}${V.mode === "deal" && dealCount(s.id) ? `<em>${dealCount(s.id)}</em>` : ""}</button>`).join("")}<span class="me" style="left:50%;top:46%"></span></div>
    <div class="slist">${list.map((s, i) => `<button class="srow" style="--i:${i}" data-store="${s.id}">${chip(s)}<span class="sinfo"><b>${storeLabel(s, L())}</b><small>${t("km")(s.km)} · ${V.mode === "pre" ? t("orderBy")(SLOTS[1].cutoff) : t("deals")(dealCount(s.id))}</small></span>
      <span class="thumbs">${(V.mode === "deal" ? dealsOf(s.id).map(l => l.item) : ["bento", "salmon"]).slice(0, 2).map(id => img(id, "mini")).join("")}</span></button>`).join("")}</div>
    <p class="fine">${t("demo")}</p>`;
}

function storeView() {
  const s = storeById(V.store), menu = menuFor(s), deals = dealsOf(s.id);
  const inCart = (key) => V.cart.store === s.id && V.cart.lines.some(l => l.key === key);
  return `<header class="shead"><button class="back" data-act="home" aria-label="Back">‹</button>${chip(s)}<div><b>${storeLabel(s, L())}</b><small>${t("km")(s.km)}</small></div></header>
    <div class="mode"><button class="${V.mode === "pre" ? "on" : ""}" data-mode="pre">${t("menu")}</button><button class="${V.mode === "deal" ? "on" : ""}" data-mode="deal">${t("tonight")} · ${dealCount(s.id)}</button><i style="transform:translateX(${V.mode === "pre" ? 0 : 100}%)"></i></div>
    <div class="grid">${V.mode === "pre"
      ? menu.map((m, i) => `<article class="pcard" style="--i:${i}">${img(m.id)}<div class="pc"><b>${iname(m.id)}</b><span class="price">${yen(m.price)}</span>
          <button class="add ${inCart("pre:" + m.id) ? "done" : ""}" data-add="pre:${m.id}" aria-label="${t("add")}">${inCart("pre:" + m.id) ? ico("check", 18) : ico("plus", 18)}</button></div></article>`).join("")
      : deals.length ? deals.map((l, i) => { const now = l.price * (1 - l.discount / 100);
          return `<article class="pcard deal" style="--i:${i}"><span class="sticker">−${l.discount}%</span>${img(l.item)}<div class="pc"><b>${iname(l.item)}</b>
            <span class="price"><s>${yen(l.price)}</s> ${yen(now)}</span><small>${t("left")(l.qty - l.sold)} · ${t("bb")(l.bestBefore)}</small>${l.checked ? `<small class="chk">${ico("check", 12)} ${t("checked")}</small>` : ""}
            <button class="add ${inCart("deal:" + l.id) ? "done" : ""}" data-add="deal:${l.id}" aria-label="${t("add")}">${inCart("deal:" + l.id) ? ico("check", 18) : ico("plus", 18)}</button></div></article>`; }).join("")
      : `<p class="emptyc">—</p>`}</div>`;
}

function ordersView() {
  const list = myOrders();
  if (!list.length) return `<h3 class="ttl">${t("orders")}</h3><p class="emptyc">${t("noOrders")}</p>`;
  return `<h3 class="ttl">${t("orders")}</h3>` + [...list].reverse().map((o, i) => {
    const s = storeById(o.store);
    return `<article class="ocard" style="--i:${i}"><div class="oimg">${img(o.lines[0].item)}</div><div class="oinfo"><b>${storeLabel(s, L())}</b>
      <small>${o.kind === "pre" ? t(o.day) + " · " + SLOTS.find(x => x.id === o.slot).label : "21:00–00:30"} · ${yen(o.total)}</small>
      <small>${o.lines.map(l => `${iname(l.item)} ×${l.qty}`).join(", ")}</small>
      <div class="steps">${[0, 1, 2, 3].map(k => `<span class="${k <= o.status ? "on" : ""}"></span>`).join("")}</div>
      <span class="stat s${o.status}">${t("st")[o.status]}</span></div>
      <div class="ocode"><small>${t("code")}</small><b>${o.code}</b></div></article>`;
  }).join("");
}

function profileView() {
  const done = myOrders().filter(o => o.status === 3), open = myOrders().filter(o => o.status < 3 && o.kind === "deal");
  const im = impactOf(done), pot = impactOf(open);
  return `<div class="prof"><span class="avatar big">${esc(DB.user.name.slice(0, 1).toUpperCase())}</span><b>${esc(DB.user.name)}</b></div>
    <h3 class="ttl">${t("impactMine")}</h3>
    <small class="lbl">${t("confirmed")}</small>
    <div class="mini"><div><b data-count="${myOrders().length}">0</b><small>${t("orderCount")}</small></div><div><b data-count="${im.kg}" data-dec="2" data-suf=" kg">0</b><small>${t("foodSaved")}</small></div>
      <div><b data-count="${im.saved}" data-pre="¥">0</b><small>${t("money")}</small></div><div><b data-count="${im.co2}" data-dec="2" data-suf=" kg">0</b><small>${t("co2")}</small></div></div>
    ${pot.kg ? `<div class="potential"><b>${t("potential")}</b><span>${pot.kg.toFixed(2)} kg · ${pot.co2.toFixed(2)} kg CO₂e</span><small>${t("potentialNote")}</small></div>` : ""}
    ${methodHTML(L(), t("howCount"))}
    <button class="cbtn ghost" data-act="logout">${t("logout")}</button>`;
}

function sheetView() {
  const s = V.cart.store && storeById(V.cart.store), lines = V.cart.lines;
  const total = lines.reduce((a, l) => a + l.qty * l.price, 0), saved = lines.reduce((a, l) => a + l.qty * (l.full - l.price), 0);
  const hasPre = lines.some(l => l.kind === "pre");
  return `<div class="scrim ${V.sheet ? "on" : ""}" data-act="close"></div>
  <section class="sheet ${V.sheet ? "on" : ""}" role="dialog" aria-modal="true" aria-label="${t("cart")}"><span class="grab" data-drag></span><h3>${t("cart")}</h3>
    ${!lines.length ? `<p class="emptyc">${t("empty")}</p>` : `<small class="muted">${storeLabel(s, L())}</small>
    ${lines.map((l, i) => `<div class="line">${img(l.item, "mini")}<span class="ln">${iname(l.item)}${l.kind === "deal" ? ` <em>−${l.discount}%</em>` : ""}</span>
      <span class="qty"><button data-qty="${i}" data-d="-1" aria-label="−">−</button><b>${l.qty}</b><button data-qty="${i}" data-d="1" aria-label="+">+</button></span><span class="lp">${yen(l.qty * l.price)}</span></div>`).join("")}
    ${hasPre ? `<div class="slotpick"><small>${t("slot")}</small><div class="seg2">${["today", "tomorrow"].map(d => `<button class="${V.day === d ? "on" : ""}" data-day="${d}">${t(d)}</button>`).join("")}</div>
      <div class="seg2">${SLOTS.map(x => `<button class="${V.slot === x.id ? "on" : ""}" data-slot="${x.id}">${x.label}</button>`).join("")}</div></div>` : ""}
    <p class="allergen">${t("allergen")}</p><div class="tot"><span>${t("total")}</span><b>${yen(total)}</b></div>${saved > 0 ? `<p class="save">${t("saved")(yen(saved))}</p>` : ""}
    <button class="cbtn primary" data-act="place">${t("place")}</button><p class="fine">${t("payNote")}</p>`}</section>`;
}

function doneView() {
  return V.done ? `<div class="done" role="status"><div class="burst"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
    <b>${t("done")}</b><small>${t("doneSub")(V.done)}</small></div>` : "";
}

function render() {
  if (!root) return;
  const logged = !!DB.user;
  const body = !logged ? loginView() : V.screen === "store" ? storeView() : V.screen === "orders" ? ordersView() : V.screen === "profile" ? profileView() : homeView();
  const ready = myOrders().filter(o => o.status === 2).length;
  root.innerHTML = `<div class="app cust">
    <div class="scr" style="view-transition-name:cscr">${body}</div>
    ${logged ? `<button class="fab ${cartCount() ? "" : "hide"}" data-act="cart" aria-label="${t("cart")}"><svg viewBox="0 0 24 24"><path d="M6 6h15l-2 9H8L6 3H3"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg><b class="badge">${cartCount()}</b></button>
    <nav class="bnav">${[["home", "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z", t("home")], ["orders", "M7 3h10l3 4v14H4V7zM4 7h16M9 12h6", t("orders")], ["profile", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0", t("profile")]]
      .map(([k, d, l]) => `<button class="${V.screen === k || (k === "home" && V.screen === "store") ? "on" : ""}" data-nav="${k}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg>${l}${k === "orders" && ready ? `<em class="dot"></em>` : ""}</button>`).join("")}</nav>${sheetView()}${doneView()}` : ""}
  </div>`;
  countAll(root, "c:" + V.screen + ":");
  const inp = root.querySelector("#cSearch");
  if (inp) inp.oninput = e => { V.q = e.target.value; const pos = e.target.selectionStart; render(); const n = root.querySelector("#cSearch"); n.focus(); n.setSelectionRange(pos, pos); };
  wireSheetDrag();
}

// ---------- interactions ----------
function flyToCart(fromEl) {
  const fab = root.querySelector(".fab"); const im = fromEl?.closest(".pcard")?.querySelector(".ph");
  if (!fab || !im || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = im.getBoundingClientRect(), b = fab.getBoundingClientRect();
  const c = im.cloneNode(); c.className = "flyer";
  Object.assign(c.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
  document.body.appendChild(c);
  c.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.12)`, opacity: .6 }],
    { duration: 650, easing: "cubic-bezier(.5,0,.75,0)" }).onfinish = () => { c.remove(); const bd = root.querySelector(".badge"); bd?.animate([{ transform: "scale(1)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }], { duration: 320, easing: "cubic-bezier(.23,1,.32,1)" }); };
}
function addToCart(key, btn) {
  const [kind, ref] = key.split(":"); const s = storeById(V.store);
  if (V.cart.store && V.cart.store !== s.id && V.cart.lines.length) { if (!confirm(t("other"))) return; V.cart = { store: null, lines: [] }; }
  V.cart.store = s.id;
  let line;
  if (kind === "pre") { const m = menuFor(s).find(x => x.id === ref); line = { key, kind, item: ref, price: m.price, full: m.price, discount: 0 }; }
  else { const l = dealsOf(s.id).find(x => x.id === ref); if (!l) return; line = { key, kind, item: l.item, listing: l.id, price: Math.round(l.price * (1 - l.discount / 100)), full: l.price, discount: l.discount, max: l.qty - l.sold }; }
  const ex = V.cart.lines.find(l => l.key === key);
  if (ex) { if (!ex.max || ex.qty < ex.max) ex.qty++; } else V.cart.lines.push({ ...line, qty: 1 });
  flyToCart(btn); haptic(); render();
}
function checkout() {
  const st = V.cart.store; let code;
  for (const kind of ["pre", "deal"]) {
    const lines = V.cart.lines.filter(l => l.kind === kind).map(({ item, qty, price, full, discount, listing }) => ({ item, qty, price, full, discount, listing }));
    if (!lines.length) continue;
    code = placeOrder({ store: st, kind, lines, day: V.day, slot: V.slot }).code;
  }
  V.cart = { store: null, lines: [] }; V.sheet = false; V.done = code; haptic(20);
  render(); setTimeout(() => { V.done = null; go(() => { V.screen = "orders"; }); }, 1700);
}
function wireSheetDrag() {
  const sh = root.querySelector(".sheet.on"); if (!sh) return;
  let y0 = null, dy = 0;
  sh.onpointerdown = e => { if (!e.target.closest("[data-drag], h3")) return; y0 = e.clientY; sh.setPointerCapture(e.pointerId); sh.style.transition = "none"; };
  sh.onpointermove = e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; };
  sh.onpointerup = () => { if (y0 === null) return; sh.style.transition = ""; sh.style.transform = ""; if (dy > 90) { V.sheet = false; render(); } y0 = null; dy = 0; };
}

export function mountCustomer(el, context) {
  ctx = context; root = el; render();
  subscribe(() => {
    for (const o of myOrders()) if (o.status === 2 && !seenReady.has(o.id)) { seenReady.add(o.id); if (o.at > Date.now() - 36e5) toast(t("readyToast")(storeName(storeById(o.store), L())), "ok"); }
    if (!V.sheet && !V.done) render();
  });
  myOrders().forEach(o => o.status >= 2 && seenReady.add(o.id));
  root.addEventListener("click", e => {
    const b = e.target.closest("button, .scrim"); if (!b) return;
    const d = b.dataset;
    if (d.auth) { V.auth = d.auth; render(); return; }
    if (d.act === "guest") { DB.user = { name: L() === "jp" ? "ゲスト" : "Guest" }; commit({}); go(() => { V.screen = "home"; }); return; }
    if (d.act === "signin" || d.act === "signup") {
      const v = id => (root.querySelector(id)?.value || "").trim();
      (d.act === "signup" ? signUpCustomer({ name: v("#cName"), email: v("#cEmail"), pw: root.querySelector("#cPw").value }) : signInCustomer(v("#cEmail"), root.querySelector("#cPw").value))
        .then(r => { if (r === "ok") { toast(t("welcome")(DB.user.name), "ok"); go(() => { V.screen = "home"; }); } else toast(t(r === "exists" ? "errExists" : r === "invalid" ? "errInvalid" : "errWrong"), "err"); });
      return;
    }
    if (d.act === "logout") { DB.user = null; commit({}); toast(t("bye")); go(() => { V.auth = "in"; }); return; }
    if (d.act === "home") { go(() => { V.screen = "home"; }); return; }
    if (d.act === "cart") { V.sheet = true; render(); return; }
    if (d.act === "close") { V.sheet = false; render(); return; }
    if (d.act === "place") { checkout(); return; }
    if (d.mode) { V.mode = d.mode; render(); return; }
    if (d.chain) { V.chain = d.chain; render(); return; }
    if (d.store) { go(() => { V.store = d.store; V.screen = "store"; }); return; }
    if (d.nav) { go(() => { V.screen = d.nav; }); return; }
    if (d.add) { addToCart(d.add, b); return; }
    if (d.qty) { const l = V.cart.lines[+d.qty]; l.qty += +d.d; if (l.max && l.qty > l.max) l.qty = l.max; if (l.qty <= 0) V.cart.lines.splice(+d.qty, 1); if (!V.cart.lines.length) V.cart.store = null; render(); return; }
    if (d.day) { V.day = d.day; render(); return; }
    if (d.slot) { V.slot = d.slot; render(); return; }
  });
}
export const rerenderCustomer = () => render();
