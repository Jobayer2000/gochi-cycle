import { ITEMS, WEATHER, FEATURE_NAMES, FACTORS, makeHistory, trainAll, plan, impact } from "./model.js";
import { mountCustomer, preordersFor, rescuedLines, publishDeals, resetCustomer, rerenderCustomer } from "./customer.js";
import { STORES, storeName } from "./stores.js";

// ---------- text (English / Japanese) ----------
const T = {
  en: {
    tagline: "Waste nothing, cycle everything.", tabStore: "Store", tabCustomer: "Customer", tabImpact: "Impact", tabAI: "How the AI works",
    storeTitle: "Make the right amount", storeLead: "The AI forecasts tomorrow's sales for each item from the day, weather, temperature, local events and pre-orders, then suggests how much to make and when to discount what may be left.",
    tomorrow: "Tomorrow", storeSel: "Store", day: "Day", temp: "Temperature", event: "Local event nearby",
    preTitle: "Group pre-orders", preLead: "Customers and groups order before the store cooks. Pre-orders are certain sales; the AI predicts walk-in demand on top. Try adding 8 bento.", preAdd: "Add pre-order",
    planTitle: "AI production plan", publish: "List expected leftovers in the customer app",
    colItem: "Item", colPre: "Pre-orders", colFc: "AI forecast", colHabit: "Usual plan", colAI: "AI plan", colLeft: "Expected leftovers (usual → AI)", colMd: "Suggested discount",
    kLeft: "Leftovers avoided tomorrow", kLeftSub: "items, compared with the usual plan", kKg: "Food kept out of the bin", kCo2: "CO₂e avoided", kMoney: "Ingredient cost saved",
    publishedMsg: n => `${n} items listed on the customer app ✓`,
    custTitle: "Three chains, one app", custLead: "Customers log in, pre-order from Seven-Eleven, FamilyMart and Lawson nearby, and rescue still-good food at night. Pre-orders flow straight into each store's AI forecast.",
    alert: n => `🔔 ${n} discounted items near you tonight. Pick up before 00:30.`, noDeals: "No deals yet. In the Store tab, press “List expected leftovers”.",
    reserve: "Reserve", left: "left", pickup: "Pick up 21:00–00:30", code: c => `Reserved ✓ Show code ${c} at the counter`,
    impTitle: "Our impact, live", impLead: "Every reservation and every avoided leftover is counted here: food, money and CO₂e.",
    iFood: "Food kept out of the bin", iCust: "Customers saved", iStore: "Store income from leftovers", iCo2: "CO₂e avoided",
    howCalc: "How we calculate", reset: "Reset demo",
    m1: "Prevented food = leftovers avoided by the AI plan (usual plan − AI plan), counted when the store follows the AI plan.",
    m2: "Rescued food = discounted leftovers ordered in the customer app. Weight per item: bento 450 g, rice ball 110 g, sandwich 180 g, salad 200 g.",
    m3: `CO₂e: prevented food × ${FACTORS.co2PerKg} kg CO₂e/kg (food not produced). Rescued food × (${FACTORS.co2PerKg} × 50% displacement − ${FACTORS.opsPerKg} kg for our operations).`,
    m4: "Emission factor 3.19 kg CO₂e per kg food: Blonk & Mérieux NutriSciences (2024), EU food-mix average. A screening estimate, not a full life-cycle assessment.",
    m5: "Money: customers save the discount; the store earns the discounted price on food that would have earned nothing.",
    aiTitle: "How the AI works", aiLead: "A machine-learning model (ridge regression) is trained for each item on 120 days of sales history. It learns how the weekday, weather, temperature, local events and pre-orders change demand.",
    accTitle: "Accuracy on the last 14 days (data the model did not see)", aItem: "Item", aMaeAI: "AI error (items/day)", aMaeHabit: "Usual-method error", aBetter: "AI is better by",
    chartTitle: "Sales history (last 21 days) and tomorrow's forecast", wTitle: "What the model learned", wLead: "Effect of each factor on daily sales (items). Teal raises demand, coral lowers it.",
    disclaimer: "Demo data: the sales history is synthetic (computer-generated) for this prototype. No real store data is used. With a partner store, the same model would be trained on its own records.",
    footer: "Gochi Cycle · HiroshimAI Foodtech Hackathon 2026 · Eikei University of Hiroshima",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], weather: { sunny: "☀ Sunny", cloudy: "☁ Cloudy", rain: "☂ Rain" },
    weightNames: { base: "base", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", cloudy: "cloudy", rain: "rain", temperature: "+1 °C", "local event": "local event" },
    store: ["Store A · 350 m", "Store B · 800 m"],
  },
  jp: {
    tagline: "ムダにしない。すべてを循環させる。", tabStore: "店舗", tabCustomer: "利用者", tabImpact: "インパクト", tabAI: "AIのしくみ",
    storeTitle: "ちょうどいい量をつくる", storeLead: "AIが曜日・天気・気温・地域イベント・予約注文から明日の販売数を商品ごとに予測し、製造数と、売れ残りそうな商品の値引きタイミングを提案します。",
    tomorrow: "明日の条件", storeSel: "店舗", day: "曜日", temp: "気温", event: "近くで地域イベントあり",
    preTitle: "グループ予約注文", preLead: "調理前に利用者やグループが注文します。予約は確定した販売、AIはそれに加えて来店客の需要を予測します。お弁当を8個追加してみてください。", preAdd: "予約を追加",
    planTitle: "AI製造プラン", publish: "売れ残り予定を近くの利用者に掲載",
    colItem: "商品", colPre: "予約", colFc: "AI予測", colHabit: "いつもの量", colAI: "AIの提案", colLeft: "売れ残り予定（いつも→AI）", colMd: "値引き提案",
    kLeft: "明日の売れ残り削減", kLeftSub: "個（いつもの量と比べて）", kKg: "廃棄を防いだ食品", kCo2: "CO₂e削減", kMoney: "仕入れコスト削減",
    publishedMsg: n => `${n}個を利用者アプリに掲載しました ✓`,
    custTitle: "大手3社を、ひとつのアプリで", custLead: "ログインして、近くのセブン-イレブン・ファミリーマート・ローソンに予約注文。夜はまだおいしい食品を救えます。予約は各店舗のAI予測にそのまま反映されます。",
    alert: n => `🔔 今夜、近くで${n}個のお得な食品があります。00:30までに受け取り。`, noDeals: "まだ掲載がありません。「店舗」タブで「売れ残り予定を掲載」を押してください。",
    reserve: "予約する", left: "残り", pickup: "受取 21:00〜00:30", code: c => `予約完了 ✓ レジでコード ${c} を提示`,
    impTitle: "リアルタイムのインパクト", impLead: "予約と、AIで防いだ売れ残りをここで集計します：食品・お金・CO₂e。",
    iFood: "廃棄を防いだ食品", iCust: "利用者の節約額", iStore: "店舗の売上（廃棄予定品）", iCo2: "CO₂e削減",
    howCalc: "計算方法", reset: "デモをリセット",
    m1: "防いだ食品＝AIプランで減った売れ残り（いつもの量−AIの提案）。店舗がAIプランを採用した場合に計上。",
    m2: "救った食品＝利用者アプリで注文された値引き品。重量：弁当450g、おにぎり110g、サンド180g、サラダ200g。",
    m3: `CO₂e：防いだ食品×${FACTORS.co2PerKg} kg CO₂e/kg（生産されなかった分）。救った食品×（${FACTORS.co2PerKg}×代替率50%−運営分${FACTORS.opsPerKg}kg）。`,
    m4: "排出係数 3.19 kg CO₂e/kg：Blonk & Mérieux NutriSciences（2024）、EUの食品構成の平均値。概算であり、完全なライフサイクル評価ではありません。",
    m5: "お金：利用者は値引き分を節約し、店舗は本来ゼロだった食品から値引き価格の売上を得ます。",
    aiTitle: "AIのしくみ", aiLead: "機械学習モデル（リッジ回帰）を商品ごとに120日分の販売履歴で学習。曜日・天気・気温・地域イベント・予約注文が需要をどう変えるかを学びます。",
    accTitle: "直近14日間の精度（学習に使っていないデータ）", aItem: "商品", aMaeAI: "AIの誤差（個/日）", aMaeHabit: "いつもの方法の誤差", aBetter: "AIの改善",
    chartTitle: "販売履歴（直近21日）と明日の予測", wTitle: "モデルが学んだこと", wLead: "各要因が1日の販売数に与える影響（個）。緑は需要増、オレンジは需要減。",
    disclaimer: "デモデータ：販売履歴はこの試作用に作成した架空のデータです。実際の店舗データは使用していません。協力店舗があれば、同じモデルをその店舗の記録で学習します。",
    footer: "Gochi Cycle · 広島AIフードテックハッカソン2026 · 叡啓大学",
    days: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"], weather: { sunny: "☀ 晴れ", cloudy: "☁ くもり", rain: "☂ 雨" },
    weightNames: { base: "基本", Mon: "月曜", Tue: "火曜", Wed: "水曜", Thu: "木曜", Fri: "金曜", Sat: "土曜", cloudy: "くもり", rain: "雨", temperature: "気温+1℃", "local event": "地域イベント" },
    store: ["店舗A · 350m", "店舗B · 800m"],
  },
};

