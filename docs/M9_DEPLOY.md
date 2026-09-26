# M9 deployment runbook — Paddle billing (sandbox), step by step

Everything below happens in **two dashboards**: Paddle and Supabase. Nothing touches the
code. Total time ≈ 30–45 min. You can stop after any step and continue later.

> **Ignore Paddle's "complete activation / verify business" prompts.** Those are only for
> **live** mode (real money). We are working in **sandbox** mode (fake money, test card) —
> no approval, no business details needed.

---

## STEP 1 — Run the database migration (~2 min, in Supabase)

**What/why:** Adds the new columns (`valid_until`, `tts_char_cap`, …) to the existing
`ai_entitlements` table and creates a new `billing_events` table (the webhook's memory, so
it never processes the same Paddle event twice). Safe to run more than once.

1. Open https://supabase.com/dashboard → your project **deutschmeister**
2. Left sidebar: **SQL Editor** → **New query**
3. Open the file `supabase/migrations/0003_billing.sql` from this repo (in VS Code),
   select ALL of it, copy, paste into the SQL editor
4. Click **Run** → you should see "Success. No rows returned"

**Verify it worked:** left sidebar **Table Editor** → you should now see a `billing_events`
table (empty). Click `ai_entitlements` → it should show the new columns
(`valid_until`, `source`, `tts_char_cap`, `cancel_at_period_end`, `paddle_customer_id`).

---

## STEP 2 — Paddle: create the products and prices (~10 min)

**What/why:** In Paddle a *product* is just a name/container; the *price* is what people
actually buy (e.g. "Basic, monthly, €3.99"). We need 2 products with 2 prices each = **4
price IDs**. These IDs are how our server recognizes what someone bought.

1. Log in at **https://sandbox-vendors.paddle.com** (sandbox dashboard — note the
   `sandbox-` prefix; make sure the page shows a **"Test mode"** badge)
2. Left menu **Catalog** → **Products** → **New product**
   - Name: `DeutschMeister Basic` · Description: whatever you like (e.g. "Managed AI tutor")
   - Tax category: **Standard** · Save
3. On the product page find **Prices** → **Add price** → create BOTH:
   - **Basic monthly:** price `3.99`, currency **EUR**, billing period **1 month** → Save
   - **Basic yearly:** price `29.99`, currency **EUR**, billing period **1 year** → Save
4. Repeat for the second product: `DeutschMeister Plus` with prices `5.99`/month and
   `49.99`/year (EUR)
5. **Collect the IDs:** on each product page every price row has an ID starting with
   `pri_…` (hover/click it for a copy button). Note down all **4** — you'll need them in
   Step 4. Example of what they look like: `pri_abc123def456`

**Verify:** you have 2 products, 4 prices, 4 `pri_…` IDs written down.

---

## STEP 2B — Paddle: set the default payment link (~1 min, REQUIRED)

**What/why:** Paddle refuses to create **any** checkout until the account has a *default
payment link*. Without it, clicking Subscribe fails with error
`400 transaction_default_checkout_url_not_set`. (It's the base URL Paddle builds its
payment links on — ours points back at the app itself.) In sandbox any URL is accepted
immediately, no approval.

1. Still in the sandbox dashboard: left menu **Checkout** → **Checkout settings**
2. Find the **Default payment link** field and paste the app URL:
   `https://gabortardos.github.io/deutschmeister/`
3. Click **Save**

**Verify:** the field shows the URL after saving. That's it — this unblocks checkouts.

---

## STEP 3 — Paddle: create an API key (~2 min)

