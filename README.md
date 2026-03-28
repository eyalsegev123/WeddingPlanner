# Wedding Planner

A real-time collaborative wedding planning dashboard. Couples and their planners can manage every aspect of the wedding — guests, tasks, vendors, budget, and seating — with live updates across all collaborators.

Built with **React 18 + TypeScript + Vite + Supabase**. Full mobile support with a bottom tab bar, plus an AI wedding assistant powered by Claude.

---

## Features

| Section | What it does |
|---|---|
| **Wedding Profile** | Partners' names, side labels, date, venue, currency, planner name |
| **Collaborators** | Invite co-planners by email as editors; owner can remove members |
| **Tasks** | To-dos with status (Open / In Progress / Blocked / Done), priority, due date, owner |
| **Venues** | Compare shortlisted venues — cost per person, design fee, hours, food/drink minimum, alcohol policy, estimated totals |
| **Guests** | RSVP tracking (Pending / Yes / No), family side assignment, phone, email, notes |
| **Budget** | Planned vs. paid vs. remaining; category grouping; currency from profile |
| **Tables** | Top-view drag canvas; assign guests to round or rectangular tables by capacity |
| **AI Assistant** | Claude-powered chat that answers questions about your wedding data — guests, budget, venues, tasks |
| **JSON Editor** | Apply raw JSON, export full dataset, or reset — power-user escape hatch |
| **Realtime sync** | Every collaborator sees changes live via Supabase Realtime |
| **Collapse controls** | Per-section open/close + global Open All / Collapse All |
| **Mobile support** | Full mobile parity — bottom tab bar navigation, floating AI chat button, read-only seating view |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript (strict), Vite 5 |
| Styling | DM Sans (body) + Cormorant Garamond (headings), warm organic design system |
| Backend | Supabase — Postgres, Auth, Realtime, Edge Functions |
| Auth | Supabase email/password |
| AI | Claude (claude-haiku) via Supabase Edge Function + Anthropic API |
| Persistence | JSONB columns per domain in a single `weddings` row |
| Realtime | Supabase `postgres_changes` subscription on `weddings` |
| Deployment | Vercel (static Vite build) |

---

## System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              React + Vite App (SPA)                  │  │
│   │                                                      │  │
│   │  AuthContext  →  useWorkspace  →  useWeddingData     │  │
│   │                       ↕               ↕             │  │
│   │              useSync (debounce + realtime)           │  │
│   └──────────────────────────────────────────────────────┘  │
│                    │                  ↑                      │
│              REST / RLS         Realtime WS                  │
└────────────────────┼─────────────────┼──────────────────────┘
                     ↓                 │
         ┌───────────────────────────────────────────┐
         │              Supabase                      │
         │                                           │
         │  ┌──────────┐  ┌──────────┐  ┌────────┐  │
         │  │ Postgres │  │   Auth   │  │Realtime│  │
         │  │  + RLS   │  │  (JWT)   │  │  (WS)  │  │
         │  └──────────┘  └──────────┘  └────────┘  │
         └───────────────────────────────────────────┘
```

No custom Express server. The Supabase JS client handles auth, DB calls, and the realtime WebSocket connection — all secured by JWT + RLS at the database level.

---

### Frontend Module Design

```
main.tsx
  └── AuthProvider (context)
        └── App.tsx  ← thin composition layer
              │
              ├── useAuth()           ← from AuthContext
              ├── useWorkspace()      ← workspace bootstrap + members
              ├── useWeddingData()    ← all mutations + stats
              └── useSync()           ← debounced save + realtime
                    │
                    ├── shared/components/
                    │     ├── AuthPanel.tsx
                    │     ├── Header.tsx
                    │     └── CollapsibleSection.tsx
                    │
                    └── features/
                          ├── collaborators/CollaboratorsSection.tsx
                          ├── tasks/TasksSection.tsx
                          ├── vendors/VendorsSection.tsx
                          ├── guests/GuestsSection.tsx
                          ├── budget/BudgetSection.tsx
                          ├── tables/ (TablesSection, TableCanvas, GuestSidebar, TableEditor)
                          └── data-export/JsonSection.tsx