// ---------- state ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem("gochi_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("gochi_" + k, JSON.stringify(v)); } catch {} },
};
const S = {
  lang: store.get("lang", "en"), tab: location.hash.slice(1) || "customer", storeId: "s1",
  ctx: { wd: 5, weather: "rain", temp: 14, event: 0, preorders: {} },
  deals: store.get("deals", []), rescued: store.get("rescued", []), prevented: store.get("prevented", []),
  chartItem: "bento",
};
const history = makeHistory();
const models = trainAll(history);
const t = k => T[S.lang][k];
const name = it => (S.lang === "jp" ? it.jp : it.en);
const yen = n => "¥" + Math.round(n).toLocaleString();
const $ = s => document.querySelector(s);
const save = () => { store.set("prevented", S.prevented); store.set("lang", S.lang); };
function effCtx() { const app = preordersFor(S.storeId), m = { ...S.ctx.preorders }; for (const k in app) m[k] = (m[k] || 0) + app[k]; return { ...S.ctx, preorders: m }; }

// ---------- render ----------
function renderStatic() {
  document.documentElement.lang = S.lang === "jp" ? "ja" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el => { const v = t(el.dataset.i18n); if (typeof v === "string") el.textContent = v; });
  $("#lang").textContent = S.lang === "jp" ? "English" : "日本語";
  $("#wd").innerHTML = t("days").map((d, i) => `<option value="${i}" ${i === S.ctx.wd ? "selected" : ""}>${d}</option>`).join("");
  $("#weather").innerHTML = WEATHER.map(w => `<button data-w="${w}" class="${w === S.ctx.weather ? "on" : ""}">${t("weather")[w]}</button>`).join("");
  const opts = ITEMS.map(it => `<option value="${it.id}">${name(it)}</option>`).join("");
  $("#preItem").innerHTML = opts; $("#chartItem").innerHTML = opts; $("#chartItem").value = S.chartItem;
  $("#storeSel").innerHTML = STORES.map(s => `<option value="${s.id}" ${s.id === S.storeId ? "selected" : ""}>${storeName(s, S.lang)}</option>`).join("");
  $("#temp").value = S.ctx.temp; $("#event").checked = !!S.ctx.event;
}

