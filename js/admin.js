// Gochi HQ (our side): platform income, commission, store payouts, growth scenarios.
import { STORES, CHAINS, storeById, storeLabel } from "./stores.js";
import { DB, commit, subscribe, platformStats, FEE, PROCESSING, hash, methodHTML } from "./state.js";
import { countAll, resetCounts, toast } from "./ui.js";

const T = {
  en: {
    hq: "Gochi HQ", lead: "Our side: how the platform earns, pays stores and grows.", email: "Admin email", pw: "Password", enter: "Sign in", wrong: "Email or password is wrong.",
    live: "Live from this demo", gmv: "Sales through Gochi (GMV)", commission: f => `Our commission (${f}%)`, processing: f => `Payment processing (${f}%)`, net: "Our net income",
    pending: "Owed to stores", paid: "Paid out to stores", orders: "Orders", customers: "Customers", active: "Active stores", food: "Food rescued", co2: "CO₂e avoided", accounts: "Store accounts",
    howTitle: "How Gochi Cycle earns", how: [
      ["8% commission", "only on completed sales (picked up). Stores pay nothing to join, so there's no risk for them."],
      ["Customers pay the store's price", "no extra fee for customers. They save on leftovers and skip the queue on pre-orders."],
      ["We pay the costs", "payment processing (~3%), store support and the platform. Stores get their money minus 8%."],
      ["Later: Gochi Pro (idea)", "an optional subscription for advanced AI forecasting and reports. Not decided; to test with stores."],
    ],
    flowTitle: "Where ¥1,000 of sales goes", flow: ["Store receives", "Gochi commission", "of which payment cost"],
    storesTitle: "Stores", colStore: "Store", colOrders: "Orders", colGmv: "Sales", colFee: "Our fee", colBal: "Owed",
    scenTitle: "Growth scenarios (team model, per year)", scenNote: "Basis: 10 offers per store per day × 250 g = 2.5 kg, about 29% of the 8.6 kg of unsold food per store per day that Lawson reports (FY2025): a deliberately partial share. 20% and 30% sell-through are test scenarios, not data. “Result” = our 8% fee − 3% payment cost − ¥12,000 support per store − ¥3m fixed costs; development, marketing and tax are excluded. Scenarios, not forecasts.", liveNote: "Live figures from this demo: our net income here = commission − payment cost only (support and fixed costs are in the scenarios below). Impact counts picked-up orders only.", howCount: "How impact is counted",
    scen: [["Hiroshima, 20% of offers sell", "revenue ¥20.4m", "result −¥4.2m"], ["Hiroshima, 30% of offers sell", "revenue ¥30.5m", "result +¥2.1m"],
      ["Break-even at 30%", "≈ 680 active stores", "covers ¥3m fixed"], ["Japan (53,134 stores), 30%", "revenue ≈ ¥1.40bn", "commission only"]],
    logout: "Log out", demo: "Demo data in this browser only. No real money moves.",
  },
  jp: {
    hq: "Gochi本部", lead: "私たちの側：プラットフォームの収益、店舗への支払い、成長。", email: "管理者メール", pw: "パスワード", enter: "ログイン", wrong: "メールアドレスまたはパスワードが違います。",
    live: "このデモのリアルタイム集計", gmv: "Gochi経由の売上（流通総額）", commission: f => `手数料収入（${f}%）`, processing: f => `決済コスト（${f}%）`, net: "純収入",
    pending: "店舗への未払い", paid: "店舗へ支払済み", orders: "注文", customers: "利用者", active: "稼働店舗", food: "救った食品", co2: "CO₂e削減", accounts: "店舗アカウント",
    howTitle: "Gochi Cycleの収益モデル", how: [
      ["手数料8%", "受け渡しが完了した売上にのみ。店舗の初期費用ゼロでリスクなし。"],
      ["利用者は店舗の価格のみ", "利用者の追加手数料なし。値引き品で節約、予約で待ち時間ゼロ。"],
      ["コストはGochiが負担", "決済手数料（約3%）、店舗サポート、システム運営。店舗には売上から8%を引いて支払い。"],
      ["将来：Gochi Pro（案）", "高度なAI予測とレポートの任意サブスク。未決定、店舗と検証予定。"],
    ],
    flowTitle: "売上¥1,000の内訳", flow: ["店舗の受取", "Gochiの手数料", "うち決済コスト"],
    storesTitle: "店舗", colStore: "店舗", colOrders: "注文", colGmv: "売上", colFee: "手数料", colBal: "未払い",
    scenTitle: "成長シナリオ（チームのモデル・年間）", scenNote: "根拠：1店舗1日10品 × 250g = 2.5kg。ローソンが公表する1店舗1日あたりの売れ残り食品8.6kg（2025年度）の約29%で、意図的に一部だけを想定。販売率20%・30%は検証用のシナリオでデータではありません。「収支」＝手数料8% − 決済3% − サポート1店¥12,000 − 固定費¥300万。開発・広告・税は含みません。予測ではなくシナリオです。", liveNote: "このデモの実数：ここでの純収入＝手数料 − 決済コストのみ（サポート費・固定費は下のシナリオに含む）。インパクトは受け取り済みの注文のみ。", howCount: "インパクトの数え方",
    scen: [["広島・オファーの20%が販売", "収入 ¥2,040万", "収支 −¥420万"], ["広島・オファーの30%が販売", "収入 ¥3,050万", "収支 +¥210万"],
      ["30%での損益分岐", "約680店舗", "固定費¥300万をカバー"], ["全国（53,134店）・30%", "収入 約¥14億", "手数料のみ"]],
    logout: "ログアウト", demo: "デモデータ（このブラウザ内のみ）。実際のお金は動きません。",
  },
};
let ctx, root, pinTry = "";
const L = () => ctx.lang(), t = k => T[L()][k], yen = n => "¥" + Math.round(n).toLocaleString();

