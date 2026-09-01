# RoadTag

RoadTag is a local-only license plate spotting game for road trips. Players mark U.S. states, Washington D.C., U.S. territories, and Canadian provinces when they see those jurisdictions on vehicle plates.

This app does not create, reproduce, scan, photograph, or imitate license plates. It is a checklist and map-based travel game. There is no camera, GPS, OCR, analytics, advertising, user accounts, or backend.

## Features

- Multiple trips stored only in IndexedDB on the device
- Selectable packs: 50 U.S. states, Washington D.C., five U.S. territories, and Canada
- One-tap spotting with snackbar undo, notes, and recent sightings
- Interactive U.S. SVG map with pinch-zoom, Alaska/Hawaii insets, and a Northeast callout
- Pack totals and an overall total (no featured hero score)
- Installable PWA with an update prompt, not a mid-game reload
- JSON export/import, including Web Share on Android
- Light, dark, high-contrast, and reduced-motion settings
- Cloudflare Pages + Cloudflare Access deployment notes for private hosting

## Technology

- React 19 and TypeScript (strict)
- Vite 7
- `vite-plugin-pwa` with `registerType: "prompt"`
- `idb` for IndexedDB
- Plain CSS
- Vitest, React Testing Library, `fake-indexeddb`
- ESLint and Prettier

Jurisdiction data is bundled TypeScript in `src/data`. The app never fetches pack data at runtime.

## Local prerequisites

- Node.js 20 or newer (Node 20 is the documented Cloudflare Pages target; Node 22 is fine locally)
- npm 10 or newer

## Installation

```bash
git clone https://github.com/Newelld19/RoadTag.git
cd RoadTag
npm install
npm run icons
```

`npm run icons` resizes `RoadTag.png` into the PWA icons under `public/`.

## Local development

```bash
npm run dev
```

Open the printed localhost URL. The service worker is disabled in development.

## Testing

```bash
npm run test        # watch
npm run test:run    # single run
npm run typecheck
npm run lint
npm run format:check
```

## Production build

```bash
npm run build
npm run preview
```

`npm run build` runs typecheck, lint, and tests, then Vite. Cloudflare Pages should use the same command so tests run before a deploy.

The production service worker precaches the built app shell and bundled assets. It does not use runtime caching, so Cloudflare Access login pages, redirects, and non-200 responses are not stored. `registerType: "prompt"` shows an in-app “Update available” message instead of reloading during a trip.

## PWA installation on Android Chrome

1. Deploy the site (or use `npm run preview` over HTTPS / localhost).
2. Sign in through Cloudflare Access if the host is protected.
3. Open RoadTag in Chrome.
4. Wait until the app shell loads once while online.
5. Chrome menu → **Add to Home screen** / **Install app**.
6. Open the installed RoadTag. Confirm it runs in standalone mode.
7. Turn on airplane mode and confirm trips still open.

## Offline behavior

After the first successful authenticated load:

- The app shell, icons, map, and jurisdiction data are available offline
- Trip data stays in IndexedDB and is not erased by a service-worker update
- If IndexedDB is missing or the quota is full, RoadTag shows a friendly error instead of crashing
- Changes save immediately; a small “Saved” hint appears

RoadTag never claims that data is synced to the cloud.

## Local data and backup warning

Deleting site data, clearing Chrome storage, or uninstalling the PWA can delete every trip on that device. Export a JSON backup from Settings or from a trip’s details screen. On Android, export uses Web Share when the browser supports it.

## Private GitHub repository

Remote: `https://github.com/Newelld19/RoadTag.git`

```bash
git init
git add .
git commit -m "Initial RoadTag app"
git branch -M main
git remote add origin https://github.com/Newelld19/RoadTag.git
git push -u origin main
```

Do not commit `.env` files, Cloudflare tokens, account IDs, or email addresses.

## Cloudflare Pages deployment

1. Create a private GitHub repository if it does not already exist (`Newelld19/RoadTag`).
2. Push `main`.
3. In Cloudflare, open **Workers & Pages**.
4. Create a Pages application and connect the private GitHub repository.
5. Limit the Cloudflare GitHub App’s repository access to this repository.
6. Production branch: `main`
7. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
8. No runtime environment variables are required.
9. Deploy and open the generated `pages.dev` URL.
10. Optional: attach a custom domain managed by Cloudflare.
11. Verify HTTPS, `/manifest.webmanifest`, service-worker registration, installation, and airplane-mode use.

## Cloudflare Access

A private GitHub repository does **not** make the Pages URL private. Protect the production hostname with Cloudflare Zero Trust / Cloudflare Access:

- Protect the entire production hostname
- Allow only your email address
- Use email one-time PIN or another identity provider
- Deny everyone else
- Choose a session duration that fits a personal travel app
- Test in a private/incognito window
- Access protects _online_ visits. It cannot stop someone who already has the unlocked phone from opening locally cached PWA data
- Preview deployments may need a separate Access policy
- If `pages.dev` cannot be protected in your plan, put the app on a custom domain and protect that hostname

Do not put credentials, access tokens, account IDs, or email addresses in the repository.

## Updating the deployed app

Push to `main`. After Pages builds, open RoadTag while online. When a new version is waiting, RoadTag shows **Update available**. Confirm the update when you are not mid-spotting. The page reloads only after that confirmation.

## Troubleshooting

- **Install button missing:** the site must be HTTPS (or localhost), the manifest must load, and icons must be present.
- **Offline start fails:** open the app once after Access login so the service worker can cache a 200 HTML response, not a login redirect.
- **Storage error:** export a backup, free space, and avoid private-browser modes that drop IndexedDB.
- **Map missing:** the checklist still works. Confirm `src/assets/us-map.svg` is in the build.
- **`npm audit`:** run `npm audit`. Do not apply breaking upgrades automatically; review each advisory.

## Map source and license

The U.S. map is [Blank US Map (states only).svg](<https://commons.wikimedia.org/wiki/File:Blank_US_Map_(states_only).svg>) by Heitordp, dedicated to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). A local copy lives at `src/assets/us-map.svg`. Attribution is also in `public/map/ATTRIBUTION.txt`.

Alaska and Hawaii are insets in that file. Territories and Canada use lists, not a second map.

## Security notes

- No `dangerouslySetInnerHTML`
- Imported JSON is untrusted: schema-checked, sanitized, length-limited
- User text is rendered as text, never HTML
- No unnecessary browser permissions except the optional Screen Wake Lock setting
- `.gitignore` excludes `node_modules`, `dist`, and env files
