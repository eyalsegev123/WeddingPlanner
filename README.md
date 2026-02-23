# Wedding Planner (React + Supabase Collaboration)

A wedding planning dashboard with a Supabase backend, email auth, and multi-user collaboration.

## What it includes
- Wedding profile and personalization (partners, side labels, date, venue).
- Task tracking.
- Vendors & contacts pipeline (Researching, Shortlisted, Booked).
- Guest management and RSVP tracking.
- Tables and seating top-view canvas.
- Budget tracking (planned, paid, left).
- Collaborator invites (Owner + Editor).
- Live realtime updates across collaborators.
- JSON editor/export as an advanced data tool.

## Architecture
- Frontend: React + Vite.
- Backend: Supabase Postgres + Auth + Realtime.
- Data model remains one unified JSON shape (`meta`, `tasks`, `vendors`, `guests`, `tables`, `budget`) stored in Postgres JSONB columns.

## 1) Supabase setup
1. Create a Supabase project.
2. Open SQL editor and run `supabase/schema.sql` from this repo.
3. In Supabase Auth settings, configure your allowed sign-in method (email/password).
4. Ensure Realtime is enabled for the `weddings` table in the Supabase dashboard.

## 2) Environment variables
Create `.env.local` in project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3) Run locally
1. `npm install`
2. `npm run dev`
3. Open the local Vite URL.

## Collaboration behavior
- First authenticated user bootstraps a workspace and becomes `owner`.
- Owner can invite collaborators by email as `editor`.
- Invited user signs in with that same email to activate access.
- Owner and editors can both edit the full workspace.
- Changes sync live via Supabase Realtime.

## Deployment (Vercel)
- Deploy as a Vite app on Vercel.
- Add the same two environment variables in Vercel project settings:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Project structure
- `src/App.jsx`: auth-gated workspace, CRUD state, backend sync, realtime subscription.
- `src/context/AuthContext.jsx`: auth session + sign in/up/out.
- `src/lib/supabaseClient.js`: Supabase client initialization.
- `src/services/weddingApi.js`: workspace CRUD, subscriptions, collaborators API.
- `src/components/CollaboratorsSection.jsx`: invite/remove and member list UI.
- `src/components/JsonSection.jsx`: advanced JSON apply/export/reset.
- `src/utils/storage.js`: data normalization + JSON download helper.
- `supabase/schema.sql`: tables, triggers, RLS policies.
