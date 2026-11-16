# Hometown Harvest Hub

Private dashboard for the farm: pack and deliver weekly orders, track CSA members,
and watch the germination chamber and greenhouse.

| Tab | What it shows | Data |
|-----|---------------|------|
| **Orders** | Pack list per delivery/pickup day, one card per customer | `Orders` (main project) |
| **CSA** | Members, contact info, payment-received toggle | `2026 Members` (main project) |
| **Germination** | Latest temp, set temperature, history chart | `germination` (climate project) |
| **Greenhouse** | Latest temp and humidity, history charts | `greenhouse` (climate project) |

Built with Next.js and the Firebase web SDK. Only the Google accounts in
`lib/config.js` can sign in, and `firestore.rules` enforces the same list on the data itself.

## How orders are grouped

Each order belongs to the delivery or pickup day the customer picked (for example
`delivery-2026-11-17`). The website closes each day at its own cutoff (`orderCutoff` in the
website's `orderConfig.js`), so the hub doesn't need a separate cutoff rule. The **order week**
is the Monday–Sunday week containing that day, so a week holds its Tuesday delivery and
its Saturday pickup. Only orders with `status: "paid"` are counted.

## Setup

### 1. Run it locally

```bash
npm install
npm run dev     # http://localhost:3000
```

### 2. Enable Google sign-in (main project)

Firebase console → project **csa-registration-1ed70** → **Authentication** →
**Get started** (if needed) → **Sign-in method** → **Google** → Enable → Save.
`localhost` is allowed by default. After deploying, add your Vercel domain under
**Authentication → Settings → Authorized domains**.

### 3. Publish the Firestore rules (main project)

Open **Firestore Database → Rules**, copy what's there now somewhere safe (in case you need to roll back),
paste in `firestore.rules`, and click **Publish**. Then:
- submit a test CSA registration on the website (it should still work), and
- place a test order (checkout and the Stripe webhook use the Admin SDK, which ignores rules).

> If your current rules allow other collections that aren't in `firestore.rules`, they'll be
> blocked after publishing. Add a rule for anything you still use.

### 4. Climate data (second project)

The Raspberry Pis write to the separate **hometown-harvest-hub** project. When you sign in, the
hub reuses your Google sign-in for that project too. For that to work:

1. Firebase console → **hometown-harvest-hub** → **Authentication** → **Sign-in method** →
   **Google** → Enable.
2. In the same Google provider settings, expand **Safelist client IDs from external projects**
   and add the main project's **Web client ID** (find it in csa-registration-1ed70 →
   Authentication → Sign-in method → Google → Web SDK configuration).
3. Add your Vercel domain to that project's **Authorized domains** too.

If the climate tabs say they can't read the data, tap **Reconnect with Google**.

**Later:** to put everything in one project, point the Pis at csa-registration-1ed70, then in
`lib/firebase.js` set `climateConfig` to `null`, and add rules for `germination` and
`greenhouse` to `firestore.rules`.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo → Deploy (no settings to change).
3. Add the Vercel URL (e.g. `hometown-harvest-hub.vercel.app`) to **Authorized domains** in
   both Firebase projects (steps 2 and 4).
4. Later pushes to `main` deploy automatically.

## Day-to-day edits

All in `lib/config.js`: allowed emails (also update `firestore.rules`), farm address,
CSA member collections (add `"2027 Members"` next year), and climate source names.
