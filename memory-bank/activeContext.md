# Active Context

Current focus:
- Initialize and populate the Memory Bank with accurate, code-derived context.
- Document backend API endpoints and align frontend services.
- Implement public, auth-free lookup page `/tracuu` (mobile-friendly) using public APIs.

Recent observations:
- Backend: Express + Sequelize (MySQL), rich domain: rooms, rentals, customers, drinks, shifts, users.
- Frontend: React + Vite + MUI + Redux Toolkit, API services per domain.
- Pricing logic centralized in `priceCalculationService` (backend).

Next steps:
- Verify running instructions for backend and frontend (env vars, ports).
- Resolve endpoint mismatches (rooms/types, settings/prices vs price-logic, auth profile/password).
- Add missing frontend services/methods (shifts, users, rentals details/stats, customers related/car lookup).
- Document pricing rules and edge cases by reading `priceCalculationService.js`.
- Capture auth flow (login response, token storage) and protected routes.

Decisions & preferences:
- Keep business logic in services, keep controllers thin.
- Maintain one Redux slice per domain; API services mirror backend routes.
- Update Memory Bank after any significant change to features or architecture.
