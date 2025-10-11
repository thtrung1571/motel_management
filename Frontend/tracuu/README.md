# Tra Cứu Lookup App

This Next.js app powers the `/tracuu` lookup experience, providing a Google-like interface for searching plate numbers, customer names, or CCCD identifiers without requiring authentication.

## Goals
- Deliver a standalone Next.js app so the existing Vite front end can continue to deploy independently.
- Provide a mobile-first search interface that mirrors Google's simplicity.
- Offer realtime suggestions (maximum five) based on partial input.
- Connect directly to the motel management backend instead of using mock data.

## Implementation Highlights
1. **Project Setup** – Next.js App Router project with Tailwind CSS for rapid UI development.
2. **Design System** – Global font, color palette, and responsive layout that centers the search surface.
3. **Live Data Integration** – Client-side helpers call the backend's `/api/public/lookup` endpoints for suggestions and customer details.
4. **UI Components** – Search form with autosuggest dropdown, loading states, and customer detail card with visit history.
5. **Result States** – Display success (record found with customer highlights) or empty-state messaging when no match exists.
6. **Operational Notes** – Public lookup endpoints are throttling-ready; secure deployment should still consider rate limiting/logging.

## Environment Variables
Create a `.env.local` file and configure the backend base URL if it differs from the default:

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api/public"
```

## Local Development
```bash
npm install
npm run dev
```

The development server listens on `http://localhost:3000`.

## Next Steps
- Add error boundaries and toast notifications for network failures.
- Extend the public API to include additional summary fields when needed (e.g., outstanding balances).
- Consider edge caching or in-memory memoization for frequent lookups to reduce latency.
