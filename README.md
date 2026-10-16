# Contingency Genius

Contingency Genius is a mobile-first daily readiness web app that reads the user’s location, weather, and calendar to generate a risk score and ranked contingency plans.

## Stack

- Vite + React 18 + TypeScript
- React Router v6
- Zustand for fresh in-memory session state
- Supabase browser authentication and profile persistence
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
- App state is intentionally reset on each browser session and sign-out; durable profile preferences are stored per user in Supabase.
- The app supports two theme variants, `vigilante` and `shadow`, via `data-theme` on the root HTML element.
- Mobile-first styling targets narrow screens while remaining usable on larger desktop layouts.
- Supabase is configured through `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The app remains usable in mock/local mode when these values are absent.

## Supabase setup

Create a `.env.local` file from the following template:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The client is intentionally limited to the browser-safe publishable key. Do not commit service-role keys or other secrets. Run `supabase/schema.sql` in the Supabase SQL editor to create the profile table and row-level security policies. The app uses Supabase email/password authentication, creates or loads the signed-in user's profile, and provides an explicit sign-out action that clears the in-memory workspace. Supabase auth sessions are not persisted in localStorage, so a new browser use starts at the vibrant sign-in screen.

For immediate login after account creation, disable **Confirm email** in Supabase Dashboard → Authentication → Providers → Email. If confirmation remains enabled, Supabase will require the user to verify the address before the first login.


## Route flow

- `/` sign-in/sign-up screen
- `/onboarding` personalized mode and day planning flow for the current session
- `/brief` dashboard and daily risk summary
- `/brief/:id` contingency detail view
- `/plan` day planner with buffers and risk flags
- `/alerts` triggered alert feed
- `/debrief` nightly evaluation and carry-forward logic
- `/warroom` seven-day pattern analysis
- `/settings` mode, risk tolerance, contacts, permissions, and custom situations

## Personalized day planning

After sign-in, each user can build a private plan for the day from onboarding. The flow asks for an age group, a plain-language description of the day, priorities, possible concerns, and timed commitments. Those commitments feed the deterministic risk engine as calendar events; concerns become custom contingency situations with Plan A and Plan B steps. The resulting profile and day plan are stored in that user's Supabase `profiles` row and can be rebuilt by visiting `/onboarding` again.

## Validation

The project is validated with the following checks during development:

```bash
npm test -- --run
npm run lint
npm run build
```

These checks are the required gate before moving to the next phase or shipping a new feature slice.
