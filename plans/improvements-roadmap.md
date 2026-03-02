# WeddingPlanner — Improvements Roadmap

## Context

Five improvements identified after the TypeScript migration:
1. **Test suite** — no tests exist; unsafe for ongoing changes
2. **Email invitations** — invites are silent DB rows; collaborators have no idea they were invited
3. **Tables canvas UX** — guest assignment via chip clicks is unintuitive; drag-onto-table is the natural UX
4. **Write optimization** — all 6 JSONB columns are written on every keystroke; only dirty domains should be sent
5. **Plans cleanup** — stale TS migration plan should be archived

Each initiative ships as its own commit.

---

## Critical Files

| File | Relevant for |
|---|---|
| `src/hooks/useWeddingData.ts` | 1, 4 |
| `src/hooks/useSync.ts` | 4 |
| `src/services/weddingApi.ts` | 2, 4 |
| `src/types/wedding.ts` | 4 |
| `src/App.tsx` | 4 |
| `src/features/tables/TablesSection.tsx` | 3 |
| `src/styles/app.css` | 3 |
| `src/utils/storage.ts` | 1 |
| `supabase/functions/send-invite/index.ts` | 2 (new) |
| `plans/refactor-typescript-feature-based.md` | 5 |

---

## Execution Order & Agent Assignment

```
Batch 1 (parallel):
  ├── Agent A — senior-frontend-engineer: Test suite (commit: "test: add Vitest suite...")
  └── Agent B — senior-frontend-engineer: Tables canvas drag UX (commit: "feat: drag guests onto tables...")

Batch 2 (after Batch 1 — touches useWeddingData + useSync + weddingApi + types + App.tsx):
  └── Agent C — senior-frontend-engineer: Write optimization (commit: "perf: column-level dirty tracking...")

Batch 3 (after Batch 2 — touches weddingApi.ts again + new Edge Function):
  └── Agent D — senior-backend-engineer: Email invitations (commit: "feat: send invite emails via Resend...")

Cleanup (inline — trivial):
  └── Archive stale plan file (commit: "chore: archive completed TS migration plan")
```

---

## Initiative 1 — Test Suite (Agent A)

### Setup
- Install: `vitest`, `@testing-library/react`, `jsdom`, `@vitest/coverage-v8`
- Add `vitest.config.ts` with `environment: 'jsdom'`, `globals: true`
- Add `"test": "vitest"` and `"test:coverage": "vitest run --coverage"` to `package.json`

### Tests: `src/utils/storage.test.ts` (pure function, no mocking)
- `normalizeData(null)` / `normalizeData(undefined)` → returns valid default structure
- `normalizeData({})` → all fields fall back to defaults
- Invalid enum values (`rsvp: 'Maybe'`) → coerced to `'Pending'`
- Legacy `couple: 'Alice & Bob'` → split into `partnerOne`/`partnerTwo`
- Duplicate guest IDs across tables → deduplicated
- `x`/`y` out of range → clamped to `[6,94]` / `[8,92]`
- `createId('guest')` → string starting with `'guest-'`

### Tests: `src/hooks/useWeddingData.test.ts` (renderHook from @testing-library/react)
- `addGuest` → guest in `data.guests` with generated id
- `deleteGuest` → removed from `data.guests` AND from all `table.guestIds`
- `patchTask` → only that task updates; others unchanged
- `applyJson(validJson)` → `{ error: null }`, data updated
- `applyJson('invalid{')` → `{ error: '...' }`, data unchanged
- `resetAllData(false)` → noop
- `resetAllData(true)` → data reset to default
- `stats.rsvpCompletion` → correct % after adding guests with rsvp='Yes'

### Commit
```
test: add Vitest suite for storage utilities and useWeddingData hook
```

---

## Initiative 2 — Email Invitations via Resend (Agent D)

### Architecture
```
Owner clicks Invite
  → weddingApi.inviteMember()   (existing: insert pending row)
  → supabase.functions.invoke('send-invite', { body: { email, weddingTitle, appUrl } })
  → Edge Function → Resend API → email delivered to invitee
```

### Edge Function: `supabase/functions/send-invite/index.ts`
- Deno runtime; reads `RESEND_API_KEY` from `Deno.env.get`
- Email subject: `"You've been invited to plan [title]!"`
- Body: app URL + instructions to sign up with this exact email address
- `appUrl` passed from client (`window.location.origin`)

### `weddingApi.ts` — update `inviteMember`
- After successful `.insert()`, call `supabase.functions.invoke('send-invite', { body: {...} })`
- Edge Function failure is non-fatal: log warning, don't throw (invite row already exists)
- New signature:
  ```ts
  inviteMember({ weddingId, email, invitedByUserId, weddingTitle, appUrl })
  ```

### `useWorkspace.ts` caller change
- Pass `meta.title` and `window.location.origin` to `inviteMember`

### Docs addition (README.md)
```bash
supabase secrets set RESEND_API_KEY=re_...
supabase functions deploy send-invite
```

### Commit
```
feat: send invite emails via Resend Edge Function
```

