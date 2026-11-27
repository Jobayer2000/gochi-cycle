// Gochi Cycle store portal (mobile first): staff login with roles, AI production plan,
// product listing with AI discount suggestion, live "sold" notifications, orders board, wallet, reports, staff.
import { ITEMS, WEATHER, FEATURE_NAMES, FACTORS, makeHistory, trainAll, plan } from "./model.js";
import { CHAINS, STORES, PHOTO, storeById, storeLabel, storeName, menuFor } from "./stores.js";
import { DB, commit, subscribe, listingsFor, addListing, updateListing, removeListing, suggestDiscount, ordersFor, setStatus,
  notesFor, markRead, walletFor, requestPayout, staffFor, addStaff, impactOf, FEE, signInStore, signUpStore } from "./state.js";
import { countAll, resetCounts, toast, haptic, ico } from "./ui.js";

const T = {
  en: {
    portal: "Store portal", authLead: "Sell what you would throw away, and make the right amount with AI.", signinE: "Sign in with email", register: "Register your store", quick: "Demo sign-in · any 4-digit PIN", anyPin: "Demo: pick a store, then type any 4 digits (e.g. 1234).",
    email: "Email", pin4: "4-digit PIN", yourName: "Manager name", whichStore: "Your store", create: "Create store account", errWrong: "Email or PIN is wrong.", errExists: "This email is already registered.", errInvalid: "Fill in all fields; PIN must be 4 digits.", welcome: n => `Signed in as ${n}`, regNote: "Demo: accounts stay in this browser. Real stores would verify ownership with the chain.",
    pick: "Choose your store", who: "Who is working?", pin: "Enter PIN", demoPins: "Demo PINs · manager 1111 · staff 2222", wrong: "Wrong PIN",
    manager: "Manager", staff: "Staff", tabs: ["Today", "Listings", "Orders", "Wallet", "More"],
    todayTitle: "Tomorrow's AI plan", editHint: "The AI suggests; you decide. Change how many to make, how many to list and the discount, then list.", makeL: "Make", listL: "List", discL: "Discount", aiWas: v => `AI: ${v}`, edited: "edited", resetAI: "Reset to AI", nothing: "Nothing to list", day: "Day", temp: "Temperature", event: "Local event",
    weather: { sunny: "Sunny", cloudy: "Cloudy", rain: "Rain" }, days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    fc: "AI forecast", make: n => `Make ${n}`, usual: n => `usual ${n}`, preApp: n => `${n} pre-ordered in app`, leftover: n => `~${n} may be left`,
    listOne: (n, d) => `List ${n} at −${d}%`, listAll: "List all expected leftovers", listed: n => `${n} items listed in the customer app`,
    avoided: "Leftovers avoided", vsUsual: "vs usual plan",
    listingsTitle: "Live listings", newListing: "New listing", none: "No live listings. Add one, or list leftovers from Today.",
    sold: (s, q) => `${s}/${q} sold`, bb: x => `best before ${x}`, pickup: (a, b) => `pickup ${a}–${b}`, edit: "Edit", remove: "Remove",
    product: "Product", price: "Regular price", qty: "Quantity", bestBefore: "Best before", from: "Pickup from", to: "until", discount: "Discount",
    aiSuggest: d => `AI suggests ${d}%`, aiWhy: (h, q) => `${h} h until best before · ${q} items`, staffMax: "Staff can give up to 30%. Ask a manager for more.",
    preview: "Customer sees", publish: "Publish", save: "Save changes",
    ordersTitle: "Orders", oNew: "New", oReady: "To hand over", oDone: "Done", noOrd: "Nothing here yet.",
    pre: "Pre-order", deal: "Leftover deal", accept: "Accept", ready: "Mark ready", picked: "Picked up", codeAsk: c => `Ask the customer for code ${c}`,
    walletTitle: "Wallet", balance: "Available balance", gross: "Sales", fee: f => `Gochi fee (${f}%)`, net: "Net income", payout: "Request payout",
    payoutDone: a => `Payout of ${a} requested (demo)`, noPay: "Only a manager can request payouts.", tx: "Transactions", payouts: "Payouts", txNone: "Sales appear here when customers pick up.",
    moreTitle: "Reports", rescued: "Food rescued", income: "Income from leftovers", co2: "CO₂e avoided", orders: "Orders",
    week: "Last 7 days · income (¥)", weekNote: "Earlier days are demo data; today is live.", aiTitle: "How the AI works",
    aiLead: "One machine-learning model per item (ridge regression), trained on 120 days of sales. Tested on 14 days it never saw.",
    acc: "AI error vs usual method (items/day)", learned: "What the model learned (Makunouchi bento)",
    staffTitle: "Staff", addStaff: "Add staff", name: "Name", role: "Role", logout: "Log out", reset: "Reset demo data",
    notes: "Notifications", noNotes: "No notifications yet.", soldNote: (x, y) => `Sold: ${x} · ¥${y}`, demoData: "Demo data: synthetic sales history, no real store data.",
    wn: { base: "base", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", cloudy: "cloudy", rain: "rain", temperature: "+1 °C", "local event": "local event" },
  },
  jp: {
    portal: "店舗ポータル", authLead: "捨てるはずの食品を売り、AIでちょうどいい量を。", signinE: "メールでログイン", register: "店舗を登録", quick: "デモログイン・4桁PINなら何でもOK", anyPin: "デモ：店舗を選び、4桁の数字を入力（例：1234）。",
    email: "メールアドレス", pin4: "4桁のPIN", yourName: "店長の名前", whichStore: "店舗", create: "店舗アカウントを作成", errWrong: "メールアドレスまたはPINが違います。", errExists: "このメールアドレスは登録済みです。", errInvalid: "すべて入力してください（PINは4桁）。", welcome: n => `${n}さんでログインしました`, regNote: "デモ：アカウントはこのブラウザ内だけ。実際はチェーン本部で店舗確認を行います。",
    pick: "店舗を選択", who: "担当者は？", pin: "PINを入力", demoPins: "デモPIN・店長 1111・スタッフ 2222", wrong: "PINが違います",
    manager: "店長", staff: "スタッフ", tabs: ["今日", "出品", "注文", "ウォレット", "その他"],
    todayTitle: "明日のAIプラン", editHint: "AIが提案し、お店が決めます。製造数・出品数・値引き率を変更して出品できます。", makeL: "製造", listL: "出品", discL: "値引き", aiWas: v => `AI：${v}`, edited: "変更済み", resetAI: "AIの値に戻す", nothing: "出品なし", day: "曜日", temp: "気温", event: "地域イベント",
    weather: { sunny: "晴れ", cloudy: "くもり", rain: "雨" }, days: ["日", "月", "火", "水", "木", "金", "土"],
    fc: "AI予測", make: n => `${n}個つくる`, usual: n => `いつも ${n}個`, preApp: n => `アプリ予約 ${n}個`, leftover: n => `約${n}個 残る見込み`,
    listOne: (n, d) => `${n}個を−${d}%で出品`, listAll: "売れ残り予定をすべて出品", listed: n => `${n}個を利用者アプリに出品しました`,
    avoided: "売れ残り削減", vsUsual: "いつもの量と比べて",
    listingsTitle: "出品中", newListing: "新規出品", none: "出品中の商品はありません。追加するか「今日」から出品してください。",
    sold: (s, q) => `${s}/${q} 販売`, bb: x => `消費期限 ${x}`, pickup: (a, b) => `受取 ${a}〜${b}`, edit: "編集", remove: "取り下げ",
    product: "商品", price: "通常価格", qty: "数量", bestBefore: "消費期限", from: "受取開始", to: "終了", discount: "値引き",
    aiSuggest: d => `AIのおすすめ ${d}%`, aiWhy: (h, q) => `期限まで${h}時間・${q}個`, staffMax: "スタッフは30%まで。それ以上は店長へ。",
    preview: "利用者の表示", publish: "出品する", save: "保存",
    ordersTitle: "注文", oNew: "新規", oReady: "受け渡し待ち", oDone: "完了", noOrd: "まだありません。",
    pre: "予約注文", deal: "値引き品", accept: "受付", ready: "準備完了", picked: "受け渡し完了", codeAsk: c => `お客様のコード ${c} を確認`,
    walletTitle: "ウォレット", balance: "出金可能残高", gross: "売上", fee: f => `Gochi手数料（${f}%）`, net: "純収入", payout: "出金をリクエスト",
    payoutDone: a => `${a}の出金をリクエストしました（デモ）`, noPay: "出金は店長のみ可能です。", tx: "取引", payouts: "出金履歴", txNone: "受け渡しが完了すると売上がここに表示されます。",
    moreTitle: "レポート", rescued: "救った食品", income: "値引き品の売上", co2: "CO₂e削減", orders: "注文",
    week: "直近7日・売上（円）", weekNote: "過去の日はデモデータ、今日は実際の値です。", aiTitle: "AIのしくみ",
    aiLead: "商品ごとの機械学習モデル（リッジ回帰）を120日分の販売データで学習。学習に使っていない14日間でテスト。",
    acc: "AIの誤差といつもの方法（個/日）", learned: "モデルが学んだこと（幕の内弁当）",
    staffTitle: "スタッフ", addStaff: "スタッフを追加", name: "名前", role: "役割", logout: "ログアウト", reset: "デモデータをリセット",
    notes: "通知", noNotes: "通知はまだありません。", soldNote: (x, y) => `販売：${x}・¥${y}`, demoData: "デモデータ：架空の販売履歴。実際の店舗データは使用していません。",
    wn: { base: "基本", Mon: "月曜", Tue: "火曜", Wed: "水曜", Thu: "木曜", Fri: "金曜", Sat: "土曜", cloudy: "くもり", rain: "雨", temperature: "気温+1℃", "local event": "地域イベント" },
  },
};

const models = trainAll(makeHistory());
const P = { adj: {}, tab: 0, step: "home", store: null, staff: null, pin: "", ctx: { wd: 5, weather: "rain", temp: 14, event: 0 }, ord: 0, sheet: null, notes: false };
let ctx, root, lastNotes = 0;
const L = () => ctx.lang();
const t = k => T[L()][k];
const yen = n => "¥" + Math.round(n).toLocaleString();
const iname = id => { const i = ITEMS.find(x => x.id === id); return L() === "jp" ? i.jp : i.en; };
const S = () => DB.session;
const isMgr = () => S()?.role === "manager";
const img = (id, cls = "") => `<img class="ph ${cls}" src="${PHOTO(id)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 3%22%3E%3Crect width=%224%22 height=%223%22 fill=%22%23E4F0EE%22/%3E%3C/svg%3E'">`;
const nowHM = () => new Date().toTimeString().slice(0, 5);
function hoursUntil(hm) { const [h, m] = hm.split(":").map(Number); const n = new Date(); let d = new Date(n); d.setHours(h, m, 0, 0); if (d < n) d.setDate(d.getDate() + 1); return Math.max(0, (d - n) / 36e5); }

function preFromApp(store) {
  const out = {};
  for (const o of ordersFor(store)) if (o.kind === "pre" && o.day === "tomorrow") for (const l of o.lines) out[l.item] = (out[l.item] || 0) + l.qty;
  return out;
}

// ---------- login ----------
function loginView() {
  if (P.step === "home") return `<div class="plogin"><svg class="biglogo" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 27a22 22 0 0 1 44 0" fill="none" stroke="var(--soft)" stroke-width="8" stroke-linecap="round"/><path d="M54 37a22 22 0 0 1-44 0" fill="none" stroke="var(--coral)" stroke-width="8" stroke-linecap="round"/></svg>
    <h2>${t("portal")}</h2><p class="muted">${t("authLead")}</p>
    <button class="cbtn primary" data-pstep="store">${t("quick")}</button><p class="fine">${t("anyPin")}</p><button class="cbtn ghost" data-pstep="signin">${t("signinE")}</button><button class="cbtn ghost" data-pstep="signup">${t("register")}</button></div>`;
  if (P.step === "signin") return `<div class="plogin"><button class="back" data-pstep="home">‹</button><h2>${t("signinE")}</h2>
    <form class="authf" onsubmit="return false"><label class="fld"><span>${t("email")}</span><input id="sEmail" type="email" autocomplete="email" inputmode="email" value="store@gochi.demo"></label>
    <label class="fld"><span>${t("pin4")}</span><input id="sPin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" value="1111"></label>
    <button class="cbtn primary" data-sauth="in">${t("signinE")}</button></form><p class="fine">Demo: store@gochi.demo · PIN 1111</p></div>`;
  if (P.step === "signup") return `<div class="plogin"><button class="back" data-pstep="home">‹</button><h2>${t("register")}</h2>
    <form class="authf" onsubmit="return false"><label class="fld"><span>${t("whichStore")}</span><select id="sStore">${STORES.map(s => `<option value="${s.id}">${storeName(s, L())}</option>`).join("")}</select></label>
    <label class="fld"><span>${t("yourName")}</span><input id="sName" maxlength="20" autocomplete="name"></label>
    <label class="fld"><span>${t("email")}</span><input id="sEmail" type="email" autocomplete="email" inputmode="email"></label>
    <label class="fld"><span>${t("pin4")}</span><input id="sPin" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password"></label>
    <button class="cbtn primary" data-sauth="up">${t("create")}</button></form><p class="fine">${t("regNote")}</p></div>`;
  if (P.step === "store") return `<div class="plogin"><button class="back" data-pstep="home">‹</button><h2>${t("quick")}</h2><p class="muted">${t("pick")}</p>
    <div class="storelist">${STORES.map((s, i) => `<button class="srow" style="--i:${i}" data-pickstore="${s.id}"><span class="chain" style="--c:${CHAINS[s.chain].color}">${CHAINS[s.chain].short}</span><span class="sinfo"><b>${storeLabel(s, L())}</b></span><span class="go">›</span></button>`).join("")}</div></div>`;
  const s = storeById(P.store);
  if (P.step === "who") return `<div class="plogin"><button class="back" data-pstep="store">‹</button><h2>${storeLabel(s, L())}</h2><p class="muted">${t("who")}</p>
    <div class="who">${staffFor(s.id).map(p => `<button class="person" data-pickstaff="${p.id}"><span class="avatar">${p.name[0]}</span><b>${p.name}</b><small>${t(p.role)}</small></button>`).join("")}</div></div>`;
  const p = staffFor(s.id).find(x => x.id === P.staff);
  return `<div class="plogin"><button class="back" data-pstep="store">‹</button><span class="avatar big">${p.name[0]}</span><h2>${p.name}</h2><p class="muted">${t("pin")}</p>
    <div class="pindots ${P.pinErr ? "shake" : ""}">${[0, 1, 2, 3].map(i => `<i class="${i < P.pin.length ? "on" : ""}"></i>`).join("")}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map(k => k === "" ? "<span></span>" : `<button data-key="${k}">${k}</button>`).join("")}</div>
    <p class="fine">${t("anyPin")}</p></div>`;
}

// ---------- tabs ----------
function eff(r) {
  const a = P.adj[r.id] || {}, maxD = isMgr() ? 60 : 30;
  const make = a.make ?? r.aiMake;
  const left = Math.max(0, make - Math.round(r.forecast));
  const n = Math.min(a.n ?? left, make);
  const d = Math.min(a.d ?? r.discount, maxD);
  return { make, left, n, d, edited: a.make !== undefined || a.n !== undefined || a.d !== undefined };
}
function todayView() {
  const s = S().store, app = preFromApp(s);
  const c = { ...P.ctx, preorders: app };
  const rows = plan(models, c);
  const avoided = rows.reduce((a, r) => a + Math.max(0, r.leftoverHabit - r.leftoverAI), 0);
  return `<h3 class="ttl">${t("todayTitle")}</h3>
    <div class="ctrls card">
      <div class="seg2 days">${t("days").map((d, i) => `<button class="${P.ctx.wd === i ? "on" : ""}" data-wd="${i}">${d}</button>`).join("")}</div>
      <div class="seg2">${WEATHER.map(w => `<button class="${P.ctx.weather === w ? "on" : ""}" data-w="${w}">${ico({ sunny: "sun", cloudy: "cloud", rain: "rain" }[w], 14)} ${t("weather")[w]}</button>`).join("")}</div>
      <label class="range"><span>${t("temp")} <b>${P.ctx.temp}°C</b></span><input id="pTemp" type="range" min="0" max="35" value="${P.ctx.temp}"></label>
      <label class="tog"><input type="checkbox" id="pEvent" ${P.ctx.event ? "checked" : ""}><span></span>${t("event")}</label>
    </div>
    <div class="kpi2"><div><small>${t("avoided")}</small><b data-count="${avoided}">0</b><small>${t("vsUsual")}</small></div>
      <button class="cbtn primary" data-listall>${t("listAll")}</button></div>
    <p class="hint">${t("editHint")}</p>
    <div class="plist">${rows.map((r, i) => { const e = eff(r), max = Math.max(r.habit, e.make, 1);
      return `<article class="prow" style="--i:${i}">${img(r.id)}<div class="pr"><b>${iname(r.id)}${e.edited ? ` <span class="tag">${t("edited")}</span>` : ""}</b>
      <small>${t("fc")} <b class="ai">${r.forecast.toFixed(0)}</b> · ${t("usual")(r.habit)}${r.pre ? ` · <span class="tag">${t("preApp")(r.pre)}</span>` : ""}</small>
      <span class="bar"><i style="width:${(e.make / max) * 100}%"></i><i class="u" style="width:${(r.habit / max) * 100}%"></i></span></div>
      <div class="adj">
        <div class="adjrow"><span>${t("makeL")}</span><span class="stepper sm"><button data-adj="${r.id}|make|-1" aria-label="−">−</button><b>${e.make}</b><button data-adj="${r.id}|make|1" aria-label="+">+</button></span><small>${t("aiWas")(r.aiMake)}</small></div>
        <div class="adjrow"><span>${t("listL")}</span><span class="stepper sm"><button data-adj="${r.id}|n|-1" aria-label="−">−</button><b>${e.n}</b><button data-adj="${r.id}|n|1" aria-label="+">+</button></span><small>${t("aiWas")(e.left)}</small></div>
        <div class="adjrow"><span>${t("discL")}</span><span class="stepper sm"><button data-adj="${r.id}|d|-5" aria-label="−">−</button><b>${e.d}%</b><button data-adj="${r.id}|d|5" aria-label="+">+</button></span><small>${t("aiWas")(r.discount + "%")}</small></div>
        <div class="adjact">${e.n ? `<button class="mini-btn" data-listone="${r.id}" data-n="${e.n}" data-d="${e.d}">${t("listOne")(e.n, e.d)}</button>` : `<span class="muted sm">${t("nothing")}</span>`}
          ${e.edited ? `<button class="link" data-adjreset="${r.id}">${t("resetAI")}</button>` : ""}</div>
      </div></article>`; }).join("")}</div>`;
}

function listingsView() {
  const s = S().store, list = listingsFor(s);
  return `<div class="ttlrow"><h3 class="ttl">${t("listingsTitle")}</h3><button class="cbtn primary sm" data-new>+ ${t("newListing")}</button></div>
    ${list.length ? list.map((l, i) => `<article class="lcard" style="--i:${i}">${img(l.item)}<div class="lc"><b>${iname(l.item)}</b>
      <span class="price"><s>${yen(l.price)}</s> ${yen(l.price * (1 - l.discount / 100))} <em class="sticker sm">−${l.discount}%</em></span>
      <span class="bar"><i style="width:${(l.sold / l.qty) * 100}%"></i></span><small>${t("sold")(l.sold, l.qty)} · ${t("bb")(l.bestBefore)} · ${t("pickup")(l.from, l.to)}</small>
      <span class="acts"><button class="link" data-edit="${l.id}">${t("edit")}</button><button class="link danger" data-rm="${l.id}">${t("remove")}</button></span></div></article>`).join("")
      : `<p class="emptyc">${t("none")}</p>`}`;
}

function formSheet() {
  const f = P.sheet; if (!f) return "";
  const s = storeById(S().store), menu = menuFor(s);
  const h = +hoursUntil(f.bestBefore).toFixed(1), sug = suggestDiscount(h, f.qty), max = isMgr() ? 60 : 30;
  const now = Math.round(f.price * (1 - f.discount / 100));
  return `<div class="scrim on" data-closesheet></div><section class="sheet on tall" role="dialog" aria-modal="true"><span class="grab"></span>
    <h3>${f.id ? t("edit") : t("newListing")}</h3>
    <small class="lbl">${t("product")}</small><div class="prodpick">${menu.map(m => `<button class="${f.item === m.id ? "on" : ""}" data-fitem="${m.id}">${img(m.id)}<span>${iname(m.id)}</span></button>`).join("")}</div>
    <div class="frow"><label class="fld"><span>${t("price")}</span><input type="number" min="50" step="10" data-f="price" value="${f.price}" inputmode="numeric"></label>
      <div class="fld"><span>${t("qty")}</span><div class="stepper"><button data-fq="-1">−</button><b>${f.qty}</b><button data-fq="1">+</button></div></div></div>
    <div class="frow3"><label class="fld"><span>${t("bestBefore")}</span><input type="time" data-f="bestBefore" value="${f.bestBefore}"></label>
      <label class="fld"><span>${t("from")}</span><input type="time" data-f="from" value="${f.from}"></label><label class="fld"><span>${t("to")}</span><input type="time" data-f="to" value="${f.to}"></label></div>
    <div class="fld"><span>${t("discount")} <b class="dval">${f.discount}%</b></span><input type="range" min="0" max="${max}" step="5" data-f="discount" value="${Math.min(f.discount, max)}">
      <button class="aichip" data-applyai="${Math.min(sug, max)}">${t("aiSuggest")(Math.min(sug, max))}<small>${t("aiWhy")(h, f.qty)}</small></button>
      ${!isMgr() ? `<small class="muted">${t("staffMax")}</small>` : ""}</div>
    <small class="lbl">${t("preview")}</small>
    <div class="pcard deal prev"><span class="sticker">−${f.discount}%</span>${img(f.item)}<div class="pc"><b>${iname(f.item)}</b><span class="price"><s>${yen(f.price)}</s> ${yen(now)}</span><small>${t("bb")(f.bestBefore)}</small></div></div>
    <button class="cbtn primary" data-publish>${f.id ? t("save") : t("publish")}</button></section>`;
}

function ordersView() {
  const list = ordersFor(S().store).slice().reverse();
  const groups = [list.filter(o => o.status <= 1), list.filter(o => o.status === 2), list.filter(o => o.status === 3)];
  const g = groups[P.ord];
  return `<h3 class="ttl">${t("ordersTitle")}</h3>
    <div class="seg3">${[t("oNew"), t("oReady"), t("oDone")].map((x, i) => `<button class="${P.ord === i ? "on" : ""}" data-ord="${i}">${x}<em>${groups[i].length}</em></button>`).join("")}</div>
    ${g.length ? g.map((o, i) => `<article class="ocard st" style="--i:${i}"><div class="oimg">${img(o.lines[0].item)}</div><div class="oinfo">
      <b>#${o.code} · ${o.user}</b><small><span class="tag ${o.kind}">${t(o.kind)}</span> ${o.kind === "pre" ? (o.day === "today" ? "Today" : "Tomorrow") + " " + ({ am: "07:30", noon: "12:00", pm: "18:00" }[o.slot]) : "21:00–00:30"}</small>
      <small>${o.lines.map(l => `${iname(l.item)} ×${l.qty}`).join(", ")} · ${yen(o.total)}</small>
      ${o.status === 2 ? `<small class="muted">${t("codeAsk")(o.code)}</small>` : ""}</div>
      ${o.status === 0 ? `<button class="mini-btn" data-set="${o.id}" data-s="1">${t("accept")}</button>` : o.status === 1 ? `<button class="mini-btn" data-set="${o.id}" data-s="2">${t("ready")}</button>` : o.status === 2 ? `<button class="mini-btn ok" data-set="${o.id}" data-s="3">${t("picked")}</button>` : `<span class="okmark">✓</span>`}</article>`).join("")
      : `<p class="emptyc">${t("noOrd")}</p>`}`;
}

function walletView() {
  const w = walletFor(S().store);
  return `<h3 class="ttl">${t("walletTitle")}</h3>
    <div class="wallet"><small>${t("balance")}</small><b data-count="${w.balance}" data-pre="¥">¥0</b>
      <div class="wrow3"><span><small>${t("gross")}</small>${yen(w.gross)}</span><span><small>${t("fee")(FEE * 100)}</small>−${yen(w.fee)}</span><span><small>${t("net")}</small>${yen(w.net)}</span></div>
      <button class="cbtn light" data-payout ${w.balance > 0 ? "" : "disabled"}>${t("payout")}</button></div>
    <h4 class="sub">${t("tx")}</h4>${w.tx.length ? w.tx.map(x => `<div class="txrow"><span>${new Date(x.at).toLocaleTimeString().slice(0, 5)} · ${t(x.kind)}</span><b>+${yen(x.net)}</b></div>`).join("") : `<p class="emptyc">${t("txNone")}</p>`}
    ${w.payouts.length ? `<h4 class="sub">${t("payouts")}</h4>` + w.payouts.map(p => `<div class="txrow"><span>${new Date(p.at).toLocaleString().slice(0, 16)}</span><b>−${yen(p.amount)}</b></div>`).join("") : ""}`;
}

function moreView() {
  const s = S().store, im = impactOf(ordersFor(s).filter(o => o.status === 3)), inc = walletFor(s).net;
  const seedDays = [5200, 6100, 4300, 7400, 6800, 5900].map((v, i) => v + (s.charCodeAt(1) * 37 * (i + 1)) % 1500);
  const days = [...seedDays, inc], mx = Math.max(...days, 1);
  const m = models.bento, top = Math.max(...m.w.slice(1).map(Math.abs));
  return `<h3 class="ttl">${t("moreTitle")}</h3>
    <div class="mini"><div><b data-count="${im.kg}" data-dec="2" data-suf=" kg">0</b><small>${t("rescued")}</small></div><div><b data-count="${inc}" data-pre="¥">0</b><small>${t("income")}</small></div>
      <div><b data-count="${im.co2}" data-dec="2" data-suf=" kg">0</b><small>${t("co2")}</small></div><div><b data-count="${ordersFor(s).length}">0</b><small>${t("orders")}</small></div></div>
    <div class="card"><small class="lbl">${t("week")}</small><div class="wbars">${days.map((v, i) => `<span style="--h:${(v / mx) * 100}%;--i:${i}" class="${i === 6 ? "today" : ""}"><em>${Math.round(v / 100) / 10}k</em></span>`).join("")}</div><small class="muted">${t("weekNote")}</small></div>
    <div class="card"><b>${t("aiTitle")}</b><p class="muted sm">${t("aiLead")}</p><small class="lbl">${t("acc")}</small>
      ${ITEMS.map(it => { const mm = models[it.id], b = (1 - mm.maeAI / mm.maeHabit) * 100; return `<div class="accrow"><span>${iname(it.id)}</span><span class="ai">${mm.maeAI.toFixed(1)}</span><span class="muted">${mm.maeHabit.toFixed(1)}</span><span class="tag ok">−${b.toFixed(0)}%</span></div>`; }).join("")}
      <small class="lbl">${t("learned")}</small>${m.w.map((v, i) => i === 0 ? "" : `<div class="wrow"><span>${t("wn")[FEATURE_NAMES[i]]}</span><i class="wbar ${v < 0 ? "neg" : ""}" style="width:${(Math.abs(v) / top) * 100}%"></i><span>${v > 0 ? "+" : ""}${v.toFixed(1)}</span></div>`).join("")}
      <small class="muted">${t("demoData")}</small></div>
    <div class="card"><b>${t("staffTitle")}</b>${staffFor(s).map(p => `<div class="txrow"><span><span class="avatar xs">${p.name[0]}</span> ${p.name}</span><span class="tag">${t(p.role)}</span></div>`).join("")}
      ${isMgr() ? `<div class="frow"><input id="nsName" placeholder="${t("name")}" maxlength="16"><select id="nsRole"><option value="staff">${t("staff")}</option><option value="manager">${t("manager")}</option></select><button class="mini-btn" data-addstaff>${t("addStaff")}</button></div>` : ""}</div>
    <button class="cbtn ghost" data-plogout>${t("logout")}</button><button class="cbtn ghost" data-reset>${t("reset")}</button>`;
}

function notesPanel() {
  if (!P.notes) return "";
  const n = notesFor(S().store);
  return `<div class="scrim on" data-closenotes></div><section class="sheet on" role="dialog"><span class="grab"></span><h3>${t("notes")}</h3>
    ${n.length ? n.slice(0, 20).map(x => `<div class="txrow"><span>${t("soldNote")(x.text.replace(/(\d+)× (\w+)/g, (m, q, id) => `${q}× ${iname(id)}`), x.total)}</span><small class="muted">${new Date(x.at).toTimeString().slice(0, 5)}</small></div>`).join("") : `<p class="emptyc">${t("noNotes")}</p>`}</section>`;
}

function render() {
  if (!root) return;
  if (!S()) { root.innerHTML = `<div class="app portal"><div class="scr">${loginView()}</div></div>`; return; }
  const s = storeById(S().store), unread = notesFor(s.id).filter(n => !n.read).length;
  const body = [todayView, listingsView, ordersView, walletView, moreView][P.tab]();
  const newOrd = ordersFor(s.id).filter(o => o.status <= 1).length;
  const icons = ["M4 19h16M7 16V9m5 7V5m5 11v-4", "M4 7h16M4 12h16M4 17h10", "M7 3h10l3 4v14H4V7zM4 7h16", "M3 7h18v12H3zM3 11h18M16 15h2", "M5 12h.01M12 12h.01M19 12h.01"];
  root.innerHTML = `<div class="app portal">
    <header class="phead"><div><small>${t("portal")} · ${t(S().role)} ${S().name}</small><b>${storeLabel(s, L())}</b></div>
      <button class="bell" data-notes aria-label="${t("notes")}"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg>${unread ? `<em>${unread}</em>` : ""}</button></header>
    <div class="scr" style="view-transition-name:pscr">${body}</div>
    <nav class="bnav">${t("tabs").map((x, i) => `<button class="${P.tab === i ? "on" : ""}" data-ptab="${i}"><svg viewBox="0 0 24 24"><path d="${icons[i]}"/></svg>${x}${i === 2 && newOrd ? `<em class="dot"></em>` : ""}</button>`).join("")}</nav>
    ${formSheet()}${notesPanel()}</div>`;
  countAll(root, "p:" + P.tab + ":");
  const tmp = root.querySelector("#pTemp"); if (tmp) tmp.oninput = e => { P.ctx.temp = +e.target.value; render(); };
  const ev = root.querySelector("#pEvent"); if (ev) ev.onchange = e => { P.ctx.event = e.target.checked ? 1 : 0; render(); };
  root.querySelectorAll("[data-f]").forEach(inp => inp.oninput = e => {
    const k = inp.dataset.f; P.sheet[k] = inp.type === "number" || inp.type === "range" ? +e.target.value : e.target.value;
    if (k === "discount") { const v = root.querySelector(".dval"); if (v) v.textContent = P.sheet.discount + "%"; updatePreview(); } else if (inp.type !== "number") render(); else updatePreview();
  });
}
function updatePreview() {
  const f = P.sheet, pv = root.querySelector(".prev"); if (!pv) return;
  pv.querySelector(".sticker").textContent = `−${f.discount}%`;
  pv.querySelector(".price").innerHTML = `<s>${yen(f.price)}</s> ${yen(f.price * (1 - f.discount / 100))}`;
}
function go(fn) { const run = () => { fn(); resetCounts("p:"); render(); root.querySelector(".scr")?.scrollTo(0, 0); };
  run(); root.querySelector(".scr")?.classList.add("enter"); }

function listFromPlan(rows) {
  const s = storeById(S().store), menu = menuFor(s); let n = 0;
  for (const r of rows) { const m = menu.find(x => x.id === r.id); addListing({ store: s.id, item: r.id, price: m.price, discount: Math.min(r.discount, isMgr() ? 60 : 30), qty: r.n, bestBefore: "03:00", from: "21:00", to: "00:30", by: "AI" }); n += r.n; }
  toast(t("listed")(n), "ok"); haptic();
}

export function mountPortal(el, context) {
  ctx = context; root = el; render();
  lastNotes = S() ? notesFor(S().store).length : 0;
  subscribe(() => {
    if (S()) { const n = notesFor(S().store); if (n.length > lastNotes) { const x = n[0]; toast(t("soldNote")(x.text.replace(/(\d+)× (\w+)/g, (m, q, id) => `${q}× ${iname(id)}`), x.total), "sold"); haptic(15); } lastNotes = n.length; }
    if (!P.sheet) render();
  });
  root.addEventListener("click", e => {
    const b = e.target.closest("button, .scrim"); if (!b) return; const d = b.dataset;
    if (d.sauth) {
      const v = id => (root.querySelector(id)?.value || "").trim();
      (d.sauth === "up" ? signUpStore({ store: v("#sStore"), name: v("#sName"), email: v("#sEmail"), pin: v("#sPin") }) : signInStore(v("#sEmail"), v("#sPin")))
        .then(r => { if (r === "ok") { lastNotes = notesFor(S().store).length; P.tab = 0; toast(t("welcome")(S().name), "ok"); go(() => {}); } else toast(t(r === "exists" ? "errExists" : r === "invalid" ? "errInvalid" : "errWrong"), "err"); });
      return;
    }
    if (d.pickstore) { go(() => { P.store = d.pickstore; P.staff = "m"; P.step = "pin"; P.pin = ""; }); return; }
    if (d.pickstaff) { go(() => { P.staff = d.pickstaff; P.step = "pin"; P.pin = ""; }); return; }
    if (d.pstep) { go(() => { P.step = d.pstep; P.pin = ""; }); return; }
    if (d.key !== undefined) {
      if (d.key === "⌫") P.pin = P.pin.slice(0, -1); else if (P.pin.length < 4) P.pin += d.key;
      P.pinErr = false; haptic(5);
      if (P.pin.length === 4) { const p = staffFor(P.store).find(x => x.id === P.staff);
        if (/^\d{4}$/.test(P.pin)) { DB.session = { store: P.store, staff: p.id, role: p.role, name: p.name }; commit({}); lastNotes = notesFor(P.store).length; P.tab = 0; go(() => {}); return; }
        P.pin = ""; P.pinErr = true; toast(t("wrong"), "err"); }
      render(); return;
    }
    if (d.ptab) { go(() => { P.tab = +d.ptab; }); return; }
    if (d.wd) { P.ctx.wd = +d.wd; render(); return; }
    if (d.w) { P.ctx.weather = d.w; render(); return; }
    if (d.listall !== undefined) { const rows = plan(models, { ...P.ctx, preorders: preFromApp(S().store) }).map(r => ({ id: r.id, n: eff(r).n, discount: eff(r).d })).filter(r => r.n > 0); listFromPlan(rows); return; }
    if (d.adj) { const [id, f, step] = d.adj.split("|"); const r = plan(models, { ...P.ctx, preorders: preFromApp(S().store) }).find(x => x.id === id); const e = eff(r);
      const a = P.adj[id] || (P.adj[id] = {}); const maxD = isMgr() ? 60 : 30;
      if (f === "make") a.make = Math.max(0, Math.min(200, e.make + +step));
      if (f === "n") a.n = Math.max(0, Math.min(f === "n" ? (a.make ?? r.aiMake) : 50, e.n + +step));
      if (f === "d") { const v = e.d + +step; if (v > maxD) toast(t("staffMax"), "err"); a.d = Math.max(0, Math.min(maxD, v)); }
      haptic(5); render(); return; }
    if (d.adjreset) { delete P.adj[d.adjreset]; render(); return; }
    if (d.listone) { listFromPlan([{ id: d.listone, n: +d.n, discount: +d.d }]); return; }
    if (d.new !== undefined) { const m = menuFor(storeById(S().store))[0]; P.sheet = { item: m.id, price: m.price, qty: 3, bestBefore: "03:00", from: "21:00", to: "00:30", discount: 30 }; render(); return; }
    if (d.edit) { const l = DB.listings.find(x => x.id === d.edit); P.sheet = { ...l }; render(); return; }
    if (d.rm) { removeListing(d.rm); return; }
    if (d.fitem) { const m = menuFor(storeById(S().store)).find(x => x.id === d.fitem); P.sheet.item = m.id; P.sheet.price = m.price; render(); return; }
    if (d.fq) { P.sheet.qty = Math.max(1, Math.min(50, P.sheet.qty + +d.fq)); render(); return; }
    if (d.applyai) { P.sheet.discount = +d.applyai; render(); haptic(); return; }
    if (d.publish !== undefined) { const f = P.sheet; P.sheet = null;
      if (f.id) updateListing(f.id, { item: f.item, price: f.price, qty: Math.max(f.qty, f.sold || 0), bestBefore: f.bestBefore, from: f.from, to: f.to, discount: f.discount });
      else addListing({ store: S().store, item: f.item, price: f.price, qty: f.qty, bestBefore: f.bestBefore, from: f.from, to: f.to, discount: f.discount, by: S().name });
      toast(t("listed")(f.qty), "ok"); haptic(); render(); return; }
    if (d.closesheet !== undefined) { P.sheet = null; render(); return; }
    if (d.ord) { P.ord = +d.ord; render(); return; }
    if (d.set) { setStatus(d.set, +d.s); haptic(); return; }
    if (d.payout !== undefined) { if (!isMgr()) { toast(t("noPay"), "err"); return; } const a = requestPayout(S().store); if (a) toast(t("payoutDone")(yen(a)), "ok"); return; }
    if (d.notes !== undefined) { P.notes = true; markRead(S().store); return; }
    if (d.closenotes !== undefined) { P.notes = false; render(); return; }
    if (d.addstaff !== undefined) { const n = root.querySelector("#nsName").value.trim(); if (n) addStaff(S().store, n, root.querySelector("#nsRole").value); return; }
    if (d.plogout !== undefined) { DB.session = null; commit({}); P.step = "home"; go(() => {}); return; }
    if (d.reset !== undefined) { import("./state.js").then(m => m.resetAll()); toast("↺", ""); return; }
  });
}
export const rerenderPortal = () => render();
