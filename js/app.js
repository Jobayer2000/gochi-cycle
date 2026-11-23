// Shell: language, role switch (phone), side-by-side live demo (desktop).
import { mountCustomer, rerenderCustomer } from "./customer.js";
import { mountPortal, rerenderPortal } from "./storeportal.js";
import { mountAdmin, rerenderAdmin } from "./admin.js";

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
    credits: "Photo credits",
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
    credits: "写真クレジット",
  },
};
const st = { get(k, d) { try { return localStorage.getItem("gc_" + k) || d; } catch { return d; } }, set(k, v) { try { localStorage.setItem("gc_" + k, v); } catch {} } };
let lang = st.get("lang", "en"), role = { "#store": "store", "#hq": "admin" }[location.hash] || "customer";

function applyText() {
  document.documentElement.lang = lang === "jp" ? "ja" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el => (el.textContent = T[lang][el.dataset.i18n]));
  document.getElementById("lang").textContent = lang === "jp" ? "English" : "日本語";
}
function applyRole() {
  document.body.dataset.role = role;
  document.querySelectorAll("[data-role]").forEach(b => b.classList.toggle("on", b.dataset.role === role));
}
document.getElementById("lang").onclick = () => { lang = lang === "en" ? "jp" : "en"; st.set("lang", lang); applyText(); rerenderCustomer(); rerenderPortal(); rerenderAdmin(); };
document.querySelectorAll("[data-role]").forEach(b => (b.onclick = () => {
  const run = () => { role = b.dataset.role; history.replaceState(null, "", { store: "#store", admin: "#hq" }[role] || "#"); applyRole(); if (role === "admin") rerenderAdmin(); };
  if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(run); else run();
}));

const context = { lang: () => lang };
mountCustomer(document.getElementById("custApp"), context);
mountPortal(document.getElementById("storeApp"), context);
mountAdmin(document.getElementById("adminApp"), context);
applyText(); applyRole();
