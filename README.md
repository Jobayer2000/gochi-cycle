# Gochi Cycle: waste nothing, cycle everything

**An AI app that helps convenience stores make the right amount of food, and shares what is left with people nearby before it is wasted.**
コンビニが「ちょうどいい量」を作り、残った食品を近くの人へ届けるAIアプリ。

HiroshimAI Foodtech Hackathon 2026 · Team: Jobayer · Tawhid · Aya (Eikei University of Hiroshima, Faculty of Social System Design)

> **Live demo:** `https://<your-github-name>.github.io/gochi-cycle/` (after GitHub Pages is switched on, see below)

---

## What it does

| Screen | What you see |
|---|---|
| **Store** | Set tomorrow's day, weather, temperature and local events. The **AI forecasts sales for each item**, compares the usual plan with the AI plan, and suggests a discount time and rate for expected leftovers. Group pre-orders are added as certain sales. |
| **Customer** | Nearby still-good food at a discount. Reserve, then get a pickup code. Pickup is 21:00–00:30, before the food is removed. |
| **Impact** | Live totals: food kept out of the bin, customers' savings, store income from leftovers, and CO₂e avoided, with the method shown. |
| **How the AI works** | Model accuracy on unseen days (AI vs the usual method), sales history with tomorrow's forecast, and what the model learned (the effect of each factor). |

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
js/app.js         screens, English/Japanese text, interactions
```

## 7-minute demo path (for the final)

1. **Store:** Friday, rain, 14 °C → show the AI forecast vs the usual plan, and the leftovers going down.
2. **Add a group pre-order** (8 bento) → the forecast rises by exactly 8 (certain sales).
3. **Switch to sunny and 28 °C** → salads and sandwiches go up, bento goes down (the AI learned it).
4. **"List expected leftovers"** → **Customer:** alert, then reserve, then the pickup code.
5. **Impact:** food, money and CO₂e update live.
6. **How the AI works:** "On days it never saw, the AI's error is about 10–45% lower than the usual method."
