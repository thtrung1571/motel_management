#+ API Endpoints and Frontend Alignment

Base URL: `/api` (mounted in `backend/server.js`)

## Auth
- POST `/auth/login` — Login (public)
- POST `/auth/refresh` — Refresh token (public)
- GET `/auth/create-first-admin` — Bootstrap admin (public)
- GET `/auth/me` — Current user (protected)
- POST `/auth/register` — Create user (admin)

Frontend alignment:
- `Frontend/src/services/authService.js`
  - Uses: `login`, `register` (OK for admin-only context)
  - Extra (backend missing): `updateProfile` → PUT `/auth/profile`, `changePassword` → PUT `/auth/change-password`
  - Missing (backend present): `me`, `refresh` (interceptor calls refresh directly)
- Note: `Frontend/src/api/index.js` interceptor posts to `baseURL + "/api/auth/refresh"` but `baseURL` is undefined in that scope.

## Customers
- GET `/customers/search`
- GET `/customers/search/:id`
- POST `/customers/import` (multipart)
- GET `/customers/related`
- POST `/customers/related`
- DELETE `/customers/related/:id`
- GET `/customers/car/:carNumber`
- GET `/customers`
- GET `/customers/:id`
- POST `/customers`
- PUT `/customers/:id`
- DELETE `/customers/:id`
(All protected)

Frontend alignment:
- `Frontend/src/services/customerService.js`
  - Has: list (with `page`, `limit`, `search`), get by id, create, update, delete, import (OK)
  - Missing: `search` endpoints (separate), `related` CRUD, `car/:carNumber`

## Rentals
- GET `/rentals/related-customers`
- GET `/rentals/estimate-price`
- GET `/rentals/room/:roomId/active`
- GET `/rentals/room/:roomId/history`
- GET `/rentals/active`
- GET `/rentals/history`
- POST `/rentals` (create)
- GET `/rentals/:id`
- PATCH `/rentals/:id/settings`
- POST `/rentals/calculate-checkout`
- POST `/rentals/checkout`
- POST `/rentals/:rentalId/drinks`
- PATCH `/rentals/:rentalId/drinks/:drinkId`
- DELETE `/rentals/:rentalId/drinks/:drinkId`
- POST `/rentals/:rentalId/cars`
- DELETE `/rentals/:rentalId/cars/:carId`
- GET `/rentals/statistics/daily` (admin)
- GET `/rentals/statistics/monthly` (admin)
(All protected)

Frontend alignment:
- `Frontend/src/services/rentalService.js`
  - Has: `getActiveRentals`, `getRentalHistory`, `createRental`, `calculateCheckout`, `checkout`, `addDrinkToRental`, `updateDrinkQuantity`, `deleteDrink`, `updateSettings` (OK)
  - Missing: `getRentalDetails`, room-specific active/history, car add/remove, related-customers, estimate-price, daily/monthly statistics

## Rooms
- GET `/rooms/frequency`
- GET `/rooms`
- PATCH `/rooms/:roomId/status`
- POST `/rooms` (admin)
- PUT `/rooms/:id` (admin)
- DELETE `/rooms/:id` (admin)
- GET `/rooms/history` (admin)
(All protected)

Frontend alignment:
- `Frontend/src/services/roomService.js`
  - Has: `getAllRooms` (OK), `updateRoom` (admin, OK)
  - Extra (backend missing): `getRoomById` → GET `/rooms/:id`
  - Extra (wrong endpoint): `getRoomTypes` → GET `/rooms/types` (room types live under settings)
  - Missing: `updateStatus`, `getFrequency`, `getHistory`

## Drinks
- GET `/drinks`
- GET `/drinks/:id`
- POST `/drinks` (admin)
- PUT `/drinks/:id` (admin)
- DELETE `/drinks/:id` (admin)
- PATCH `/drinks/:id/stock` (admin)
- GET `/drinks/low-stock` (admin)
(Protected; admin where noted)

Frontend alignment:
- `Frontend/src/services/drinkService.js` — Fully aligned; also includes `getActiveDrinks` with query params (backend may ignore filters)

## Settings
- GET `/settings/room-types-prices` (public)
- GET `/settings/room-types` (protected)
- POST `/settings/room-types` (admin)
- PUT `/settings/room-types/:id` (admin)
- DELETE `/settings/room-types/:id` (admin)
- GET `/settings/price-logic` (admin)
- PUT `/settings/price-logic` (admin)

Frontend alignment:
- `Frontend/src/services/settingsService.js`
  - Has: room types CRUD (OK)
  - Mismatch: uses `/settings/prices` for get/update; backend uses `/settings/price-logic`
- `Frontend/src/components/features/settings/LogicPriceSetting.jsx` correctly calls `/settings/price-logic`

## Dashboard
- GET `/dashboard`
- GET `/dashboard/daily-revenue`
- GET `/dashboard/customer-stats`
(Currently public; consider protecting)

Frontend alignment:
- `Frontend/src/services/dashboardService.js` — Fully aligned

## Shifts
- POST `/shifts/start`
- POST `/shifts/end`
- GET `/shifts/current`
- GET `/shifts/current/report`
- GET `/shifts/:shiftId/summary`
- GET `/shifts/all` (admin)
(All protected; restricted to `user`/`admin` as indicated)

Frontend alignment:
- No `shiftService` present

## Users (Admin)
- GET `/users`
- POST `/users`
- PUT `/users/:id`
- DELETE `/users/:id`
(Protected; admin only)

Frontend alignment:
- No `userService` present

## Public
- GET `/public/lookup`
- GET `/public/lookup/:id`

Frontend alignment:
- No dedicated service (could be used for public search if needed)

---

## Gaps and Mismatches
- Auth
  - Frontend calls missing endpoints: `/auth/profile`, `/auth/change-password`
  - Missing methods for `/auth/me` and handling `/auth/refresh` explicitly
  - Axios interceptor references undefined `baseURL`
- Rooms
  - Frontend `getRoomById` has no matching backend route
  - `getRoomTypes` should be under `/settings/room-types`, not `/rooms/types`
- Settings
  - `settingsService` uses `/settings/prices` vs backend `/settings/price-logic`
- Rentals
  - Missing frontend methods for details, room-specific lists, car add/remove, related customers, estimate, statistics
- Customers
  - Missing frontend methods for `related` and `car/:carNumber`
- Shifts and Users
  - No frontend services
- Dashboard
  - Routes are public in backend; likely should be protected like others

## Recommended Actions
- Fix `Frontend/src/api/index.js` interceptor to use `api.defaults.baseURL` or an imported constant; add `me()` and `refresh()` helpers in `authService` or rely solely on interceptor for refresh.
- Remove or implement backend for `/auth/profile` and `/auth/change-password` to match `authService`.
- Update `settingsService.getPriceSettings` and `.updatePriceSettings` to use `/api/settings/price-logic`.
- Update `roomService.getRoomTypes` to call `/api/settings/room-types` (or use `settingsService`).
- Remove or implement `GET /api/rooms/:id`; add `roomService.updateStatus(roomId, body)` and `roomService.getFrequency()` to cover existing backend.
- Extend `rentalService` with: `getRentalDetails`, `getRoomActive`, `getRoomHistory`, `addCar`, `removeCar`, `getRelatedCustomers`, `estimatePrice`, `getDailyStatistics`, `getMonthlyStatistics`.
- Extend `customerService` with `search`, `getByCarNumber`, and `related` CRUD.
- Add `shiftService` and `userService` for respective admin/user operations.
- Consider securing `/dashboard/*` with auth middleware for consistency.