**What/why:** The API key lets our `paddle-checkout` function talk to Paddle ("create a
checkout for this price", "open the manage-subscription page").

1. Still in the sandbox dashboard: **Developer tools** → **Authentication** → tab
   **API keys** → **New API key**
2. Description: `deutschmeister server` → Create → copy the key (starts with `pdl_…`)
3. Treat it like a password — it never goes in the repo, only into Supabase secrets (Step 4)
4. **While you're on this page**, switch to the **Client-side tokens** tab →
   **New token** → description `deutschmeister checkout` → copy it
   (in sandbox it starts with **`test_`**)
5. This one is PUBLIC by design — it can only open checkout windows, nothing else —
   but we still keep it in Supabase secrets (Step 4, as `PADDLE_CLIENT_TOKEN`) so that
   switching to live later is just a value swap.

> **Regenerating the token later** (typo, revocation, spring cleaning): create a fresh
> one here, then update ONLY the `PADDLE_CLIENT_TOKEN` secret in Supabase (Step 4) —
> no function re-paste is needed, `paddle-checkout` reads the secret live on every
> call. Revoke stale tokens so exactly ONE active `test_…` token remains. Multiple
> tokens never conflict with each other — only the string inside the Supabase secret
> ever reaches the app.

**Verify:** you have TWO strings copied: a secret `pdl_…` API key and a public
`test_…` client-side token.

---

## STEP 4 — Supabase: set the secrets (~10 min)

**What/why:** Secrets are private settings our Edge Functions read at runtime. Five of the
six come from Steps 2–3; the sixth (`PADDLE_WEBHOOK_SECRET`) comes in Step 6.

1. Supabase dashboard → project → **Edge Functions** → **Secrets** (or "Manage secrets")
2. Add these **five** now — names must match EXACTLY (uppercase, underscores):

   | Secret name | Value |
   |---|---|
   | `PADDLE_API_KEY` | the `pdl_…` key from Step 3 |
   | `PADDLE_CLIENT_TOKEN` | the `test_…` client-side token from Step 3 |
   | `PADDLE_ENV` | `sandbox` |
   | `PADDLE_SANDBOX_TEST_USER` | your user UUID — see below |
   | `PADDLE_PRICE_MAP` | the JSON below, with YOUR 4 price IDs pasted in |

3. **Your user UUID:** Supabase → **Authentication** → **Users** → click your own account
   → copy the **UID** (looks like `8a1b2c3d-…`). This is the *sandbox safety switch*:
   while `PADDLE_ENV=sandbox`, purchases can only ever grant membership to THIS account,
   never to a real visitor.
4. **`PADDLE_PRICE_MAP` value** — one line, replace the 4 placeholders with your IDs from
   Step 2 (careful: Basic IDs on the basic lines, Plus on the plus lines):

   ```json
   {"pri_BASIC_MONTHLY":{"plan":"basic","kind":"subscription","interval":"month"},"pri_BASIC_YEARLY":{"plan":"basic","kind":"subscription","interval":"year"},"pri_PLUS_MONTHLY":{"plan":"plus","kind":"subscription","interval":"month"},"pri_PLUS_YEARLY":{"plan":"plus","kind":"subscription","interval":"year"}}
   ```

   (It must be ONE line in the dashboard, exactly like above — just with your real `pri_…` IDs.)

**Verify:** the Secrets page lists 5 new `PADDLE_*` secrets.

---

## STEP 5 — Supabase: deploy the two functions (~5 min)

**What/why:** "Deploying" = creating the small server programs (Edge Functions) that run on
Supabase's servers. Same paste-in-dashboard workflow you already used for `ai-proxy` in
M7/M8. The files already exist in this repo — you just paste them.

**Function A — `paddle-checkout`** (the shop assistant):
1. **Edge Functions** → **Create function** (or "New function")
2. Name: `paddle-checkout` (exact)
3. Open `supabase/functions/paddle-checkout/index.ts` in VS Code, copy ALL, paste into the
   dashboard editor (replace anything there)
4. **Keep "Verify JWT" switched ON** (it's on by default) — this function is called by
   your app, and the login-token check makes sure only signed-in users can start a purchase
5. Click **Deploy function**

**Function B — `paddle-webhook`** (the accountant — Paddle calls it, not your app):
1. **Edge Functions** → **Create function**
2. Name: `paddle-webhook` (exact)
3. Paste all of `supabase/functions/paddle-webhook/index.ts`
4. **Switch "Verify JWT" OFF** ⚠️ — intentional: Paddle's servers call this URL and they
   have no Supabase login token. The security is the cryptographic **Paddle-Signature**
   the function verifies on every event (forged requests are rejected with 401)
5. **Deploy function**

**Copy the webhook URL:** click `paddle-webhook` in the list → its URL is shown, like
`https://xxxxx.supabase.co/functions/v1/paddle-webhook` → copy it (needed in Step 6).

**Also re-paste `ai-proxy`** (upgraded in M9 — monthly budgets, HD-voice caps): open
`ai-proxy` in the list → replace its code with the current
`supabase/functions/ai-proxy/index.ts` → **Deploy changes** (leave JWT verification ON;
its secrets are already set from M8).

**Verify:** the functions list shows `paddle-checkout` (JWT ✓), `paddle-webhook` (JWT ✗),
and `ai-proxy` (JWT ✓), all "Successfully deployed".

---

## STEP 6 — Paddle: the webhook (notification destination) (~5 min)

**What/why:** This is how Paddle tells your server "someone paid" / "someone cancelled".
You register your `paddle-webhook` URL with Paddle; Paddle then pushes events to it.

1. Sandbox dashboard → **Developer tools** → **Notifications** →
   **New notification destination** → type **Webhook**
2. URL: paste the `https://…/functions/v1/paddle-webhook` URL from Step 5
3. Events: either select **All events**, or pick exactly these:
   `subscription.activated`, `subscription.updated`, `subscription.canceled`,
   `subscription.paused`, `subscription.resumed`, `subscription.past_due`,
   `transaction.completed`
4. Create it. Then open the destination's page — it shows a **Secret key** (starts with
   `pdl_ntfset_…`) → copy it
5. Back in **Supabase → Edge Functions → Secrets**, add the last secret:

   | Secret name | Value |
   |---|---|
   | `PADDLE_WEBHOOK_SECRET` | the `pdl_ntfset_…` secret key |

**Verify:** in Paddle the destination is listed as active (a "pending/grey" state before
the first real event is normal — it turns green after Step 7's purchase).

---

## STEP 7 — End-to-end test (~10 min) — YES, a real purchase, with your OWN account

Use your **existing** login (not a new one!) — the sandbox guard only allows YOUR account
to receive memberships, so this test only works as you.

1. Open the live app → log in with your account → **Settings → Account & Billing**
   → you should see the pricing cards. *(If they show, `paddle-checkout` + price map work.)*
2. Click **Subscribe — Basic monthly** → the Paddle checkout opens as an **overlay on the
   same page** (dark background, payment form on top; a "Test mode" badge shows).
   Nothing happening / an error message? → see **Troubleshooting** below.
3. Pay with Paddle's test card: **4242 4242 4242 4242**, any future expiry, any CVC, any
   name (your email is prefilled). Nothing real is charged — sandbox play money.
4. After payment the overlay closes by itself and the page shows
   *"Payment received — activating your plan…"*. Within a few seconds the plan badge
   flips to **Basic** and the budget bar shows the $2/mo allowance.
   *(This proves the whole chain: checkout → Paddle → webhook → database → meter.)*
5. Click **Manage subscription** → Paddle's customer portal opens (cancel / update card)
6. Optional cancel-test: cancel in the portal → refresh the app → the plan shows
   "cancels at period end" but keeps access until the period ends — correct behaviour.

**If step 4 doesn't update:** Supabase → **Table Editor → billing_events** → the newest
row's `outcome` shows what the webhook did (`granted`/`extended`/`sandbox-blocked`/…).
Also check **Edge Functions → paddle-webhook → Logs**. Common causes: a wrong price ID in
`PADDLE_PRICE_MAP`, missing `PADDLE_WEBHOOK_SECRET`, or JWT verification left ON (fix:
function → Settings → toggle off → redeploy).

---

## Troubleshooting checkout errors

- **`Paddle checkout error 400 … transaction_default_checkout_url_not_set`**
  → Step 2B is missing. Sandbox dashboard → **Checkout → Checkout settings** → set the
  **Default payment link** to `https://gabortardos.github.io/deutschmeister/` → Save.
  Paddle refuses to create *any* transaction until this is set.

- **"The paddle-checkout function on the server is an older version"** (shown in red
  under the plans, v2.4.2+)
  → The deployed Edge Function predates the overlay flow — re-paste the current
  `supabase/functions/paddle-checkout/index.ts` (Step 5) and confirm it really saved.

- **"…missing its PADDLE_CLIENT_TOKEN secret"**
  → Supabase → Edge Functions → Secrets: `PADDLE_CLIENT_TOKEN` must be the **`test_…`**
  token from Step 3 (a `live_…` token won't work against sandbox). The function itself
  also returns this error (HTTP 500) when the secret is unset.

- **Overlay opens and loads, then a "Something went wrong — please try again
  later" popup appears INSIDE the Paddle frame** (seen in sandbox testing)
  → The app-side chain is fine — token, sandbox env and transaction are all good
  (the overlay wouldn't open at all otherwise). Check, in order:
  1. **Website approval:** sandbox dashboard → **Checkout → Checkout settings →
     Website approval** — the site's domain (`gabortardos.github.io`) must be
     approved; on unapproved domains Paddle refuses to render the checkout and
     shows exactly this popup. (Same screen where the default payment link lives.)
  2. **Read Paddle's own complaint:** since v2.4.4 every `checkout.error` /
     `checkout.warning` is logged to the browser console as `[PADDLE] …` lines.
     Open DevTools (Cmd+Opt+J / F12 → Console), click Subscribe, and read/paste
     those lines — Paddle's docs name this as the first troubleshooting stop;
     the `code`/`detail` say exactly what Paddle rejected.
  3. **Sanity check:** sandbox dashboard → **Transactions** should list a draft
     transaction for each attempt (proves the API side is healthy).
  4. Still nothing? Sandbox can be transiently flaky — wait 2 minutes and retry.

- **"[PADDLE] checkout.error … validation.no_validation_set" on
  `settings.customer.email` + popup inside the overlay** (seen in sandbox
  testing, app ≤ v2.4.4)
  → Fixed in v2.4.5: the app prefilled the signed-in email into
  `settings.customer.email`, but Paddle's transaction-checkout service rejects
  that field for checkouts opened by `transactionId` — prefill is only
  supported for items-based checkouts. The buyer now types their email
  straight into Paddle's form. Nothing changes for the entitlement: the
  webhook maps the purchase by the user id in the transaction's
  `custom_data`, never by email. Hard-refresh until the top bar shows
  **v2.4.5** and click Subscribe again.

- **Sandbox dashboard → Transactions looks empty**
  → Draft transactions DO appear there (status "Draft"), so if the list is
  empty you are almost certainly looking at the wrong place: make sure the URL
  is **sandbox-vendors.paddle.com** (not vendors.paddle.com = live) and that
  you're logged into the same Paddle account that owns the API key /
  client-side token. The overlay opening at all proves a transaction was
  created in that account.

- **"[PADDLE] Unknown option parameter 'environment'"** (app ≤ v2.4.2)
  → Fixed in v2.4.3: Paddle moved sandbox selection out of `Paddle.Initialize` —
  the app now calls `Paddle.Environment.set('sandbox')` before initializing. Your
  token and secret were fine all along; no Supabase change is needed. Hard-refresh
  until the top bar shows **v2.4.3** and click Subscribe again.

- **Pre-v2.4.2 symptom: clicking Subscribe silently redirected to the app's own
  homepage**
  → Fixed in v2.4.2 — that redirect targeted Paddle's "payment link" URL, which is our
  own homepage + `?_ptxn=…`, *not* a checkout page. The app now shows the real reason
  in red text instead, and landing with `?_ptxn=…` in the URL auto-resumes the checkout
  overlay. If you still see this, hard-refresh (Cmd/Ctrl+Shift+R) — the top bar must
  show **v2.4.2**.

- **Overlay opens but shows a Paddle error inside**
  → Check **Edge Functions → paddle-checkout → Logs**, and Paddle sandbox →
  **Transactions** (a failed draft transaction often shows the reason, e.g. an
  inactive price).

---

## Going live later (after Paddle approves your live account)

1. In the **live** dashboard (vendors.paddle.com, no `sandbox-`): create the same 2
   products / 4 prices, a live API key, a **live client-side token** (`live_…`), and a
   live notification destination (same URL!)
2. In the live dashboard also set the **Default payment link** (same app URL) — in live
   mode the website gets reviewed as part of Paddle's account approval, which is normal
3. Update the **6 secret values** in Supabase (live API key, `PADDLE_ENV` = `live`,
   `PADDLE_CLIENT_TOKEN` = live token, live price IDs in `PADDLE_PRICE_MAP`, live
   webhook secret) — names stay the same
4. Redeploy the two functions (re-paste the same code, save) so they pick up new values

That's the whole switch — no code changes.
