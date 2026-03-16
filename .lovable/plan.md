

## Fix: Build Errors Preventing Pages from Rendering

There are **three groups of build errors** blocking the app:

### 1. ProfilePage.tsx — Missing columns on TypeScript types

The `profiles` table has a migration adding `birth_date`, `gender`, `city`, `state`, `profession` columns, but the auto-generated `types.ts` hasn't been refreshed yet. The code accesses these properties directly on the typed response, causing TS errors.

**Fix**: Cast the `data` response to `Record<string, unknown>` before accessing the extra fields, so TypeScript doesn't complain about properties not in the stale type definition.

Also fix the `handleSave` upsert call (lines 132-145) which passes these same fields — cast the object to `any` for the extra columns.

### 2. expandable-tabs.tsx — TypeScript errors

Two issues:
- **`transition` type**: The `type: "spring"` is inferred as `string` instead of the literal `"spring"`. Fix by adding `as const` to the transition object.
- **`tab.icon` / `tab.title` on `never`**: TypeScript narrows `tab` to `never` after the `tab.type === "separator"` check because of the `type?: never` definition conflicting with the discriminated union. Fix by using a simpler type guard approach or explicitly typing the non-separator path.

### 3. vite.config.ts — Implicit `any` parameters

The `onError` callbacks have untyped parameters. Fix by adding explicit types (`any`) to `_err`, `_req`, `res`.

### Files to modify

| File | Change |
|---|---|
| `src/pages/ProfilePage.tsx` | Cast profile data to `Record<string, unknown>` for extra fields |
| `src/components/ui/expandable-tabs.tsx` | Add `as const` to transition, fix tab type narrowing |
| `vite.config.ts` | Add explicit `any` types to onError params |

