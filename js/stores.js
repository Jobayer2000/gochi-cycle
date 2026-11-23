// Demo stores of the three big chains around central Hiroshima.
// Illustrative only: no partnership exists. Chain names are shown in each chain's colour (no logos).
import { ITEMS } from "./model.js";

export const CHAINS = {
  seven:  { en: "Seven-Eleven", jp: "セブン-イレブン", short: "7", delta: 0,   color: "#E25A00" },
  family: { en: "FamilyMart",   jp: "ファミリーマート", short: "F", delta: -10, color: "#00873D" },
  lawson: { en: "Lawson",       jp: "ローソン",         short: "L", delta: 10,  color: "#1F5FA8" },
};

// x/y = position on the stylised map (percent)
export const STORES = [
  { id: "s1", chain: "seven",  en: "Noboricho",         jp: "幟町",     km: 0.2, x: 52, y: 44 },
  { id: "f1", chain: "family", en: "Hatchobori",        jp: "八丁堀",   km: 0.4, x: 40, y: 38 },
  { id: "l1", chain: "lawson", en: "Hiroshima Station", jp: "広島駅前", km: 0.9, x: 72, y: 22 },
  { id: "s2", chain: "seven",  en: "Kamiyacho",         jp: "紙屋町",   km: 1.1, x: 24, y: 46 },
  { id: "l2", chain: "lawson", en: "Hondori",           jp: "本通",     km: 0.8, x: 33, y: 58 },
  { id: "f2", chain: "family", en: "Danbara",           jp: "段原",     km: 1.6, x: 78, y: 64 },
  { id: "s3", chain: "seven",  en: "Hijiyama",          jp: "比治山",   km: 1.4, x: 66, y: 74 },
  { id: "f3", chain: "family", en: "Yokogawa",          jp: "横川",     km: 2.3, x: 18, y: 14 },
  { id: "l3", chain: "lawson", en: "Ujina",             jp: "宇品",     km: 3.1, x: 50, y: 92 },
];

export const SLOTS = [
  { id: "am",   label: "07:30–08:00", cutoff: "05:30" },
  { id: "noon", label: "12:00–12:30", cutoff: "10:30" },
  { id: "pm",   label: "18:00–18:30", cutoff: "16:00" },
];

export const PHOTO = id => `assets/food/${id}.jpg`;
export const chainOf = s => CHAINS[s.chain];
export const storeById = id => STORES.find(s => s.id === id);
export const chainName = (s, lang) => (lang === "jp" ? chainOf(s).jp : chainOf(s).en);
export const areaName = (s, lang) => (lang === "jp" ? s.jp : s.en);
export const storeName = (s, lang) => `${chainName(s, lang)} · ${areaName(s, lang)}`;
// coloured chain name + area, as HTML
export const storeLabel = (s, lang) => `<span class="cn" style="color:${chainOf(s).color}">${chainName(s, lang)}</span> <span class="ar">${areaName(s, lang)}</span>`;
export const menuFor = s => ITEMS.map(it => ({ ...it, price: it.price + chainOf(s).delta }));
