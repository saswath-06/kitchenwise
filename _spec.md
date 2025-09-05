# KitchenWise – Smart Cooking Assistant

**Specification & Build Plan (v1.0)**

**Tagline:** “KitchenWise – Cook smarter, waste less, eat better.”

---

## 0) Executive Summary

KitchenWise is a mobile‑first platform that combines receipt OCR, a structured pantry database, and an AI cooking agent to suggest make‑now recipes and guide users through adaptive cooking steps. This document lays out the end‑to‑end scope, requirements, and a step‑by‑step implementation plan for every component to be coded.

**Primary Objectives**

* Minimize food waste via accurate intake (OCR + manual), expiry tracking, and auto‑depletion.
* Make meal planning effortless with “available‑now” recipe suggestions and cuisine filters.
* Provide adaptive cooking instructions and live macro recalculation based on actual quantities.

**Success Metrics (v1)**

* OCR extraction precision ≥ 92% on supported retailers.
* Pantry accuracy ≥ 98% after user review.
* ≥ 60% of suggested recipes can be cooked without shopping.
* Median time to recipe < 30 seconds from app open to suggestion list.

---

## 1) Scope & Non‑Goals (v1)

**In Scope**

* Receipt scanning for groceries (priority) and basic restaurant receipts.
* Manual add/edit for pantry items; units, quantities, optional expiry.
* “Cookable now” recipe suggestions; cuisine filters; per‑serving macros.
* Confirmation step before cooking; AI‑generated steps tailored to what’s on hand.
* Auto‑depletion of ingredients when marked cooked; partial quantity handling.
* Accounts, sync across devices, basic notifications for impending expiry.

**Out of Scope (v1)**

* Full meal‑planning calendar & auto‑reserve (foundation hooks only).
* Social/community recipes (readiness scaffolding only).
* Advanced voice‑assistant flows beyond read‑aloud.
* Complex restaurant dish → ingredient decomposition (basic handling only).

---

## 2) User Personas & Primary Journeys

**Personas**

* *Busy Student*: wants 10‑minute ideas with what’s in the dorm fridge.
* *Parent Planner*: tracks family pantry; filters by cuisines kids will eat.
* *Fitness Enthusiast*: cares about protein targets and macros.

**Core Journeys**

1. Add Ingredients → Discover Recipes → Confirm → Cook With AI → Auto‑Deplete.
2. Manually Add/Adjust Items → Refresh Suggestions → Cook.
3. Get Expiry Alerts → Prioritize recipes using “use‑soon” items.

---

## 3) Functional Requirements (What must be built)

### 3.1 Ingredient Management

**3.1.1 Receipt Scanning (OCR + NLP)**

* Capture flow: camera permission, live edge guides, glare detection, multi‑page support.
* Client pre‑processing: crop/deskew, contrast enhancement, compression.
* Upload service with resumable chunks; metadata (device, locale, retailer guess).
* OCR service integration; text blocks returned with coordinates and confidence.
* Line‑item detection and segmentation; totals, taxes, and irrelevant rows ignored.
* NLP parsing:

  * Named entity recognition (ingredient names, brands, sizes).
  * Quantity & unit extraction; package size normalization.
  * Unit conversion into canonical units (g, mL, units, “bunch”, etc.).
  * Alias resolution (e.g., “chix brst” → “chicken breast, raw”).
  * Confidence scoring per field; thresholding for review queue.
* Post‑processing:

  * De‑duplication within the receipt; merge identical items.
  * Pantry reconciliation: increment counts if item exists; else create new.
  * Retailer templates for top stores to boost precision.
* Human‑in‑the‑loop UI: “Review Imported Items” screen with suggested fixes.

**3.1.2 Manual Entry**

* Search‑and‑add using canonical ingredient taxonomy with synonyms.
* Quantity, unit, optional expiry, storage location (fridge/freezer/pantry).
* Bulk add (multi‑row form) and quick add (typeahead + default unit).

**3.1.3 Ingredient Tracking**

* Per item: name, quantity, unit, source (receipt/manual), storage, added date, optional expiry, tags (e.g., halal/kosher/vegan), notes.
* Inventory math: precise, fractional, or count‑based units.
* Expiry estimation: default shelf‑life by category; editable per item.

### 3.2 Recipe Discovery

* Suggestion engine that returns only recipes fully cookable with current pantry (v1). Hook for “1‑missing” mode for future shopping list.
* Cuisine filter (Italian, Indian, Mexican, Mediterranean, etc.).
* Nutrition display per serving: calories, protein, fat, carbs.
* Ranking: prioritize soon‑to‑expire items, prep time alignment, user cuisine prefs.

