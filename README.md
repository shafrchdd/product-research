# Product Lab — Product Research & Validation

A mobile-first, static product research workspace. No backend or build step is required.

## Features
- Product idea pipeline with search, status filters and sorting
- 10-factor opportunity scoring (0–100)
- Problem, audience, competitor, solution, pricing and channel research fields
- Validation evidence: interviews, leads, buyers, conversion and proof checkboxes
- Dashboard, validation tracker and research insights
- JSON backup export and import

## Data storage
The app stores products in the browser's `localStorage` on the device/browser where you use it. Data is **not automatically synced** between devices or users. Use Export backup regularly and Import backup to move data.

## Run locally
Open `index.html` in a modern browser, or serve this folder with any static HTTP server.

## GitHub Pages
A GitHub Actions workflow is included at `.github/workflows/pages.yml`. Enable GitHub Pages in repository Settings → Pages and select **GitHub Actions** as the build and deployment source. The repository must meet GitHub Pages eligibility for its visibility/plan. The workflow publishes the root directory after a push to `main`.

## Scoring note
The opportunity score is a prioritisation aid, not proof of demand. Validate with customer conversations and real purchase commitments before building.