function render() {
  if (!root) return;
  if (!DB.admin) {
    root.innerHTML = `<div class="app admin"><div class="scr"><div class="plogin">
      <svg class="biglogo" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 27a22 22 0 0 1 44 0" fill="none" stroke="var(--soft)" stroke-width="8" stroke-linecap="round"/><path d="M54 37a22 22 0 0 1-44 0" fill="none" stroke="var(--coral)" stroke-width="8" stroke-linecap="round"/></svg>
      <h2>${t("hq")}</h2><p class="muted">${t("lead")}</p>
      <form class="authf" onsubmit="return false"><label class="fld"><span>${t("email")}</span><input id="aEmail" type="email" autocomplete="username" inputmode="email" value="hq@gochi.demo"></label>
      <label class="fld"><span>${t("pw")}</span><input id="aPw" type="password" autocomplete="current-password" value="admin1234"></label>
      <button class="cbtn primary" data-aenter>${t("enter")}</button></form><p class="fine">Demo login is filled in: just tap Sign in. (hq@gochi.demo · admin1234)</p></div></div></div>`;
    return;
  }
  const p = platformStats();
  const k = (lab, val, opts = "") => `<div class="kc"><small>${lab}</small><b data-count="${val}" ${opts}>0</b></div>`;
  root.innerHTML = `<div class="app admin"><div class="scr wide">
    <header class="ahead"><div><small>${t("live")}</small><h2>${t("hq")}</h2></div><button class="cbtn ghost sm" data-alogout>${t("logout")}</button></header>
    <section class="kgrid hero">${k(t("gmv"), p.gmv, 'data-pre="¥"')}${k(t("commission")(FEE * 100), p.commission, 'data-pre="¥"')}${k(t("processing")(PROCESSING * 100), p.processing, 'data-pre="¥"')}${k(t("net"), p.net, 'data-pre="¥"')}</section>
    <p class="muted sm">${t("liveNote")}</p><section class="kgrid">${k(t("pending"), p.pending, 'data-pre="¥"')}${k(t("paid"), p.paid, 'data-pre="¥"')}${k(t("orders"), p.orders)}${k(t("customers"), p.customers)}
      ${k(t("active"), p.activeStores)}${k(t("accounts"), p.accounts)}${k(t("food"), p.im.kg, 'data-dec="2" data-suf=" kg"')}${k(t("co2"), p.im.co2, 'data-dec="2" data-suf=" kg"')}</section>
    <div class="acols">
      <section class="card"><b>${t("howTitle")}</b>${t("how").map(([h, d], i) => `<div class="howrow" style="--i:${i}"><span class="num">${i + 1}</span><div><b>${h}</b><small>${d}</small></div></div>`).join("")}
        <small class="lbl">${t("flowTitle")}</small>
        <div class="split"><span style="flex:${100 - FEE * 100}" class="a"><em>${t("flow")[0]}</em>¥920</span><span style="flex:${FEE * 100}" class="b"><em>${t("flow")[1]}</em>¥80</span></div>
        <small class="muted">${t("flow")[2]}: ≈¥30 → ${L() === "jp" ? "Gochiの純収入" : "our net"} ≈¥50</small></section>
      <section class="card"><b>${t("scenTitle")}</b><div class="scen">${t("scen").map(([a, b, c], i) => `<div style="--i:${i}"><small>${a}</small><b>${b}</b><em class="${c.includes("−") ? "neg" : ""}">${c}</em></div>`).join("")}</div>
        <small class="muted">${t("scenNote")}</small>${methodHTML(L(), t("howCount"))}</section>
    </div>
    <section class="card"><b>${t("storesTitle")}</b><div class="tablewrap"><table class="atable"><tr><th>${t("colStore")}</th><th>${t("colOrders")}</th><th>${t("colGmv")}</th><th>${t("colFee")}</th><th>${t("colBal")}</th></tr>
      ${p.stores.map(s => `<tr><td>${storeLabel(storeById(s.id), L())}</td><td>${s.orders}</td><td>${yen(s.gmv)}</td><td>${yen(s.fee)}</td><td>${yen(s.balance)}</td></tr>`).join("")}</table></div></section>
    <p class="fine">${t("demo")}</p></div></div>`;
  countAll(root, "a:");
}

export function mountAdmin(el, context) {
  ctx = context; root = el; render();
  subscribe(() => render());
  root.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.aenter !== undefined) {
      const em = (root.querySelector("#aEmail").value || "").trim().toLowerCase();
      hash(root.querySelector("#aPw").value || "").then(h => { if (em === "hq@gochi.demo" && h === "ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270") { DB.admin = true; resetCounts("a:"); commit({}); } else toast(t("wrong"), "err"); });
    }
    if (b.dataset.alogout !== undefined) { DB.admin = false; commit({}); }
  });
}
export const rerenderAdmin = () => { resetCounts("a:"); render(); };
