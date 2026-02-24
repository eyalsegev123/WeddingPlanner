# WeddingPlanner — Project Config

## Stack
- **React 18** + **Vite 5** + **TypeScript** (strict mode)
- **Supabase** for backend (auth, realtime DB, Postgres JSONB)
- No test framework configured yet

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
│   └── useSync.ts          # Debounced save + realtime subscription
├── features/
│   ├── guests/             # GuestsSection.tsx
│   ├── tasks/              # TasksSection.tsx
│   ├── vendors/            # VendorsSection.tsx
│   ├── budget/             # BudgetSection.tsx
│   ├── tables/             # TablesSection.tsx
│   ├── collaborators/      # CollaboratorsSection.tsx
│   └── data-export/        # JsonSection.tsx
├── shared/components/      # AuthPanel, Header, CollapsibleSection
├── App.tsx                 # Lean composition (~120 lines)
└── main.tsx
public/         # Static assets
supabase/       # schema.sql
dist/           # Build output (gitignored)
plans/          # Implementation plan .md files
```

## Scripts
```bash
npm run dev        # Start Vite dev server
npm run build      # tsc + vite build → dist/
npm run typecheck  # tsc --noEmit (type check only)
npm run preview    # Preview production build
```

## Key Notes
- Env vars required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Data model: one JSONB blob (`meta`, `tasks`, `vendors`, `guests`, `tables`, `budget`) per workspace
- Realtime: Supabase subscriptions + debounced save (280ms) with conflict queue
- `window.alert/confirm` removed — `applyJson` returns `{ error: string | null }`, `resetAllData(confirmed: boolean)`

## Conventions
- All source files are `.ts` / `.tsx` — no `.js` / `.jsx`
- Types live in `src/types/wedding.ts`; enums live in `src/constants/enums.ts`
- Prefer functional React components with hooks; no class components
- Add enum options (selects, options) from `constants/enums.ts` — never hardcode strings inline
- Keep files focused — split if a file grows beyond ~150 lines
- Plans go in `plans/<descriptive-name>.md` before executing
- Update `README.md` after completing new features or significant refactors