---

## Initiative 3 — Tables Canvas: Drag Guests onto Tables (Agent B)

### New layout
```
┌─────────────────┬──────────────────────────────────┐
│  Unassigned     │        Floor Plan Canvas          │
│  Guests         │                                   │
│  ─────────      │   ○ Table 1    ○ Table 2          │
│  [Alice] ⋮      │                                   │
│  [Bob]   ⋮      │        ○ Table 3                  │
└─────────────────┴──────────────────────────────────┘
```

### Drag mechanics — native HTML5 (no new library)
- Guest chips: `draggable={true}`, `onDragStart` → `dataTransfer.setData('guestId', id)`
- Table nodes: `onDragOver={e => e.preventDefault()}`, `onDrop` → read `guestId` → `onPatchTable(tableId, { guestIds: [...existing, guestId] })`
- Highlight on `onDragEnter` (CSS class `drag-over`), clear on `onDragLeave`/`onDrop`
- Capacity enforcement already handled by `patchTable` in `useWeddingData`

### Component split (current file is already ~230 lines)
- `TablesSection.tsx` — layout shell, shared state (selectedTableId, form state)
- `TableCanvas.tsx` — canvas + table node rendering + pointer drag-to-move + HTML5 drop targets
- `GuestSidebar.tsx` — unassigned guest chips (draggable)
- `TableEditor.tsx` — selected-table editor panel (existing chip click-to-toggle + fields)

### Key derived value
```ts
const unassignedGuests = guests.filter(g => !tables.some(t => t.guestIds.includes(g.id)));
```

### CSS additions (`src/styles/app.css`)
- `.tables-layout` — `display: flex; gap: 16px; align-items: flex-start`
- `.guest-sidebar` — `width: 160px; flex-shrink: 0; overflow-y: auto`
- `.scene-table.drag-over` — highlight ring (e.g. `box-shadow: 0 0 0 3px var(--accent)`)
- `.guest-chip[draggable]` — `cursor: grab`

### Commit
```
feat: drag guests onto tables in seating canvas
```

---

## Initiative 4 — Write Optimization: Column-Level Dirty Tracking (Agent C)

### New type (`src/types/wedding.ts`)
```ts
export type WeddingDomain = keyof WeddingData;
// 'meta' | 'guests' | 'tables' | 'tasks' | 'budget' | 'vendors'
```

### `useWeddingData.ts` changes
- Internal state: `dirtyDomains: Set<WeddingDomain>` (replaces boolean)
- `hasPendingSave` derived: `dirtyDomains.size > 0`
- `mutateData(updater, domains: WeddingDomain[])` marks those domains dirty
- Domain assignments per mutation:
  - `patchMeta` → `['meta']`
  - `addGuest / patchGuest` → `['guests']`
  - `deleteGuest` → `['guests', 'tables']` (cascades)
  - `addTask / patchTask / deleteTask` → `['tasks']`
  - `addBudgetItem / patch / delete` → `['budget']`
  - `addVendor / patch / delete` → `['vendors']`
  - `addTable / patchTable / deleteTable` → `['tables']`
  - `applyJson` / `resetAllData` → all 6
- `clearPendingSave()` → clears the set
- Hook return: expose `dirtyDomains: ReadonlySet<WeddingDomain>`

### `WeddingDataHook` interface update
```ts
dirtyDomains: ReadonlySet<WeddingDomain>;
// hasPendingSave stays for existing useSync contract
```

### `useSync.ts` changes
- Accepts `dirtyDomains: ReadonlySet<WeddingDomain>` (new param replacing `hasPendingSave`)
- Derives `hasPendingSave` internally from `dirtyDomains.size > 0`
- Passes `dirtyDomains` to `updateWorkspace`

### `weddingApi.ts` — `updateWorkspace` signature
```ts
export async function updateWorkspace(
  weddingId: string,
  nextData: WeddingData,
  domains?: ReadonlySet<WeddingDomain>,
): Promise<ServerStatePayload>
```
- With `domains`: build `{ [d]: clean[d] }` for only those keys
- Without `domains`: send all 6 (safety fallback)

### `App.tsx` — pass `dirtyDomains` to `useSync`

### Commit
```
perf: column-level dirty tracking — only write changed JSONB domains
```

---

## Initiative 5 — Plans Cleanup (inline)

- `mkdir -p plans/archive`
- `mv plans/refactor-typescript-feature-based.md plans/archive/`

### Commit
```
chore: archive completed TypeScript migration plan
```

---

## Verification

| Initiative | How to verify |
|---|---|
| Tests | `npm test` — all green; `npm run typecheck` — zero errors |
| Email invitations | Invite test email; check Resend dashboard for delivery log |
| Tables drag | `npm run dev`; drag guest chip onto canvas table; confirm seating assigned |
| Write optimization | Network inspect Supabase `.update()` — only dirty column keys in payload |
| Plans cleanup | `ls plans/` — clean root; `ls plans/archive/` — stale plan present |

Final gate: `npm run build` — zero TypeScript errors.