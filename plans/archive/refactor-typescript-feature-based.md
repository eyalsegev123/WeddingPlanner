# Refactor Plan: Senior-Level TypeScript + Feature-Based Architecture

## Context
The codebase is a working React 18 + Vite + Supabase wedding planner with solid logic but needs structural cleanup.
Main problems: App.jsx is 615 lines doing too much, no TypeScript, flat folder structure with no domain meaning,
status enums duplicated across files, and `window.alert/confirm` for errors.

Goal: TypeScript migration + feature-based folder structure + clean separation of concerns. No behavior changes.

---

## Target Folder Structure

```
src/
├── types/
│   └── wedding.ts             ← all shared interfaces + union types
├── constants/
│   └── enums.ts               ← TASK_STATUSES, RSVP_STATUSES, etc. (single source of truth)
├── lib/
│   └── supabaseClient.ts      ← unchanged logic, typed
├── services/
│   └── weddingApi.ts          ← unchanged logic, fully typed
├── utils/
│   └── storage.ts             ← unchanged logic, typed (imports from constants/)
├── context/
│   └── AuthContext.tsx        ← unchanged logic, typed
├── hooks/
│   ├── useWorkspace.ts        ← workspace load, members, invite/remove
│   ├── useSync.ts             ← debounced save + realtime subscription
│   └── useWeddingData.ts      ← all mutations (addGuest, patchTask, etc.)
├── features/
│   ├── guests/
│   │   └── GuestsSection.tsx
│   ├── tasks/
│   │   └── TasksSection.tsx
│   ├── vendors/
│   │   └── VendorsSection.tsx
│   ├── budget/
│   │   └── BudgetSection.tsx
│   ├── tables/
│   │   └── TablesSection.tsx
│   ├── collaborators/
│   │   └── CollaboratorsSection.tsx
│   └── data-export/
│       └── JsonSection.tsx
├── shared/
│   └── components/
│       ├── AuthPanel.tsx
│       ├── Header.tsx
│       └── CollapsibleSection.tsx
├── data/
│   └── defaultWeddingData.json
├── styles/
│   └── app.css
├── App.tsx                    ← lean composition, ~80 lines
└── main.tsx
```

---

## Step-by-Step Implementation

