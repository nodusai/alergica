

## Plan: Fix missing type definitions causing build errors

The `profiles` table was extended with 5 new columns via migration (`birth_date`, `gender`, `city`, `state`, `profession`) but the auto-generated `types.ts` was never refreshed. This causes TypeScript errors in two files that use these columns without type casts.

### Root cause

The file `src/integrations/supabase/types.ts` defines the `profiles` table with only: `avatar_url`, `child_name`, `created_at`, `full_name`, `id`, `profile_type`, `updated_at`, `user_id`. The 5 extra columns from migration `20260308000000_add_profile_demographics.sql` are missing.

### Files to fix

| File | Issue | Fix |
|---|---|---|
| `src/integrations/supabase/types.ts` | Missing `birth_date`, `gender`, `city`, `state`, `profession` in profiles Row/Insert/Update | Add the 5 columns to all three type blocks (Row, Insert, Update) |
| `src/pages/AuthPage.tsx` | Upsert at line 190-198 passes extra fields that don't exist on the typed Insert | Will be fixed automatically once types.ts is updated |

### Changes to `types.ts` — profiles section

Add to `Row`:
- `birth_date: string | null`
- `gender: string | null`
- `city: string | null`
- `state: string | null`
- `profession: string | null`

Add to `Insert` (all optional):
- `birth_date?: string | null`
- `gender?: string | null`
- `city?: string | null`
- `state?: string | null`
- `profession?: string | null`

Add to `Update` (all optional):
- `birth_date?: string | null`
- `gender?: string | null`
- `city?: string | null`
- `state?: string | null`
- `profession?: string | null`

This is the minimal fix to align types with the database schema and unblock the build.

