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

## Deployment Checklist
To run the lookup flow against the real database you need to ship **both** the new Next.js front end _and_ the backend updates
introduced in `backend/src/controllers/publicLookupController.js` and `backend/src/routes/public.routes.js`.

1. Deploy the backend first so the `/api/public/lookup` and `/api/public/suggest` endpoints are available.
2. Confirm the backend `.env` contains the required database connection secrets.
3. Deploy the Next.js app and configure `NEXT_PUBLIC_API_BASE_URL` to point at the freshly updated backend.

### Production build and hosting

1. Install dependencies and build the production bundle:

   ```bash
   npm install
   npm run build
   ```

2. Start the production server with Node.js:

   ```bash
   npm run start
   ```

   This runs `next start`, which serves the compiled app from the `.next` directory—no custom `server.js` is required unless you need bespoke routing or middleware.

3. When deploying to a platform such as Vercel, Netlify, Render, or a self-hosted Node server, point the process manager (PM2, systemd, Docker, etc.) at `npm run start` and ensure `NODE_ENV=production` and `NEXT_PUBLIC_API_BASE_URL` are exported.

4. If you are containerizing, copy the project files, run `npm install --production` followed by `npm run build`, and expose port `3000` (or set `PORT` to whichever port your platform expects).

### Deploying on traditional web hosting

Some shared web hosts (cPanel, DirectAdmin, etc.) only allow you to upload static assets (HTML/CSS/JS) without running a Node.js
process. In that scenario you can still host the lookup app by exporting it as a static bundle and letting the browser call the
backend API directly:

1. Generate an optimized static build:

   ```bash
   npm install
   npm run build
   npm run export
   ```

   This creates an `out/` directory containing pre-rendered HTML and bundled assets.

2. Upload the contents of `out/` to your hosting provider's public web root (for example, `public_html/tracuu`). Be sure to copy
   the nested `_next/` folder as well.

3. Update your DNS or create a subdirectory/redirect so `https://site.com/tracuu` serves the uploaded files.

4. Because the app still calls the backend at runtime, ensure the browser can reach your API by setting
   `NEXT_PUBLIC_API_BASE_URL` **before** running `npm run build`. The value you set is baked into the exported assets.

5. If your host supports environment variables or `.htaccess` rewrites, you can configure caching headers for `_next/static` to
   improve performance, but avoid caching the HTML shell for too long if you plan to redeploy frequently.

> **Note:** Static export removes server features like `app/api` routes and server actions. Those are not used in this lookup UI,
> so the exported bundle will continue to fetch live data from your existing backend endpoints.

## Next Steps
- Add error boundaries and toast notifications for network failures.
- Extend the public API to include additional summary fields when needed (e.g., outstanding balances).
- Consider edge caching or in-memory memoization for frequent lookups to reduce latency.