### 3.3 Recipe Selection & Cooking Mode

* Confirmation prompt (“Do you want to make this dish?”).
* AI step generation tailored to actual quantities and available tools.
* Dynamic timing & temperature adjustments (e.g., 400 g chicken vs 500 g).
* Macro recalculation based on exact used quantities.
* Cooking Mode UI: step‑wise navigation, timers, read‑aloud, “mark step done.”

### 3.4 Ingredient Consumption

* When dish marked cooked: decrement quantities atomically.
* Partial quantity handling; prevent negative inventory.
* Undo within 5 minutes; audit log per change.

### 3.5 Accounts & Settings

* Sign‑in (email + OAuth options), device sync, time‑zone & unit preferences.
* Dietary tags, allergens, cuisine preferences, equipment profile (optional v1).

### 3.6 Notifications

* Expiry alerts (e.g., 3 days before), low‑stock reminders, “use‑soon recipe” nudges.

---

## 4) Non‑Functional Requirements

* **Performance:** OCR round‑trip P50 < 5s, P95 < 10s on LTE; suggestion query < 300ms server time.
* **Reliability:** 99.9% API uptime; retry idempotency for uploads.
* **Offline:** Read‑only pantry + cached recipes; queue writes to sync later.
* **Accessibility:** WCAG AA; voice read‑aloud in Cooking Mode.
* **Internationalization:** Units (metric/imperial), locale‑aware formatting.
* **Security & Privacy:** PII minimization; encrypted at rest/in transit; opt‑in analytics; data retention policy; right‑to‑delete.
* **Observability:** Structured logs, traces, dashboards, alerting on SLOs.

---

## 5) System Architecture (High‑Level)

**Components**

* Mobile App (Flutter or React Native).
* API Gateway + Auth.
* Pantry Service.
* Recipe Service.
* OCR + NLP Service (Receipt Parser).
* AI Orchestrator (cooking steps + macro recalculation).
* Nutrition Adapter (USDA/Edamam).
* Notification Service.
* Background Jobs & Queues (ingest, enrichment, expiry cron).
* Object Storage (receipt images).
* Relational DB (PostgreSQL) or Document DB (MongoDB) per final model.
* CDN for static assets.

**Key Data Flows**

1. Receipt → Upload → OCR → NLP Parse → Canonicalize → Pantry Update → Review.
2. Pantry → Suggestion Query → Recipes → User Confirms → AI Orchestrate → Steps → Cook → Deplete.

---

## 6) Data Model (Conceptual)

**Entities**

* **User**: id, email, auth provider, preferences (units, diet, cuisines, allergens), equipment profile, created/updated.
* **Receipt**: id, userId, retailer, capturedAt, pages, ocrStatus, parseStatus, confidenceSummary.
* **ReceiptLineItem**: id, receiptId, rawText, nameCanonicalId, qty, unit, sizeText, confidence per field.
* **IngredientCanonical**: id, name, synonyms\[], category, defaultUnit, density/conv hints, shelfLifeDefaults, nutritionRef.
* **PantryItem**: id, userId, ingredientCanonicalId, qty, unit, storage, expiryAt?, source, addedAt, notes, tags\[]
* **Recipe**: id, title, cuisine, steps (baseline), yields, time, difficulty, image, url?, author?, nutrition per serving, source.
* **RecipeIngredient**: id, recipeId, ingredientCanonicalId, qty, unit, optional?, substitutions\[]
* **CookingSession**: id, userId, recipeId, startedAt, finalizedAt?, stepsGenerated, usedIngredients\[], macrosActual.
* **NutritionProfile**: id, ingredientCanonicalId → per‑100g/mL/unit macros.
* **WasteInsight** (foundation): itemId, reason, discardedQty.
* **MealPlan** / **ShoppingList** (future): planId, reservedQty; list items.

**Relationships**

* User 1‑N PantryItem, Receipt, CookingSession.
* Recipe 1‑N RecipeIngredient; RecipeIngredient → IngredientCanonical.

**Constraints & Rules**

* PantryItem (qty, unit) must be valid per canonical unit set for ingredient.
* CookingSession writes deltas to PantryItems in a single transaction.

---

## 7) Integrations & Services

**OCR**

