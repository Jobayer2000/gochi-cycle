// Shell: language, role switch (phone), side-by-side live demo (desktop).
import { mountCustomer, rerenderCustomer } from "./customer.js";
import { mountPortal, rerenderPortal } from "./storeportal.js";
import { mountAdmin, rerenderAdmin } from "./admin.js";
import { DB, subscribe, commit, placeOrder, setStatus, listingsFor } from "./state.js";

const T = {
  en: {
    tagline: "Waste nothing, cycle everything.", roleCustomer: "Customer", roleStore: "Store", roleAdmin: "Gochi HQ",
    capCustomer: "Customer app", capStore: "Store portal",
    storyTitle: "Three chains, one app. AI that makes the right amount.",
    s1: "Customers pre-order from Seven-Eleven, FamilyMart and Lawson nearby.",
    s2: "Each store's AI forecast adds those pre-orders and suggests how much to make.",
    s3: "Expected leftovers are listed with an AI-suggested discount; customers rescue them tonight.",
    s4: "Staff hand over with a pickup code; sales land in the store wallet. Food, money and CO₂e are counted.",
    disclaimer: "Prototype for the HiroshimAI Foodtech Hackathon 2026. Demo stores and synthetic data: no partnership with any chain, no real payments.",
    credits: "Photo credits", guide: "Try the cycle", guideLead: "Six steps, about 2 minutes. Each step ticks itself off.",
    g: ["Store: sign in (any 4-digit PIN) and open tomorrow's AI plan", "Store: check the forecast, edit if you like, confirm the safety check and list leftovers",
        "Customer: open the store, tap Tonight's deals and reserve one", "Store: Orders → Accept, then Mark ready", "Store: Mark picked up (the customer shows the code)",
        "Customer: Profile shows confirmed impact; store Reports and HQ update too"], done: "Cycle complete: prevention → rescue → impact", close: "Close",
  },
  jp: {
    tagline: "ムダにしない。すべてを循環させる。", roleCustomer: "利用者", roleStore: "店舗", roleAdmin: "本部",
    capCustomer: "利用者アプリ", capStore: "店舗ポータル",
    storyTitle: "大手3社を、ひとつのアプリで。AIで、ちょうどいい量を。",
    s1: "利用者は近くのセブン-イレブン・ファミリーマート・ローソンに予約注文。",
    s2: "各店舗のAI予測がその予約を加え、製造数を提案します。",
    s3: "売れ残り予定はAIおすすめの値引きで出品。利用者が今夜、救います。",
    s4: "受取コードで受け渡し、売上は店舗のウォレットへ。食品・お金・CO₂eを集計します。",
    disclaimer: "広島AIフードテックハッカソン2026の試作品です。デモ店舗・架空データ：どのチェーンとも提携しておらず、実際の決済はありません。",
    credits: "写真クレジット", guide: "サイクルを試す", guideLead: "6ステップ・約2分。終わったステップには自動でチェックが付きます。",
    g: ["店舗：ログイン（4桁なら何でも）して明日のAIプランを開く", "店舗：予測を確認し、必要なら変更。安全確認にチェックして売れ残り予定を出品",
        "利用者：店舗を開き「今夜のお得」から1つ予約", "店舗：注文 → 受付 → 準備完了", "店舗：受け渡し完了（お客様がコードを提示）",
        "利用者：マイページに確定インパクト。店舗レポートと本部も更新"], done: "サイクル完了：予防 → 救出 → インパクト", close: "閉じる",
  },
};
const st = { get(k, d) { try { return localStorage.getItem("gc_" + k) || d; } catch { return d; } }, set(k, v) { try { localStorage.setItem("gc_" + k, v); } catch {} } };
let lang = st.get("lang", "jp"), role = { "#store": "store", "#hq": "admin" }[location.hash] || "customer";

function applyText() {
  document.documentElement.lang = lang === "jp" ? "ja" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el => (el.textContent = T[lang][el.dataset.i18n]));
  document.getElementById("lang").textContent = lang === "jp" ? "English" : "日本語";
}
function applyRole() {
  document.body.dataset.role = role;
  document.querySelectorAll("[data-role]").forEach(b => b.classList.toggle("on", b.dataset.role === role));
}
document.getElementById("lang").onclick = () => { lang = lang === "en" ? "jp" : "en"; st.set("lang", lang); applyText(); rerenderCustomer(); rerenderPortal(); rerenderAdmin(); renderGuide(); };
document.querySelectorAll("[data-role]").forEach(b => (b.onclick = () => {
  const run = () => { role = b.dataset.role; history.replaceState(null, "", { store: "#store", admin: "#hq" }[role] || "#"); applyRole(); if (role === "admin") rerenderAdmin(); };
  if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(run); else run();
}));

function steps() {
  const o = DB.orders || [];
  return [!!DB.session, (DB.listings || []).some(l => !String(l.id).includes("seed")), o.some(x => x.kind === "deal"),
    o.some(x => x.status >= 2), o.some(x => x.status === 3), o.some(x => x.status === 3)];
}
function renderGuide() {
  const g = document.getElementById("guide"); if (!g) return;
  const s = steps(), n = s.filter(Boolean).length;
  document.getElementById("guideBtn").innerHTML = `<span class="gl">${T[lang].guide}</span> <b>${n}/6</b>`; document.getElementById("guideBtn").setAttribute("aria-label", T[lang].guide);
  g.innerHTML = `<div class="ghead"><b>${T[lang].guide}</b><button class="gx" data-gclose aria-label="${T[lang].close}">×</button></div><p>${T[lang].guideLead}</p>
    <ol>${T[lang].g.map((x, i) => `<li class="${s[i] ? "ok" : ""}"><span>${s[i] ? "✓" : i + 1}</span>${x}</li>`).join("")}</ol>${n === 6 ? `<p class="gdone">${T[lang].done}</p>` : ""}`;
}
document.addEventListener("click", e => {
  if (e.target.closest("#guideBtn")) { document.getElementById("guide").classList.toggle("on"); renderGuide(); }
  if (e.target.closest("[data-gclose]")) document.getElementById("guide").classList.remove("on");
});
subscribe(() => renderGuide());
const Q = new URLSearchParams(location.search);
if (Q.has("demo")) {
  DB.user ||= { name: "Demo", email: "demo@gochi.demo" };
  DB.session ||= { store: "s1", staff: "m", role: "manager", name: "Tanaka" };
  if (!DB.orders.length) {
    const l = listingsFor("s1")[0];
    if (l) { const o = placeOrder({ store: "s1", kind: "deal", lines: [{ item: l.item, qty: 1, price: Math.round(l.price * (1 - l.discount / 100)), full: l.price, discount: l.discount, listing: l.id }], day: "today", slot: "pm" }); setStatus(o.id, 3); }
  }
  if (Q.has("hq")) DB.admin = true;
  commit({});
  try { localStorage.setItem("gc_guideSeen", "1"); } catch {}
}
const context = { lang: () => lang, q: Q };
mountCustomer(document.getElementById("custApp"), context);
mountPortal(document.getElementById("storeApp"), context);
mountAdmin(document.getElementById("adminApp"), context);
applyText(); applyRole(); renderGuide();
try { if (!localStorage.getItem("gc_guideSeen")) { document.getElementById("guide").classList.add("on"); localStorage.setItem("gc_guideSeen", "1"); } } catch {}
