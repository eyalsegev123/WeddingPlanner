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
- Section-level collapse/expand controls + global open/collapse all controls.

## Architecture
- Frontend: React + Vite.
- Backend: Supabase Postgres + Auth + Realtime (no custom Express server).
- Data model remains one unified JSON shape (`meta`, `tasks`, `vendors`, `guests`, `tables`, `budget`) stored in Postgres JSONB columns.

## 1) Supabase setup
1. Create a Supabase project.
2. Open SQL editor and run `supabase/schema.sql` from this repo.
3. In Supabase Auth settings, configure your allowed sign-in method (email/password).
4. Ensure Realtime is enabled for the `weddings` table in the Supabase dashboard.
5. If tables/policies were just created, run:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

## 2) Environment variables
Create `.env.local` in project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

Important:
- The app currently reads `VITE_SUPABASE_ANON_KEY` (not `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`).

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
- `Refresh` button pulls the latest workspace snapshot from backend (manual fallback).

## Current invite behavior
- Invites are stored in `wedding_members` as `pending`.
- No invitation email is sent automatically yet.
- Collaborator gets access when they sign in with the same invited email.

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
- `src/components/AuthPanel.jsx`: login/signup UI.
- `src/components/CollaboratorsSection.jsx`: invite/remove and member list UI.
- `src/components/JsonSection.jsx`: advanced JSON apply/export/reset.
- `src/utils/storage.js`: data normalization + JSON download helper.
- `supabase/schema.sql`: tables, triggers, RLS policies.

## Troubleshooting
- Error: `Could not find the table 'public.wedding_members' in the schema cache`
  - Re-run `supabase/schema.sql`, then `NOTIFY pgrst, 'reload schema';`.
- Error: `new row violates row-level security policy for table "weddings"`
  - Ensure the latest `supabase/schema.sql` is applied (includes owner bootstrap select policy).
