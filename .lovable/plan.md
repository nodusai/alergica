

## Plan: Five UI adjustments across Profile, Dashboard, Index, and BottomNav

### 1. Show profile_type on Profile page (`src/pages/ProfilePage.tsx`)

Below the email field (after line 273), add a read-only field showing the user's profile type with a friendly label mapping (`mamae` → "Mãe da pessoa alérgica", etc.). This requires:
- Fetching `profile_type` from the profiles table (add to the existing fetch query)
- Adding a new disabled input or styled text field between email and phone

### 2. Rename APLV carousel title (`src/components/APLVInfoCarousel.tsx`)

Line 91: Change `"Novidades - Informações sobre APLV"` to `"Novidades - Informações sobre Alergias"`.

### 3. Reduce image carousel size and add admin image management (`src/components/HomeContent.tsx`)

- Change the carousel aspect ratio from `aspect-[16/7]` to `aspect-[16/9]` or smaller (e.g., `aspect-[2/1]`)
- Add an admin-only edit button (visible only when user has `admin` role) that opens a modal to change carousel images. For now, the images are static placeholders; the admin button will be wired to a future storage-based solution. Check admin role via `user_roles` table using the existing `has_role` pattern.

### 4. Fix BottomNav blocking sidebar logout (`src/components/BottomNav.tsx`)

The bottom nav container has `left-0 right-0` which spans the full width, creating an invisible click-blocking layer even though the visible tabs are centered. Fix by adding `pointer-events-none` to the outer container and `pointer-events-auto` to the inner `ExpandableTabs` component.

### 5. Update Index hero text (`src/pages/Index.tsx`)

Replace the current `<p>` tag (lines 34-37) with three lines of text, all in `text-foreground` (darker color, not muted):
- "Eu sou a AlerGica,"
- "a assistente estratégica para sua saúde."
- "Com nossa tecnologia, você consulta produtos e medicamentos, descobrindo alérgenos ocultos, para que você viva com mais segurança."

### Files to modify

| File | Change |
|---|---|
| `src/pages/ProfilePage.tsx` | Add profile_type display field below email |
| `src/components/APLVInfoCarousel.tsx` | Rename title to "Alergias" |
| `src/components/HomeContent.tsx` | Reduce carousel size, add admin image edit button |
| `src/components/BottomNav.tsx` | Fix pointer-events on outer container |
| `src/pages/Index.tsx` | Update hero subtitle text and color |