function renderStore() {
  $("#tempOut").textContent = S.ctx.temp + " °C";
  const rows = plan(models, effCtx());
  S.rows = rows;
  const pre = Object.entries(effCtx().preorders).filter(([, q]) => q > 0);
  $("#preList").innerHTML = pre.map(([id, q]) => `<li>${name(ITEMS.find(i => i.id === id))} × ${q}</li>`).join("");
  $("#planTable").innerHTML = `<tr><th>${t("colItem")}</th><th class="num">${t("colPre")}</th><th class="num">${t("colFc")}</th><th class="num">${t("colHabit")}</th><th class="num">${t("colAI")}</th><th>${t("colLeft")}</th><th>${t("colMd")}</th></tr>` +
    rows.map(r => `<tr><td>${name(r)}</td><td class="num">${r.pre || "–"}</td><td class="num">${r.forecast.toFixed(1)}</td><td class="num">${r.habit}</td><td class="num ai">${r.aiMake}</td>
      <td><span class="pill warn">${r.leftoverHabit}</span> → <span class="pill good">${r.leftoverAI}</span></td>
      <td>${r.leftoverAI > 0 ? `${r.markdownAt} · −${r.discount}%` : "–"}</td></tr>`).join("");
  const avoided = rows.reduce((s, r) => s + Math.max(0, r.leftoverHabit - r.leftoverAI), 0);
  const kg = rows.reduce((s, r) => s + Math.max(0, r.leftoverHabit - r.leftoverAI) * r.kg, 0);
  const cost = rows.reduce((s, r) => s + Math.max(0, r.habit - r.aiMake) * r.price * 0.6, 0); // approx. 60% of price = cost of goods (assumption)
  $("#storeKpis").innerHTML = kpi(t("kLeft"), avoided, t("kLeftSub")) + kpi(t("kKg"), kg.toFixed(1) + " kg", "", "light") +
    kpi(t("kCo2"), (kg * FACTORS.co2PerKg).toFixed(1) + " kg", "", "light") + kpi(t("kMoney"), yen(cost), "≈ 60% of price", "light");
}
const kpi = (lab, val, sub = "", cls = "") => `<div class="kpi ${cls}"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`;

function renderCustomer() { rerenderCustomer(); }

