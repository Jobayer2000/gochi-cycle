# Gochi Cycle: waste nothing, cycle everything

**An AI app that helps convenience stores make the right amount of food, and shares what is left with people nearby before it is wasted.**
コンビニが「ちょうどいい量」を作り、残った食品を近くの人へ届けるAIアプリ。

HiroshimAI Foodtech Hackathon 2026 · Team: Jobayer · Tawhid · Aya (Eikei University of Hiroshima, Faculty of Social System Design)

> **Live demo:** https://jobayer2000.github.io/gochi-cycle/ · **Code:** https://github.com/Jobayer2000/gochi-cycle

---


## New in this version
- **Accounts:** customers can sign up, sign in, sign out or try as a guest. Stores can register, sign in with email and PIN, or use a quick staff PIN. Demo accounts are stored only in your browser, with passwords hashed. Please don't use real passwords.
- **Store portal:** tomorrow's AI plan (customer pre-orders included), listings with an **AI discount suggestion**, live **"sold" notifications**, an orders board (accept, ready, picked up), a **wallet** (sales, 8% fee, balance, payout request), reports (count-up numbers, a 7-day chart, AI accuracy), and staff roles (manager or staff; staff can discount up to 30%).
- **Gochi HQ (our side):** live sales (GMV), our commission, payment costs, net income, money owed and paid to stores, customers, impact, how we earn, and growth scenarios from the team model. Demo PIN: 0000.
- **Live demo:** on a laptop, the customer phone and the store portal sit side by side, so an order placed on one appears on the other at once. On a phone, switch roles at the top.
- **Real food photos** (Wikimedia Commons, see [credits](credits.html)), chain names in each chain's colour (no logos), hover colours everywhere, and motion that respects reduced-motion settings.

Demo PINs: store staff **1111** (manager) and **2222** (staff); Gochi HQ **0000**.

## What it does

| Screen | What you see |
|---|---|
| **Customer app** | Phone-style app. **Log in** (demo, no password), then see **9 nearby stores from all three big chains: Seven-Eleven, FamilyMart and Lawson** on a map and in a list. Filter by chain or search. Each store has a **pre-order menu** with pickup slots (07:30 / 12:00 / 18:00, today or tomorrow) and **tonight's leftover deals**. Add to the **cart**, choose a pickup time, and **place the order**. Orders show a pickup code and a live status (placed → accepted → preparing → ready). The profile shows your own impact. |
| **Store** | Pick a store, then set tomorrow's day, weather, temperature and local events. The **AI forecasts sales for each item**, and **customer pre-orders from the app are added automatically**. It compares the usual plan with the AI plan, suggests discounts for expected leftovers, and lists them in the customer app with one click. |
| **Impact** | Live totals: food kept out of the bin, customers' savings, store income from leftovers, and CO₂e avoided, with the method shown. |
| **How the AI works** | Model accuracy on unseen days (AI vs the usual method), sales history with tomorrow's forecast, and what the model learned (the effect of each factor). |

**Three chains, one platform:** customers don't need three apps. Stores of different chains appear side by side.
> Demo stores: no partnership with any chain exists. Store locations, menus and stock are illustrative, and logins and orders are saved only in your browser.

English / 日本語 switch in the top right.

## How the AI works

- **Model:** ridge regression (machine learning), one model per item, trained in the browser on 120 days of sales history.
- **Inputs:** weekday, weather (sunny, cloudy or rain), temperature, local event. **Pre-orders** are certain sales: the AI predicts **walk-in demand** and adds pre-orders on top.
- **Test:** trained on the first 106 days, tested on the last 14 days, which it never saw. It's compared with the usual method (same weekday last week + 15%).
- **Decisions:** AI plan = pre-orders + walk-in forecast + a small safety buffer. Expected leftovers get a discount suggestion (20–40%, at 21:00). **The AI suggests; store staff decide.**
- **No external AI service, no API key, no server:** everything runs in the browser.

## Impact method

- **CO₂e factor:** 3.19 kg CO₂e per kg of food (Blonk & Mérieux NutriSciences, 2024; EU food-mix average). This is a screening estimate, not a full life-cycle assessment.
- **Prevented food** (not made): × 3.19.
- **Rescued food:** × (3.19 × 50% displacement − 0.10 kg for operations).
- **Money:** customers save the discount, and stores earn the discounted price on food that would have earned nothing.

## ⚠ Demo data

The sales history is **synthetic (computer-generated)** for this prototype. **No real store data is used.** With a partner store, the same model would be trained on its own records.

---

## Run it on your PC

It's a static site: just serve the folder.

```bash
python -m http.server 8765
```

Then open http://localhost:8765. Opening `index.html` directly doesn't work, because browsers block JavaScript modules from `file://`.

## Put it on GitHub with a live demo (GitHub Pages)

1. Create a **new public repository** on github.com, e.g. `gochi-cycle`. Don't add a README.
2. In this folder:
   ```bash
   git remote add origin https://github.com/<your-github-name>/gochi-cycle.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. After about 1 minute, your live demo is at `https://<your-github-name>.github.io/gochi-cycle/`.

## Files

```
index.html        page structure
css/styles.css    design (navy, teal, coral)
js/model.js       demo data, ML model (ridge regression), plan and impact formulas
js/app.js         dashboard screens, English/Japanese text
js/customer.js    customer app: login, stores, menus, cart, orders
js/stores.js      demo stores of the three chains, pickup slots, deals
css/customer.css  customer app design and motion (respects reduced-motion)
```

## 7-minute demo path (for the final)

0. **Customer app:** log in, browse the three chains on the map, pre-order 2 bento for tomorrow 12:00 at Seven-Eleven Noboricho, add a discounted leftover, and check out. The order turns "Ready for pickup".
1. **Store** (Seven-Eleven Noboricho): your customer pre-order is already in the forecast. Friday, rain, 14 °C → show the AI forecast vs the usual plan, and the leftovers going down.
2. **Add a group pre-order** (8 bento) → the forecast rises by exactly 8 (certain sales).
3. **Switch to sunny and 28 °C** → salads and sandwiches go up, bento goes down (the AI learned it).
4. **"List expected leftovers"** → **Customer:** alert, then reserve, then the pickup code.
5. **Impact:** food, money and CO₂e update live.
6. **How the AI works:** "On days it never saw, the AI's error is about 10–45% lower than the usual method."
