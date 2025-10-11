# Tra Cứu Lookup App

This Next.js app powers the `/tracuu` lookup experience, providing a Google-like interface for searching plate numbers, customer names, or CCCD identifiers without requiring authentication.

## Goals
- Deliver a standalone Next.js app so the existing Vite front end can continue to deploy independently.
- Provide a mobile-first search interface that mirrors Google's simplicity.
- Offer realtime suggestions (maximum five) based on partial input.
- Keep the API surface simple: use mock data locally, ready to swap with a real data source.

## Implementation Plan
1. **Project Setup** – Initialize a Next.js App Router project with Tailwind CSS for rapid UI development.
2. **Design System** – Configure global font, color palette, and responsive layout that centers the search surface.
3. **Search Data Layer** – Implement in-memory sample data with helper utilities for filtering and matching plate/name/CCCD.
4. **UI Components** – Build a search form with autosuggest dropdown, search history placeholders, and clear call-to-action.
5. **Server Actions** – Use server actions to simulate querying the dataset; structure the API to easily integrate real lookups.
6. **Result States** – Display success (record found with customer highlights) or empty-state messaging when no match exists.
7. **Operational Notes** – Document how to extend with rate limiting, logging, or captcha should deployment require it later.

## Local Development
```bash
npm install
npm run dev
```

The development server listens on `http://localhost:3000`.

## Next Steps
- Swap the mock dataset with calls to the production lookup API once available.
- Add instrumentation (analytics, logs) once the unauthenticated endpoint is exposed beyond localhost.
- Consider edge caching for frequent lookups to reduce latency.