* Provider: Google Vision API (primary) with fallback to on‑device Tesseract for privacy/offline snapshot.
* Pre‑processing parameters tuned for receipts (monochrome, high contrast).

**NLP Parsing**

* Pipeline: Tokenize → NER for product/brand/size → Quantity/Unit parser → Canonical mapping via synonym dictionary + fuzzy matching → Confidence scoring.
* Retailer templates to map known SKU patterns to canonical ingredients.

**Nutrition Data**

* Source: USDA FoodData Central API or Edamam Nutrition API.
* Strategy: nightly sync of commonly used ingredients; on‑demand fetch with caching and manual overrides for edge cases.

**LLM (AI Cooking Agent)**

* Provider: OpenAI API (server‑side only).
* Prompting: system + recipe + pantry delta; enforce structured JSON envelope for steps and recalculated macros.
* Safety: temperature ≤ 0.7; content filters; hard‑coded food‑safety inserts (e.g., safe internal temps for meats); guard against hallucinated ingredients.

---

## 8) API Design (Endpoint Catalog)

*(Describe shapes; exact schemas live in OpenAPI later.)*

**Auth**

* Sign‑up/Sign‑in, Refresh token, Revoke.

**Pantry**

* List pantry items (filters: storage, expiringSoon).
* Create/update/delete pantry item; bulk upsert.
* Compute availability snapshot (for recipe matching).

**Receipts**

* Start upload (obtain upload URL), finalize upload.
* Get OCR/parse status; fetch parsed line items.
* Confirm import (apply to pantry) or edit before import.

**Recipes**

* List suggestions (inputs: availability snapshot, cuisine filters, serving count, time constraints).
* Get recipe detail with baseline nutrition and ingredient list.

**Cooking Sessions**

* Start session (locks required quantities), generate AI steps.
* Mark step done; set timers; read‑aloud stream.
* Complete session (apply depletions); undo window; audit log retrieval.

**Nutrition**

* Lookup per ingredient; batch resolve macros for a set of quantities/units.

**Notifications**

* Register device token; schedule/unschedule expiry alerts.

**Analytics**

* Track events (consent‑gated): scan\_started, items\_imported, recipe\_viewed, cook\_started, cook\_completed, depletion\_applied, undo\_used, etc.

---

## 9) OCR + NLP Pipeline (Step‑by‑Step Build)

1. **Camera & Capture**: implement guided capture, multi‑page, offline cache.
2. **Image Pre‑processing**: crop/deskew, denoise, adaptive thresholding.
3. **OCR Call**: submit to provider; receive blocks with coordinates & confidence.
4. **Line‑Item Segmentation**: detect product rows vs totals; handle multi‑line items.
5. **Parsing**:

   * Extract product name, size (e.g., “500g”), quantity (e.g., “x2”), unit; price optional.
   * Normalize units (g↔kg, mL↔L, count→unit). Infer unit for count‑only items.
6. **Canonical Mapping**:

   * Synonym table + fuzzy match; fallback to user confirmation when confidence < threshold.
7. **Pantry Reconciliation**: merge with existing items; increment quantities.
8. **Review UI**: present low‑confidence fields; fast edit controls; accept‑all.
9. **Error Handling**: timeouts, partial pages, duplicate uploads; idempotency keys.

**Restaurant Receipts (v1 basic)**

* Detect “prepared meal” line items; create PantryItem of type “prepared dish” with serving count and estimated macros; optionally map to a recipe if known (e.g., “rotisserie chicken”).

---

## 10) Recipe Suggestion Engine (Step‑by‑Step Build)

1. **Ingredient Availability Snapshot**: materialize a structure of canonicalId → qty/unit available.
2. **Recipe Index**: normalized ingredient requirements with canonical units.
3. **Exact‑Match Filter**: include a recipe only if every required ingredient is available in sufficient quantity (ignore optional ingredients).
4. **Cuisine Filter**: apply user‑selected cuisines.
5. **Ranking**: sort by (a) use‑soon score (time to expiry), (b) prep time closeness to user preference, (c) past likes, (d) nutritional fit (e.g., protein target if set).
6. **Nutrition Display**: fetch baseline macros per serving (from recipe or computed from nutrition profiles).

---

## 11) AI Cooking Agent (Step‑by‑Step Build)