```

Feature sections are **pure presentational components** — they receive typed props from `App.tsx` and never touch Supabase directly. All state lives in the three hooks.

---

### State Architecture

| Hook | Owns | Talks to Supabase? |
|---|---|---|
| `useWeddingData` | `WeddingData` object, all mutations, `WeddingStats` memo | No — pure local state |
| `useWorkspace` | `workspaceId`, `role`, `members`, loading/error | Yes — workspace bootstrap + member CRUD |
| `useSync` | `syncState`, debounce timer, realtime subscription, conflict queue | Yes — save + subscribe |

`useWeddingData` tracks which JSONB domains are dirty in a `dirtyDomains: Set<WeddingDomain>` set. `useSync` watches that set, triggers the debounced save, and passes only the dirty domains to `updateWorkspace` — so unchanged columns are never written.

---

### Realtime Sync & Conflict Strategy

```
User edits → dirtyDomains.add(domain)
                ↓
         debounce 280ms
                ↓
         updateWorkspace(dirtyDomains)  ──→  DB write (dirty cols only)  ──→  updated_at returned
                                    │
                              postgres_changes event emitted
                                    │
                   ┌────────────────┴────────────────┐
                   │ hasPendingSave?                  │
                  YES                                NO
                   │                                  │
          queue the update               apply immediately
          show "waiting" notice          clear pending save
                   │
          save completes
                   │
          apply queued update
```

If a save fails, `useSync` rolls back to the last known server snapshot.

---

### Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│  weddings                                                     │
│                                                              │
│  id               uuid PK                                    │
│  owner_user_id    uuid                                       │
│  meta             jsonb  ← WeddingMeta                       │
│  tasks            jsonb  ← Task[]                            │
│  guests           jsonb  ← Guest[]                           │
│  vendors          jsonb  ← Vendor[]                          │
│  budget           jsonb  ← BudgetItem[]                      │
│  tables           jsonb  ← WeddingTable[]                    │
│  created_at       timestamptz                                │
│  updated_at       timestamptz                                │
└───────────────────────┬──────────────────────────────────────┘
                        │ 1:many
┌───────────────────────▼──────────────────────────────────────┐
│  wedding_members                                              │
│                                                              │
│  id                  uuid PK                                 │
│  wedding_id          uuid FK                                 │
│  user_id             uuid  ← null until invite accepted      │
│  invited_email       text                                    │
│  role                text  ← 'owner' | 'editor'             │
│  status              text  ← 'pending' | 'active'           │
│  invited_by_user_id  uuid                                    │
│  created_at          timestamptz                             │
└──────────────────────────────────────────────────────────────┘
```

All wedding content lives in one `weddings` row. Writes are column-level — only the JSONB domains that changed in a given edit are sent to the database (dirty tracking via `dirtyDomains: Set<WeddingDomain>`).

---

### TypeScript Type Hierarchy

```
constants/enums.ts
  TASK_STATUSES, TASK_PRIORITIES, RSVP_STATUSES,
  VENDOR_STATUSES, TABLE_SHAPES, WORKSPACE_ROLES
         ↓ (typeof X)[number]
types/wedding.ts
  TaskStatus, TaskPriority, RsvpStatus,
  VendorStatus, TableShape, WorkspaceRole
         ↓ used in
  Guest, Task, Vendor, BudgetItem, WeddingTable, WeddingMeta
         ↓ composed into
  WeddingData  ←  single source of truth for all app state
         ↓ alongside
  WeddingMember, WeddingStats, CollapseSignal, SyncState
```

Union types are derived directly from `as const` arrays — the dropdown options and the TypeScript types are always in sync.

---

### Security (RLS Policies)

```
Authenticated user
  │
  ├── Can read weddings where they are an active member
  ├── Can update weddings where they are an active member
  ├── Can read their own wedding_members rows
  │
  └── Owner only:
        ├── Insert new wedding_members (invite)
        └── Delete non-owner wedding_members (remove)

Pending invite:
  └── Can read/update their own pending row (to activate on sign-in)
```

---

## Project Structure

```
src/
├── types/
│   └── wedding.ts              # All shared interfaces and union types
├── constants/
│   └── enums.ts                # Enum arrays — single source of truth
├── lib/
│   └── supabaseClient.ts       # Supabase client init
├── services/
│   └── weddingApi.ts           # All Supabase API calls
├── utils/
│   └── storage.ts              # normalizeData(), downloadJson()
├── context/
│   └── AuthContext.tsx         # Auth session
├── hooks/
│   ├── useWorkspace.ts
│   ├── useSync.ts
│   ├── useWeddingData.ts
│   └── useIsMobile.ts          # Responsive hook — true when viewport ≤ 768px
├── features/
│   ├── ai-chat/AIChatPanel.tsx
│   ├── guests/GuestsSection.tsx
│   ├── tasks/TasksSection.tsx
│   ├── vendors/VendorsSection.tsx
│   ├── budget/BudgetSection.tsx
│   ├── tables/
│   │   ├── TablesSection.tsx   # Desktop: drag canvas; Mobile: read-only list
│   │   ├── TableCanvas.tsx
│   │   ├── GuestSidebar.tsx
│   │   └── TableEditor.tsx
│   ├── collaborators/CollaboratorsSection.tsx
│   ├── workspaces/WorkspacePickerPage.tsx
│   └── data-export/JsonSection.tsx
├── shared/
│   └── components/
│       ├── AuthPanel.tsx
│       ├── Header.tsx
│       └── CollapsibleSection.tsx
├── data/
│   └── defaultWeddingData.json
├── styles/
│   └── app.css
├── App.tsx
└── main.tsx

supabase/
└── schema.sql                  # Tables, triggers, RLS policies
```

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable **email/password** auth under Authentication → Settings.
4. Enable **Realtime** for the `weddings` table under Database → Replication.
5. If you see schema cache errors after running the SQL, run:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