### Step 1 — TypeScript config
- Add `tsconfig.json` (strict mode, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`)
- Update `vite.config.js` → `vite.config.ts`
- No deps to add — Vite 5 handles TS natively

### Step 2 — Constants (`src/constants/enums.ts`)
Extract all hardcoded enums from `storage.js` into typed `as const` arrays:
```ts
export const TASK_STATUSES = ['Open', 'In Progress', 'Blocked', 'Done'] as const;
export const TASK_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const RSVP_STATUSES = ['Pending', 'Yes', 'No'] as const;
export const VENDOR_STATUSES = ['Researching', 'Shortlisted', 'Booked'] as const;
export const TABLE_SHAPES = ['round', 'rect'] as const;
export const WORKSPACE_ROLES = ['owner', 'editor'] as const;
```

### Step 3 — Types (`src/types/wedding.ts`)
Derive union types from constants. Define all interfaces:
- `RsvpStatus`, `TaskStatus`, `TaskPriority`, `VendorStatus`, `TableShape`, `WorkspaceRole`
- `WeddingMeta`, `Guest`, `WeddingTable`, `Task`, `BudgetItem`, `Vendor`
- `WeddingData`, `WeddingMember`, `WeddingStats`
- `CollapseSignal`, `SyncState`
- `WorkspaceResult` (returned by `getOrCreateWorkspace`)

### Step 4 — Migrate leaf files (no logic changes)
Rename and add types to:
- `lib/supabaseClient.js` → `supabaseClient.ts`
- `utils/storage.js` → `storage.ts` (imports constants from `enums.ts`, types all params/returns)
- `services/weddingApi.js` → `weddingApi.ts` (types all function signatures + return values)
- `context/AuthContext.jsx` → `AuthContext.tsx`

### Step 5 — Extract custom hooks

**`src/hooks/useWorkspace.ts`**
Pulls from App.jsx: `loadWorkspace`, `loadMembers`, `handleInvite`, `handleRemove`
Returns: `{ workspaceId, workspaceRole, members, membersLoading, workspaceLoading, appError, handleInvite, handleRemove }`

**`src/hooks/useSync.ts`**
Pulls from App.jsx: debounced save effect, realtime subscription, queued remote update logic
Params: `(workspaceId, data, onServerState)`
Returns: `{ syncState, statusMessage, hasPendingSave, setStatusMessage }`

**`src/hooks/useWeddingData.ts`**
Pulls from App.jsx: all mutation functions + `stats` useMemo
Returns: `{ data, stats, patchMeta, addGuest, patchGuest, deleteGuest, addTask, patchTask, deleteTask, addVendor, patchVendor, deleteVendor, addBudgetItem, patchBudgetItem, deleteBudgetItem, addTable, patchTable, deleteTable, applyJson, resetAllData }`
- Replace `window.alert()` in `applyJson` → return `{ error: string | null }` instead
- Replace `window.confirm()` in `resetAllData` → accept a `confirmed: boolean` param (caller decides)

### Step 6 — Migrate + move components
Move each component into its feature folder, rename to `.tsx`, add typed props interfaces:
- `components/GuestsSection.jsx` → `features/guests/GuestsSection.tsx`
- `components/TasksSection.jsx` → `features/tasks/TasksSection.tsx`
- `components/VendorsSection.jsx` → `features/vendors/VendorsSection.tsx`
- `components/BudgetSection.jsx` → `features/budget/BudgetSection.tsx`
- `components/TablesSection.jsx` → `features/tables/TablesSection.tsx`
- `components/CollaboratorsSection.jsx` → `features/collaborators/CollaboratorsSection.tsx`
- `components/JsonSection.jsx` → `features/data-export/JsonSection.tsx`
- `components/CollapsibleSection.jsx` → `shared/components/CollapsibleSection.tsx`
- `components/Header.jsx` → `shared/components/Header.tsx`
- `components/AuthPanel.jsx` → `shared/components/AuthPanel.tsx`

Each component gets a typed `Props` interface. Enum options in selects come from `constants/enums.ts`.

### Step 7 — Refactor App.tsx
App becomes lean composition (~80 lines):
```tsx
export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const workspace = useWorkspace(user);
  const weddingData = useWeddingData();
  const sync = useSync(workspace.workspaceId, weddingData.data, weddingData.applyServerState);
  const [collapseSignal, setCollapseSignal] = useState<CollapseSignal>({ mode: null, seq: 0 });
  // loading / error guards, then render sections
}
```

### Step 8 — Fix hardcoded currency
`currency="ILS"` is hardcoded in App.jsx when passing to VendorsSection and BudgetSection.
Fix to read from `data.meta.currency`.

### Step 9 — Update CLAUDE.md
Update project CLAUDE.md to reflect the new TypeScript + feature-based structure.

---

## Files Created (new)
- `tsconfig.json`
- `src/types/wedding.ts`
- `src/constants/enums.ts`
- `src/hooks/useWorkspace.ts`
- `src/hooks/useSync.ts`
- `src/hooks/useWeddingData.ts`

## Files Renamed + Migrated (logic unchanged)
- `src/lib/supabaseClient.js` → `.ts`
- `src/utils/storage.js` → `.ts`
- `src/services/weddingApi.js` → `.ts`
- `src/context/AuthContext.jsx` → `.tsx`
- `src/App.jsx` → `.tsx`
- `src/main.jsx` → `.tsx`
- All 10 components → `.tsx` in new feature/shared paths

## Files Deleted
- `src/components/` directory (replaced by features/ and shared/)
- Old `.js` / `.jsx` source files after rename

---

## Verification
1. `npm run build` — zero TypeScript errors
2. `npm run dev` — app loads, auth works, full CRUD on all sections
3. Realtime: two tabs, same account — edits in one appear in the other