1. **Input Contract**: selected recipe id; serving count; availability snapshot (actual quantities), user equipment profile and dietary/allergen flags.
2. **Constraint Logic**: calculate scaling factors (e.g., 0.8× for 400g vs 500g chicken); check cascading effects on spices/liquids and cooking times.
3. **Prompt Assembly**: system instruction + recipe baseline + constraints + safety inserts; request structured output: ordered steps with times/temps, tips, and a list of used quantities per ingredient.
4. **Post‑Processing**: validate the model output; reject if it introduces non‑pantry items; ensure units are supported; clip times within safe ranges.
5. **Macro Recalc**: compute per‑serving macros from *actual used* quantities via nutrition profiles.
6. **Cooking Mode UX**: step navigation, timers, read‑aloud; ability to adjust serving count before finalizing.
7. **Failure Paths**: gracefully fall back to static recipe steps if AI unavailable; notify user.

---

## 12) Depletion, Concurrency & Audit

1. **Locking**: when session starts, soft‑lock required quantities to prevent racing cooks on multiple devices.
2. **Transactional Depletion**: apply decrements in a single transaction; prevent negative balances; release unused locks on cancel.
3. **Partial Usage**: support fractional units; round based on unit policy (e.g., eggs whole vs half allowed?).
4. **Undo**: reversible within time window; write compensating entries.
5. **Audit Log**: append‑only journal of changes with source (cook/manual).

---

## 13) Expiry Tracking & Notifications

* **Defaults**: shelf‑life by category (room/fridge/freezer).
* **Rules**: editing expiry should update “use‑soon” score.
* **Alerts**: schedule notifications T‑3 days; daily digest for multiple items.
* **Muted Items**: allow per‑item snooze or mute.

---

## 14) Mobile App UX (Screens & Requirements)

**Onboarding**: permissions, cuisine & diet preferences, units, quick tutorial.
**Home**: quick “Scan Receipt,” expiring soon list, top suggestions.
**Pantry**: searchable list, filters (storage, expiring soon), bulk edit.
**Scan**: camera UI, import from gallery, progress feedback, review results.
**Add Item**: search canonical list, set qty/unit/expiry/storage.
**Recipes**: suggestions grid/list, cuisine filter, time filter.
**Recipe Detail**: ingredients coverage badge (100% match), macros per serving.
**Confirmation**: “Make this?” → serving count selector → start cooking.
**Cooking Mode**: step view, timers, read‑aloud, safety notes, mark done.
**Post‑Cook**: summary of used quantities, macros, option to undo.
**Settings**: profile, allergens, cuisine prefs, equipment, notifications, privacy.

**Accessibility**: large text mode; screen reader labels; haptics; color‑blind safe.

---

## 15) Analytics & Experimentation

* **Key Events**: app\_opened, scan\_started, parse\_complete, import\_confirmed, recipe\_viewed, cuisine\_filter\_used, cook\_started, cook\_completed, depletion\_applied, expiry\_alert\_sent/opened.
* **Funnels**: scan → import → first cook; suggestion view → cook start.
* **KPIs**: weekly active cooks, average depletion accuracy, waste reduction proxy (consumed before expiry vs after).
* **A/B Hooks**: ranking tweaks, notification timing, wording tests.

---

## 16) Testing Strategy

**Unit Tests**: parsers (quantities, units), canonical mapping, depletion math.
**Integration Tests**: OCR payload → parsed items → pantry updates; recipe match pipeline; AI output validator.
**E2E (Device Farm)**: scan to cook on top 5 devices; offline/online transitions.
**Data Quality**: golden set of 500 receipts across top retailers with labeled ground truth; precision/recall reports.
**Performance**: load test suggestion queries; upload/OCR latency budgets.
**Security**: auth flows, token revocation, broken‑access control checks.

---

## 17) DevOps, CI/CD & Environments

* **Branches**: trunk‑based with feature flags for risky features.
* **CI**: build, lint, tests, static analysis, mobile build pipelines.
* **CD**: staged rollouts; crash analytics gating; feature flag toggles.
* **Environments**: dev, staging, prod; separate API keys and stores.
* **Monitoring**: logs, traces, dashboards; alert on error rates & SLO breaches.
* **Backups**: nightly DB snapshots; object storage lifecycle policies.

---

## 18) Security, Privacy & Compliance

* **PII Minimization**: redact card numbers/totals from stored receipts.
* **Encryption**: TLS in transit; AES‑256 at rest; KMS‑managed keys.
* **Access Control**: per‑user data isolation; scoped tokens.
* **Permissions**: camera, notifications—transparent rationale.
* **Data Rights**: export & delete my data; retention windows.
* **Regional**: consider PIPEDA/GDPR for Canadian/EU users; consent for analytics.

