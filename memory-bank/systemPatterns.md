# System Patterns

Architecture:
- Frontend: React + Vite single-page app with routing and Redux Toolkit for state.
- Backend: Node.js + Express REST API with controllers, routes, middleware, and services.
- Data: MySQL via Sequelize ORM (`backend/src/config/database.js`).

Backend structure (observed):
- `controllers/`: request handling (e.g., rentals, rooms, customers, drinks, settings, dashboard, auth).
- `routes/`: REST endpoints per resource; `index.js` composes routers.
- `middleware/`: auth (JWT), validation, logging, error handling, uploads (multer).
- `models/`: Sequelize models (Room, RoomType, Rental, Customer, Drink, Shift, User, PriceLogic).
- `services/`: pricing (`priceCalculationService`), and supporting logic artifacts.

Frontend structure (observed):
- `src/store/slices/*`: Redux slices per domain (auth, room, rental, customer, drink, settings, dashboard, user).
- `src/services/*`: Axios API clients per resource.
- `src/routes/index.jsx`: app routing; `src/components/*` for UI; MUI components used.

Cross-cutting concerns:
- Auth: JWT-based, stored client-side; protected routes; backend `authMiddleware`.
- Pricing: encapsulated in a dedicated service; deterministic calculations.
- Validation and error handling centralized via middleware.