---

## Mobile Layout

On screens ≤ 768px the app switches to a mobile-first layout:

- **Bottom tab bar** — 5 tabs: Home · Guests · Tasks · Budget · More
- **More sheet** — slide-up sheet for Venues, Seating, Collaborators, Export, Refresh, Back to Workspaces, Sign Out
- **AI chat** — floating terracotta button (FAB) in the bottom-right, opens full-screen chat
- **Seating canvas** — replaced with a read-only guest-per-table list on mobile (edit on desktop)
- **Safe area support** — tab bar accounts for iPhone home indicator via `env(safe-area-inset-bottom)`

---

## AI Assistant

The AI Assistant is powered by Claude (claude-haiku) via a Supabase Edge Function. It receives your full wedding data as context and can answer questions about guests, budget, venues, tasks, and more.

### Setup

1. Deploy the Edge Function: `supabase functions deploy ai-chat --no-verify-jwt`
2. Set the Anthropic API key as a secret:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
   ```
3. Get an API key at [console.anthropic.com](https://console.anthropic.com). A paid account with API credits is required (the free evaluation plan does not include API access).

> **Note:** The function is deployed with `--no-verify-jwt` because the newer Supabase publishable key format (`sb_publishable_...`) is not a JWT. Your Supabase RLS policies still protect the data.

---

## Edge Functions (Email Invitations)

To enable invite emails, deploy the `send-invite-email` Edge Function and set your Resend API key:

1. Install the Supabase CLI if not already: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`
3. Set the secret: `supabase secrets set RESEND_API_KEY=re_your_key`
4. Deploy the function: `supabase functions deploy send-invite-email`

Get a free Resend API key at [resend.com](https://resend.com). Invite emails are non-fatal — if the key is not set or the send fails, the invite row is still created and the invitee can sign in normally.

> **Sandbox sender note:** The function uses `onboarding@resend.dev` as the sender, which is Resend's shared sandbox domain. This works immediately without domain verification, but emails may land in spam. For production, [verify your own domain](https://resend.com/docs/dashboard/domains/introduction) and update the `from` field in `supabase/functions/send-invite-email/index.ts`.

---

## Environment Variables

Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

> Use `VITE_SUPABASE_ANON_KEY` — not `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

---

## Running Locally

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
```

Other scripts:

```bash
npm run build      # Type-check + production build → dist/
npm run preview    # Preview the production build locally
npm test           # Run Vitest test suite
npm run test:coverage  # Run tests with coverage report
```

---

## Collaboration Behavior

- The first authenticated user to open the app becomes the **owner** and gets a workspace auto-bootstrapped.
- The owner invites collaborators by email from the Collaborators section.
- Invites are stored as `pending` in `wedding_members`. If the `send-invite-email` Edge Function is deployed and `RESEND_API_KEY` is set, an invitation email is sent automatically; otherwise the invite is silently created without email.
- When an invited user signs in with the exact invited email, their status flips to `active` and they gain editor access.
- Both owners and editors can read and write all wedding data.
- Only the owner can invite or remove members.
- The **Refresh** button manually pulls the latest snapshot (fallback when Realtime is unavailable).

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Vercel detects Vite automatically — no build config needed.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Could not find the table 'public.wedding_members' in the schema cache` | Re-run `supabase/schema.sql`, then `NOTIFY pgrst, 'reload schema';` |
| `new row violates row-level security policy for table "weddings"` | Ensure latest `supabase/schema.sql` is applied — it includes the owner bootstrap select policy |
| Realtime changes not appearing | Confirm Realtime is enabled for `weddings` under Database → Replication in the Supabase dashboard |
| Invite not activating collaborator access | The collaborator must sign in with the exact email that was entered in the invite form |
