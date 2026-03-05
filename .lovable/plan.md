

## Plan: Profile Type Dropdown, Reorder Profile Page, and Login Validation Audit

### 1. Reorder Profile Page sections

In `src/pages/ProfilePage.tsx`, move the "Dados Pessoais" Card (currently at line 233-345) to appear **before** the BabyManager component (currently at line 228-231). Simple reorder of JSX blocks.

### 2. Add "Quem e voce?" dropdown to signup form

In `src/pages/AuthPage.tsx`, add a new field below "Confirmar senha" (after line 426):

- Label: "Quem e voce?"
- Type: `<select>` dropdown styled with `input-soft` classes
- Options:
  - Pessoa alergica
  - Mae da pessoa alergica
  - Pai da pessoa alergica
  - Medico(a)
  - Farmaceutico(a)
- New state: `profileType` string
- Validation: required field (add to `validateSignup`)

### 3. Save profile_type on signup

The `profiles` table already has a `profile_type` column. Two changes needed:

**AuthContext.tsx**: Update `signUp` to accept `profileType` parameter and pass it as `user_metadata`:
```typescript
data: { full_name: fullName, profile_type: profileType }
```

**AuthPage.tsx**: Pass `profileType` to `signUp` call.

**Post-signup profile creation**: The profile is created via upsert after login. Need to ensure `profile_type` is saved. Currently the profile is created in `ProfilePage.tsx` `handleSave`. But the better approach: after signup, when the user lands on dashboard, create/update the profile with the `profile_type` from `user.user_metadata`.

Looking at the current flow: `AuthContext.signUp` stores `full_name` in user metadata. The `profiles` table row is created/updated in `ProfilePage.handleSave`. The dashboard fetches from profiles but doesn't create it.

Best approach: Update the `signUp` function to also create the profile row immediately after signup succeeds, including `profile_type`. Or use a database trigger. Since auto-confirm is on, the user is immediately authenticated after signup, so we can insert the profile right after.

**Implementation**: After successful `signUp` in `AuthPage.tsx`, insert a profile row with `user_id`, `full_name`, and `profile_type`. The `signUp` already stores metadata; we'll also do a direct insert.

### 4. Map profileType to existing profile_type values

Current system uses: `mamae`, `papai`, `farmaceutica`, `medico`. The new dropdown options map:

| Dropdown option | profile_type value |
|---|---|
| Pessoa alergica | `alergico` |
| Mae da pessoa alergica | `mamae` |
| Pai da pessoa alergica | `papai` |
| Medico(a) | `medico` |
| Farmaceutico(a) | `farmaceutica` |

Update the personalization logic in Dashboard to handle the new `alergico` type as well.

### 5. Login validation audit

Current login flow analysis:
- Email validated with zod email schema
- Password only checks for non-empty (no min length check on login -- correct, since validation is server-side)
- `signIn` calls `supabase.auth.signInWithPassword` which returns proper errors
- Error handling maps "Invalid login credentials" to Portuguese
- Auto-confirm is enabled, so no email verification step
- Redirect to `/dashboard` on success

**Identified issues**:
- The "Esqueci minha senha" link is just `href="#"` -- non-functional. No password reset flow exists.
- No `/reset-password` route exists.

I will report this finding to the user but not implement password reset unless requested.

### Files to modify

| File | Change |
|---|---|
| `src/pages/ProfilePage.tsx` | Move Dados Pessoais Card above BabyManager |
| `src/pages/AuthPage.tsx` | Add profile type dropdown to signup form, save profile on signup |
| `src/contexts/AuthContext.tsx` | Add profileType param to signUp |
| `src/pages/Dashboard.tsx` | Handle `alergico` profile type in personalization |

### Login issues to report

- "Esqueci minha senha" link is non-functional (href="#")
- No password reset page (`/reset-password`) exists