---

## 19) Phased Delivery Plan (Milestones)

**M0 – Foundations (2–3 weeks)**

* Auth, user prefs, base navigation; telemetry; skeleton services; object storage.

**M1 – Intake & Pantry (3–4 weeks)**

* Camera, upload, OCR call, basic parsing; manual add; pantry list/edit; review UI.

**M2 – Recipes & Matching (3 weeks)**

* Import recipe dataset; canonicalize; exact‑match engine; cuisine filter; macros display.

**M3 – AI Cooking (3–4 weeks)**

* Orchestrator, prompt/output contracts, Cooking Mode UI, timers, read‑aloud; macro recalculation.

**M4 – Depletion & Notifications (2 weeks)**

* Transactional depletion, audit, undo; expiry tracking + alerts.

**Beta & Hardening (2–3 weeks)**

* Performance, QA, app store readiness, privacy review, crash‑free > 99.5%.

---

## 20) Implementation Checklists (What to Code, Step by Step)

**A) Mobile App**

1. App shell, routing, state management, feature flags.
2. Auth screens; secure token storage.
3. Pantry list/detail; filters; add/edit; unit pickers; expiry selector.
4. Camera scan flow; gallery import; upload progress; error states.
5. Receipt review screen with inline fixes; accept‑all/accept‑selected.
6. Recipes list; cuisine filter; search; macros chips; empty states.
7. Recipe detail; coverage badge; confirm modal with serving selector.
8. Cooking Mode: stepper, timers, read‑aloud; resume session.
9. Post‑cook summary; undo; feedback prompt.
10. Settings: diet/allergens, cuisines, equipment, notifications, privacy.

**B) Backend Services**

1. Auth & user profiles; preferences API.
2. Pantry service (CRUD, bulk upsert, availability snapshot).
3. Receipt ingestion (upload URLs, finalize, dedupe by hash, status checks).
4. OCR adapter; retry/backoff; provider abstraction.
5. NLP parser service; synonym/alias tables; unit conversion library.
6. Canonical ingredient taxonomy bootstrap; admin tools to curate.
7. Recipe importer & normalizer; optional ingredient flags.
8. Suggestion engine; ranking; pagination.
9. AI orchestrator; output validator; safety inserts.
10. Nutrition adapter; caching; nightly sync jobs.
11. Depletion transaction boundary; audit log; undo mechanism.
12. Notification scheduler; device token registry.
13. Analytics ingestion; event schema; privacy gating.

**C) Data & Ops**

1. DB schema migrations; indices for common queries.
2. Object storage buckets; lifecycle policies; CDN.
3. Queues for async jobs; dead‑letter handling.
4. Monitoring dashboards and alerts.
5. Backups and disaster recovery drill.

---

## 21) Risks & Mitigations

* **Low OCR accuracy on certain retailers** → Add retailer templates; user review flow; crowdsource corrections.
* **LLM hallucinations** → Strict validator; reject non‑pantry ingredients; show warning if fallback used.
* **Unit conversion errors** → Centralized conversion library with tests and density tables; limit free‑text units in UI.
* **Depletion race conditions** → Locks + transactions + idempotency keys.
* **Nutrition gaps** → Manual override UI and caching strategy; conservative defaults.

---

## 22) Future‑Facing Hooks (v2+)

* Meal planning calendar & ingredient reservation.
* Shopping list autofill for near‑miss recipes.
* Voice assistant with full command coverage.
* Community recipes with ratings/tags; moderation tools.
* Waste insights dashboard; donation suggestions for excess items.

---

## 23) Appendix

**A) Ingredient Taxonomy Starter (examples)**

* Proteins → Poultry (chicken breast, thighs), Beef (ground, steak), Seafood, Legumes.
* Produce → Leafy greens, Cruciferous, Roots, Herbs.
* Staples → Grains, Pasta, Oils, Spices, Canned goods.

**B) Error Codes (examples)**

* RCP‑UPL‑TIMEOUT: upload timeout; retry suggested.
* OCR‑LOW‑CONF: OCR confidence below threshold; manual review required.
* AI‑VAL‑FAIL: AI output failed validation; fallback to baseline steps.
* PANTRY‑LOCK‑CONFLICT: concurrent modification detected; retry.

**C) Food‑Safety Inserts (examples)**

* Chicken to ≥ 74°C/165°F internal temp.
* Ground beef to ≥ 71°C/160°F; seafood opaque and flakes easily.

---

**End of v1.0**
