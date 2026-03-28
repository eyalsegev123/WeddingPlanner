# WeddingPlanner — Project Config

## Stack
- **React 18** + **Vite 5** + **TypeScript** (strict mode)
- **Supabase** for backend (auth, realtime DB, Postgres JSONB)
- **Vitest** for unit tests (`npm test` / `npm run test:coverage`)

## Project Structure
```
src/
├── types/          # Shared TypeScript interfaces + union types (wedding.ts)
├── constants/      # Enum arrays as const (enums.ts)
├── lib/            # Supabase client (supabaseClient.ts)
├── services/       # Backend API layer (weddingApi.ts)
├── utils/          # Storage helpers: normalizeData, downloadJson (storage.ts)
├── context/        # AuthContext.tsx (Supabase session + user)
├── hooks/
│   ├── useWeddingData.ts   # All data mutations + stats
│   ├── useWorkspace.ts     # Workspace load, members, invite/remove
│   ├── useSync.ts          # Debounced save + realtime subscription
│   └── useIsMobile.ts      # window.innerWidth <= 768 + resize listener
├── features/
│   ├── ai-chat/            # AIChatPanel.tsx (calls ai-chat Edge Function)
│   ├── guests/             # GuestsSection.tsx
│   ├── tasks/              # TasksSection.tsx
│   ├── vendors/            # VendorsSection.tsx (venue comparison table)
│   ├── budget/             # BudgetSection.tsx
│   ├── tables/             # TablesSection (desktop canvas / mobile read-only list), TableCanvas, GuestSidebar, TableEditor
│   ├── collaborators/      # CollaboratorsSection.tsx
│   ├── workspaces/         # WorkspacePickerPage.tsx
│   └── data-export/        # JsonSection.tsx
├── shared/components/      # AuthPanel, Header, CollapsibleSection
├── styles/
│   └── app.css             # Full design system — warm organic palette, mobile tab bar, FAB, bottom sheet
├── App.tsx                 # Composition layer; handles mobile (tab bar) vs desktop layout
└── main.tsx
public/         # Static assets
supabase/
├── schema.sql
└── functions/
    ├── ai-chat/            # Claude AI assistant (claude-haiku, verify_jwt: false)
    └── send-invite-email/  # Invite emails via Resend (verify_jwt: false)
dist/           # Build output (gitignored)
plans/          # Implementation plan .md files
docs/superpowers/specs/  # Approved design specs
```

## Scripts
```bash
npm run dev        # Start Vite dev server
npm run build      # tsc + vite build → dist/
npm run typecheck  # tsc --noEmit (type check only)
npm run preview    # Preview production build
npm test           # Run Vitest suite
npm run test:coverage  # Tests with coverage report
```

## Key Notes
- Env vars required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Data model: one JSONB blob (`meta`, `tasks`, `vendors`, `guests`, `tables`, `budget`) per workspace
- Realtime: Supabase subscriptions + debounced save (280ms) with conflict queue
- Write optimization: `dirtyDomains: Set<WeddingDomain>` in `useWeddingData` — only changed JSONB columns are sent on save
- `window.alert/confirm` removed — `applyJson` returns `{ error: string | null }`, `resetAllData(confirmed: boolean)`
- Edge Functions deployed with `verify_jwt: false` — new Supabase publishable key (`sb_publishable_...`) is not a JWT
- `ANTHROPIC_API_KEY` must be set as a Supabase secret for the AI assistant to work
- Mobile layout: `useIsMobile` (≤ 768px) in `App.tsx` switches to bottom tab bar + More sheet; `TablesSection` renders read-only list on mobile
- Design system: warm organic palette (terracotta `#b85c3a`, sage `#6b8f6e`, parchment `#faf6f0`); fonts: DM Sans body + Cormorant Garamond headings (loaded from Google Fonts in `index.html`)

## Conventions
- All source files are `.ts` / `.tsx` — no `.js` / `.jsx`
- Types live in `src/types/wedding.ts`; enums live in `src/constants/enums.ts`
- Prefer functional React components with hooks; no class components
- Add enum options (selects, options) from `constants/enums.ts` — never hardcode strings inline
- Keep files focused — split if a file grows beyond ~150 lines
- Plans go in `plans/<descriptive-name>.md` before executing
- Update `README.md` after completing new features or significant refactors, and always before pushing changes to remote
