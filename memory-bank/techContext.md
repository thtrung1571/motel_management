# Tech Context

Frontend:
- React 18 + Vite
- UI: MUI (`@mui/material`, `@mui/x-data-grid`, `@mui/x-date-pickers`), Ant Design present
- State: Redux Toolkit, React Redux
- HTTP: Axios
- Tooling: ESLint, Prettier, Vitest

Backend:
- Node.js + Express
- ORM: Sequelize (`mysql2` driver), DB: MySQL
- Auth: `jsonwebtoken`, password hashing: `bcryptjs`
- File uploads: `multer`
- Realtime (available): `socket.io` (usage TBD)
- Utilities: `dayjs`, `xlsx`

Environment/config:
- DB via env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- Server entry: `backend/server.js`; dev via `nodemon`

Project layout (top-level):
- `backend/` Node/Express API
- `Frontend/` React app
- `memory-bank/` Project documentation (this)

