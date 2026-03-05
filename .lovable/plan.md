

## Plan: Fix Bottom Nav Overlap, Add "Início" Tab, and Adjust Chat Widget

### Problem Summary

1. **Bottom nav overlaps sidebar logout button** -- the drawer sidebar's "Sair" button is hidden behind the fixed bottom nav (z-50).
2. **Missing "Início" (Home) tab** -- user wants a Home tab in the bottom nav showing news cards, an image carousel, and top items across all modules.
3. **Chat widget overlaps bottom nav on mobile** -- the mascot button sits at `bottom-5` which collides with the bottom nav at `bottom-4`.

### Changes

#### 1. Fix sidebar overlap (Sidebar.tsx)

Add `pb-20` to the drawer sidebar container so the logout button scrolls above the bottom nav area. The drawer already has `overflow-y-auto`, so adding bottom padding ensures the "Sair" button is reachable.

#### 2. Add "Início" tab to BottomNav (BottomNav.tsx)

Add a new `Home` icon tab as the first item. Update the `ModuleType` to include `"home"`. Shift all existing module indexes by 1.

#### 3. Create Home content section (Dashboard.tsx)

When `activeModule === "home"`:
- **News cards section** -- placeholder cards for news/announcements (can be populated later from a database table)
- **Image carousel** -- reusable carousel component using `embla-carousel-react` (already installed) with placeholder images, configurable later
- **Top items preview** -- show top 3 from each module (medications, products, restaurants) with quick links

The home module will be the default active module.

#### 4. Move Chat Widget up on mobile (ChatWidget.tsx)

Change the mascot button position from `bottom-5` to `bottom-20` (and the panel similarly) so it sits above the bottom nav on mobile. On desktop (`lg:`), keep it at `lg:bottom-6`.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/BottomNav.tsx` | Add "Início" tab with `Home` icon as first item, update types |
| `src/pages/Dashboard.tsx` | Add home content rendering, change default module to "home" |
| `src/components/ChatWidget.tsx` | Increase `bottom` value to clear bottom nav on mobile |
| `src/components/Sidebar.tsx` | Add `pb-20` to drawer mode container |

### New File

| File | Purpose |
|------|---------|
| `src/components/HomeContent.tsx` | Home tab content: news cards, image carousel, top items |

### Technical Notes

- The `embla-carousel-react` package is already installed, so the carousel needs no new dependencies.
- News cards will initially be static/placeholder -- a database table can be added later when the user wants dynamic content.
- The image carousel will use placeholder images initially, with a structure ready for admin-configurable images from storage.

