# Contingency Genius

Contingency Genius is a mobile-first daily readiness web app that reads the user’s location, weather, and calendar to generate a risk score and ranked contingency plans.

## Stack

- Vite + React 18 + TypeScript
- React Router v6
- Zustand with localStorage persistence
- Supabase client integration foundation
- date-fns and Recharts
- Vitest + React Testing Library

## Scripts

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

## Project structure

```text
src/
  app/            router and layout
  components/     reusable UI primitives
  features/       onboarding, briefing, planner, alerts, debrief, warroom, settings
  engine/         risk engine and rule-based calculations
  services/       mock service interfaces for weather, calendar, and location
                  Supabase client and profile persistence adapter
  data/           mock weather/events/profile payloads
  store/          Zustand app state
  theme/          theme tokens and design system variables
  types/          shared TypeScript definitions
  test/           global test setup
```

## Architecture notes

- The app is client-side only and deliberately uses mock data and service interfaces that can be swapped for live API implementations later.
- Risk generation is deterministic and rule-based in `src/engine/riskEngine.ts`; no AI or backend calls are used.
- Persisted app state lives in `src/store/useAppStore.ts` and is written with Zustand `persist` middleware.
- The app supports two theme variants, `vigilante` and `shadow`, via `data-theme` on the root HTML element.
- Mobile-first styling targets narrow screens while remaining usable on larger desktop layouts.
- Supabase is configured through `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The app remains usable in mock/local mode when these values are absent.

## Supabase setup

Create a `.env.local` file from the following template:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The client is intentionally limited to the browser-safe publishable key. Do not commit service-role keys or other secrets. Run `supabase/schema.sql` in the Supabase SQL editor to create the profile table and row-level security policies. Settings exposes sync status and can save a signed-in user's profile to Supabase; local persistence remains the fallback until authentication is configured.

## Route flow

- `/` onboarding and mode selection
- `/brief` dashboard and daily risk summary
- `/brief/:id` contingency detail view
- `/plan` day planner with buffers and risk flags
- `/alerts` triggered alert feed
- `/debrief` nightly evaluation and carry-forward logic
- `/warroom` seven-day pattern analysis
- `/settings` mode, risk tolerance, contacts, permissions, and custom situations

## Validation

The project is validated with the following checks during development:

```bash
npm test -- --run
npm run lint
npm run build
```

These checks are the required gate before moving to the next phase or shipping a new feature slice.