function renderImpact() {
  const r = impact(S.prevented, rescuedLines());
  const items = [...S.prevented, ...rescuedLines()].reduce((s, x) => s + x.qty, 0);
  $("#impKpis").innerHTML = kpi(t("iFood"), (r.kgPrevented + r.kgRescued).toFixed(1) + " kg", `${items} items`) +
    kpi(t("iCust"), yen(r.customerSaving), "", "light") + kpi(t("iStore"), yen(r.storeIncome), "", "light") +
    kpi(t("iCo2"), r.co2.toFixed(1) + " kg", "", "light coral");
  $("#method").innerHTML = ["m1", "m2", "m3", "m4", "m5"].map(k => `<li>${t(k)}</li>`).join("");
}

function renderAI() {
  $("#accTable").innerHTML = `<tr><th>${t("aItem")}</th><th class="num">${t("aMaeAI")}</th><th class="num">${t("aMaeHabit")}</th><th class="num">${t("aBetter")}</th></tr>` +
    ITEMS.map(it => { const m = models[it.id]; const b = (1 - m.maeAI / m.maeHabit) * 100;
      return `<tr><td>${name(it)}</td><td class="num ai">${m.maeAI.toFixed(1)}</td><td class="num">${m.maeHabit.toFixed(1)}</td><td class="num"><span class="pill ${b > 0 ? "good" : "warn"}">${b.toFixed(0)}%</span></td></tr>`; }).join("");
  const m = models[S.chartItem], last = m.rows.slice(-21);
  const fc = plan(models, effCtx()).find(r => r.id === S.chartItem).forecast;
  const max = Math.max(fc, ...last.map(r => r.sold)) * 1.1;
  $("#chart").innerHTML = `<div class="bars">${last.map(r => `<div style="height:${(r.sold / max) * 100}%" title="${r.sold}"><span>${r.date.getDate()}</span></div>`).join("")}<div class="fc" style="height:${(fc / max) * 100}%" title="${fc.toFixed(1)}"><span>★</span></div></div>`;
  const w = m.w, top = Math.max(...w.slice(1).map(Math.abs));
  $("#weights").innerHTML = w.map((v, i) => i === 0 ? "" : `<div class="wrow"><span>${t("weightNames")[FEATURE_NAMES[i]]}</span><div class="wbar ${v < 0 ? "neg" : ""}" style="width:${(Math.abs(v) / top) * 100}%"></div><span>${v > 0 ? "+" : ""}${v.toFixed(1)}</span></div>`).join("");
}

function render() {
  document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === S.tab));
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("on", s.id === S.tab));
  renderStore(); renderCustomer(); renderImpact(); renderAI();
}

// ---------- events ----------
document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]"); if (tab) { S.tab = tab.dataset.tab; location.hash = S.tab; render(); return; }
  const w = e.target.closest("[data-w]"); if (w) { S.ctx.weather = w.dataset.w; renderStatic(); render(); return; }
});
$("#lang").onclick = () => { S.lang = S.lang === "en" ? "jp" : "en"; save(); renderStatic(); render(); };
$("#wd").onchange = e => { S.ctx.wd = +e.target.value; render(); };
$("#temp").oninput = e => { S.ctx.temp = +e.target.value; render(); };
$("#event").onchange = e => { S.ctx.event = e.target.checked ? 1 : 0; render(); };
$("#chartItem").onchange = e => { S.chartItem = e.target.value; renderAI(); };
$("#preAdd").onclick = () => {
  const id = $("#preItem").value, q = Math.max(1, Math.min(50, +$("#preQty").value || 1));
  S.ctx.preorders[id] = (S.ctx.preorders[id] || 0) + q; render();
};
$("#publish").onclick = () => {
  const rows = S.rows || plan(models, effCtx());
  const list = rows.filter(r => r.leftoverAI > 0).map(r => ({ id: r.id, qty: r.leftoverAI, discount: r.discount }));
  publishDeals(S.storeId, list);
  S.prevented = rows.filter(r => r.leftoverHabit > r.leftoverAI).map(r => ({ id: r.id, qty: r.leftoverHabit - r.leftoverAI, kg: r.kg, price: r.price }));
  save(); $("#published").textContent = t("publishedMsg")(list.reduce((s, d) => s + d.qty, 0)); render();
};
$("#reset").onclick = () => { resetCustomer(); S.prevented = []; S.ctx.preorders = {}; save(); $("#published").textContent = ""; render(); };
window.addEventListener("hashchange", () => { S.tab = location.hash.slice(1) || "customer"; render(); });
$("#storeSel").onchange = e => { S.storeId = e.target.value; render(); };

mountCustomer($("#custApp"), { lang: () => S.lang, onChange: () => { renderStore(); renderImpact(); } });
renderStatic(); render();
