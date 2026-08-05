# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

One-tap restaurant/cafe picker. The user chooses a category and radius, presses "Pick", and gets a swipeable deck of ranked nearby places.

The product is branded **CupMap** (see `expo-app/app.json`, i18n strings, `@cupmap/*` storage keys). The repo, backend, Fly app, and bundle identifier are still named **BitePick**. Both names refer to the same thing — don't "fix" one to match the other without being asked.

Three independent apps in one repo:

- `expo-app/` — Expo / React Native client (SDK 56, expo-router, React 19)
- `backend/` — TypeScript Express 5 API on MongoDB, deployed to Fly.io (`app = 'bitepick'`, region `fra`)
- `landing-page/` — static marketing site (plain HTML/CSS/JS, no build step)

## Commands

```bash
# Backend (cd backend)
npm run dev                  # tsx watch src/server.ts
npm run build                # tsc -> dist/
npm start                    # node dist/server.js

# Expo app (cd expo-app)
npm start                    # expo start
npm run ios / npm run android    # native builds (expo run:*)
npm run web                  # expo start --web
npm run lint                 # expo lint
npx tsc --noEmit             # typecheck
```

There is no test suite in either app — no test runner is installed. Verification is manual (or via typecheck).

`backend/.env` must exist before `npm run dev`; copy `.env.example`. `env.ts` validates with zod and **throws on startup** if `JWT_SECRET` (min 16 chars) or `GOOGLE_PLACES_API_KEY` is missing.

## Backend architecture

Only one endpoint does real work: `POST /api/v1/restaurants/pick`. Everything else is scaffolding. The request flows through three files, and understanding all three is necessary before changing recommendation behavior:

1. **`validators/restaurantValidator.ts`** — zod schema for lat/lng, radius (500–10,000 m, default 3000), and `context` (`food | coffee | dessert | drinks | brunch | bakery`).

2. **`services/placesService.ts`** — calls Google Places API **(New)** `places:searchNearby` (POST + `X-Goog-FieldMask`, not the legacy REST API). Filtering is deliberately two-layered: `CONTEXT_TYPE_MAP` sets the request's `includedTypes`, then `STRICT_CONTEXT_FILTERS` re-filters the response locally because Google returns loose matches, plus an `EXCLUDED_TYPES` blocklist (gas stations, supermarkets) and an open-now filter. Adding a new context means updating **both** maps.

3. **`services/scoringService.ts`** — the ranking core. Places below 4.0★ or 20 reviews are dropped, then scored:
   - Bayesian confidence-weighted rating (`CONFIDENCE_THRESHOLD = 50`, `PRIOR_RATING = 4.0`) so a 4.6 with 1000 reviews beats a 4.7 with 12
   - exponential distance decay `exp(-km / 1.5)`, plus a proximity bonus (<1 km) and far penalty (>3 km)
   - logarithmic popularity factor
   - weights: rating 0.45, distance 0.40, popularity 0.15

   After sorting, each of the top 10 gets a `reason` (`top_pick`, `best_rated`, `closest`, `popular`, `hidden_gem`) and a generated human `explanation` string. Reason/explanation are assigned **after** sorting — rank 0 is always `top_pick`.

**Dead code to be aware of:** `models/User.ts`, `services/authService.ts`, `lib/jwt.ts`, `validators/authValidators.ts`, and `middleware/validateRequest.ts` are scaffolded but wired to no route. There is no auth and no user persistence anywhere in the product.

## Expo app architecture

**Provider stack** (`src/app/_layout.tsx`, outermost first): GestureHandlerRootView → QueryClientProvider → OnboardingProvider → SavedRestaurantsProvider → DiscoverProvider. Onboarding and SavedRestaurants exist as contexts specifically because multiple screens read/write the same state — calling the underlying hooks directly at more than one call site creates independent copies and silently breaks. The context files document this.

The `Stack` is mounted only once `onboardingLoaded` is true. This is not incidental: with both `Stack.Protected` guards false during the async AsyncStorage read, expo-router falls back to the first unconditional screen (`settings`) and gets stuck. Don't hoist the Stack out of that conditional.

**Data flow — the key idea:** `DiscoverContext` holds only `searchParams` and `activeRestaurantId`, never the restaurant list. Discover and Map both call `useRestaurantSearch(searchParams)`, which derives an identical TanStack Query key, so the cache is the single source of truth and Map costs zero extra network calls. To share result data between screens, share the search params — do not lift the list into context.

Discover ↔ Map two-way sync of the active card uses a `lastPublishedRef` guard in `(discover)/index.tsx` to prevent the publish and subscribe effects from ping-ponging.

**Persistence** is AsyncStorage only, under `@cupmap/*` keys (`onboarding_completed`, `maps_preference`, `preferences`, `saved_restaurants`). Nothing syncs to the backend. `use-saved-restaurants.ts` centralizes its write in a single effect on the map — writes must not be moved back into the setState updaters (React may invoke updaters more than once per commit, which previously corrupted stored entries).

**Client-side ranking:** `utils/rank-restaurants.ts` re-sorts the backend's `score` with a small boost for price matches, without mutating the query cache. Onboarding also collects cuisine and dietary preferences, but these are **intentionally unused** — the `Restaurant` type carries no cuisine-level data to match against without a backend change.

**Native UI:** the two bottom sheets (`components/filter-sheet.tsx`, `components/category-picker-sheet.tsx`) are built with `@expo/ui` — real SwiftUI sheets/pickers on iOS and Jetpack Compose on Android. `@expo/ui` has no web binding, so each has a `.web.tsx` sibling holding the JS-drawn `Modal` version; the two must keep identical props. Shared option lists live in `constants/categories.ts` precisely so the platform variants can't drift. Adding or upgrading `@expo/ui` requires a native rebuild (`npx expo run:ios`), not just a Metro reload.

**Routing:** expo-router with typed routes and React Compiler enabled. Tabs use `expo-router/unstable-native-tabs`; icons are plain SF Symbol / Material identifiers rather than `NativeTabs.Trigger.VectorIcon`, which rasterizes via `expo-font.renderToImageAsync` and throws on web. Several screens have `.web.tsx` variants (`map`, `animated-icon`, `use-color-scheme`) — web parity is maintained, so check whether a change needs a web counterpart.

**Path aliases:** `@/*` → `expo-app/src/*`, `@/assets/*` → `expo-app/assets/*`.

**i18n:** 10 locales in `src/locales/*.json`, keyed by system language via `i18n-js` with English fallback. UI strings go through `i18n.t()` — adding a string means adding the key to `en.json` at minimum, and iOS also lists locales in `app.json` under `CFBundleLocalizations`.

**Analytics:** all Firebase events funnel through `src/services/analytics.ts`, which no-ops (console-logs only) when `__DEV__`. Save/feedback events are fired inside `use-saved-restaurants.ts` rather than at call sites, since three screens trigger the same actions.

## Known rough edges

- `src/services/api.ts` falls back to a hardcoded **devtunnel URL** when `EXPO_PUBLIC_API_URL` is unset; the Fly URL sits commented out beside it. Production builds need the env var.
- `src/app/(tabs)/(profile)/index.tsx` is an untracked placeholder returning `<Text>profile</Text>`.
- `src/app/(tabs)/(discover)/index.tsx` is ~1400 lines and contains five sub-components plus the screen itself.
