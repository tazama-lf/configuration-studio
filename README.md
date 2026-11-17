# Tazama Config Studio

A web application for managing Tazama configuration tables (`network_map`, `rule`, `typology`) in the `configuration` database.

## Architecture

- **backend/** — NestJS 11 thin proxy (port 3015). Forwards auth to `auth-service` and data to `admin-service`.
- **frontend/** — Vite 7 + React 18 + TypeScript SPA (port 5176). MUI 7 + Ant Design 5 + Tailwind CSS 4.

### Backend Structure

```
backend/src/
├── main.ts                      # Bootstrap, Swagger setup, CORS, ValidationPipe
├── app.module.ts                # Root module (ConfigModule, HttpModule, Auth, Config)
├── auth/
│   ├── auth.controller.ts       # POST /auth/login
│   ├── auth.service.ts          # Proxies login to TAZAMA_AUTH_URL
│   ├── tazama-auth.guard.ts     # JWT guard using @tazama-lf/auth-lib
│   ├── auth.decorator.ts        # @Public(), @RequireClaims(), @RequireAnyClaims()
│   ├── user.decorator.ts        # @User() → injects AuthenticatedUser
│   ├── auth.types.ts            # AuthenticatedUser, AuthenticatedRequest types
│   └── dto/login.dto.ts         # Login DTO (username, password)
├── config/
│   ├── config.controller.ts     # CRUD endpoints for config tables
│   ├── config-proxy.service.ts  # Proxies requests to admin-service
│   ├── config.module.ts         # ConfigProxyModule
│   └── env.validation.ts        # Environment variable validation
└── services/
    └── admin-service-client.service.ts  # HTTP client for admin-service
```

### Frontend Structure

```
frontend/src/
├── App.tsx                      # Root component (AppProviders → AppRoutes)
├── main.tsx                     # Entry point
├── router/index.tsx             # Route definitions + ProtectedRoute
├── features/
│   ├── auth/
│   │   ├── contexts/AuthContext.tsx   # Auth state (localStorage token)
│   │   ├── pages/Login.tsx            # Login page (react-hook-form + yup)
│   │   └── services/authApi.ts        # Auth API client + JWT decoder
│   ├── config/
│   │   ├── pages/                     # NetworkMapPage, RulePage, TypologyPage (specs in __tests__)
│   │   ├── components/                # Config editors (NetworkMap, Rule, Typology) (specs in __tests__)
│   │   └── services/configApi.ts      # Config API client (CRUD + pagination)
│   └── dashboard/
│       ├── Dashboard.tsx             # Layout shell (AppBar, Drawer, SideNav)
│       └── components/               # TopBar, SideNav, Drawer, DashboardBoxes, UserCard
├── shared/
│   ├── components/ui/                # Shared UI components (Loader, etc.)
│   ├── config/                       # api.config, environment.config, routes.config
│   ├── providers/                    # AppProviders, ToastProvider
│   └── styles/index.css              # Global styles
├── common/Tables/CustomTable/        # Reusable DataGrid table component
└── utils/
    ├── constants.ts                  # Shared constants
    └── common/interceptor.ts         # Fetch 401 interceptor → redirect to login
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend runs on `http://localhost:3015`. Swagger at `http://localhost:3015/api/docs` (development only — disabled when `NODE_ENV=production`).

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend runs on `http://localhost:5176`.

## API Endpoints

### Auth

| Method | Endpoint      | Description                              | Auth   |
| ------ | ------------- | ---------------------------------------- | ------ |
| `POST` | `/auth/login` | Login with username/password → JWT token | Public |

### Config (all require Bearer token)

| Method   | Endpoint                  | Description                                                             |
| -------- | ------------------------- | ----------------------------------------------------------------------- |
| `GET`    | `/config/:table`          | List records (paginated: `limit`, `offset`, `sort`, `order`, `filters`) |
| `GET`    | `/config/:table/:id/:cfg` | Get a single record by id and cfg                                       |
| `GET`    | `/config/network-map/:cfg` | Get a network map by cfg (single-key table)                            |
| `POST`   | `/config/:table`          | Create a new record                                                     |
| `PUT`    | `/config/:table/:id/:cfg` | Update a record by id and cfg                                           |
| `PUT`    | `/config/network-map/:cfg` | Update a network map by cfg (single-key table)                         |
| `DELETE` | `/config/:table/:id/:cfg` | Delete a record by id and cfg                                           |
| `DELETE` | `/config/network-map/:cfg` | Delete a network map by cfg (single-key table)                        |
| `POST`   | `/config/network-map/:cfg/activate` | Activate a network map                                       |
| `POST`   | `/config/network-map/:cfg/deactivate` | Deactivate a network map                                   |
| `POST`   | `/config/network-map/reload` | Reload the active network map                                    |

Where `:table` is one of `network-map`, `rule`, or `typology`.

The backend proxies these to the admin-service at:

```
GET    /v1/admin/configuration/{table}
GET    /v1/admin/configuration/{table}/{id}/{cfg}
POST   /v1/admin/configuration/{table}
PUT    /v1/admin/configuration/{table}/{id}/{cfg}
DELETE /v1/admin/configuration/{table}/{id}/{cfg}
```

## Authentication

- **Backend**: Uses `@tazama-lf/auth-lib` for JWT validation and claim checking. The `TazamaAuthGuard` validates the bearer token, checks required claims via `@RequireClaims()` / `@RequireAnyClaims()` decorators, and injects an `AuthenticatedUser` via the `@User()` decorator. `/auth/login` is rate-limited (5 requests/minute per client).
- **Frontend**: `AuthContext` manages login/logout state. JWT token is stored in `localStorage`. The token's `exp` claim is checked on startup and an expired session is logged out immediately. A fetch interceptor (`interceptor.ts`) clears the session and redirects to `/login` on `401` responses. Token decoding extracts user info (username, email, claims, tenantId, realm roles).

> **Token storage note:** the JWT lives in `localStorage`, which an XSS vulnerability could read. This is a conscious trade-off for the current deployment; a hardened alternative is an httpOnly cookie set by the backend. Track any move to that model as its own change (it requires a backend cookie endpoint and CSRF protection).

## Frontend Features

- **Login Page**: Form validation with `react-hook-form` + `yup` (email + password)
- **Dashboard**: Layout shell with collapsible side navigation, top bar with user avatar
- **Config Pages**: Full CRUD for `network_map`, `rule`, and `typology` tables
  - Paginated data table using MUI DataGrid (`CustomTable`)
  - Create / Edit / View / Delete dialogs
  - Specialized config editors:
    - `NetworkMapConfigEditor` — Messages with typology/rule references (fetches typologies for dropdown)
    - `RuleConfigEditor` — Parameters, exit conditions, bands, and cases
    - `TypologyConfigEditor` — Rules with weights, expression, and workflow config (fetches rules for dropdown)
- **Toast Notifications**: Success/error/warning/info toasts via `ToastProvider`
- **Tenant-aware**: Rule and Typology pages prefix record IDs with the tenant ID from the JWT token

## Environment

### Backend

| Variable               | Description              | Default                 |
| ---------------------- | ------------------------ | ----------------------- |
| `PORT`                 | Backend port             | `3015`                  |
| `NODE_ENV`             | Node environment         | `development`           |
| `CORS_ORIGINS`         | Comma-separated allowed CORS origins | `http://localhost:5176` |
| `TAZAMA_AUTH_URL`      | Auth-service URL (base; `/v1/auth/login` is appended) | _(required)_ |
| `ADMIN_SERVICE_URL`    | Admin-service URL        | _(required)_            |
| `AUTH_PUBLIC_KEY_PATH` | Keycloak public key path | _(required)_            |
| `CERT_PATH_PUBLIC`     | Public certificate path  | _(required)_            |
| `FUNCTION_NAME`        | Function name            | _(required)_            |

> **Production key management:** the `public-key.pem` committed in `backend/` is a development convenience only. In production, mount the key for your environment (secret or volume) and point `CERT_PATH_PUBLIC`/`AUTH_PUBLIC_KEY_PATH` at the mounted path — never trust the repository copy, since a public key in git cannot be rotated per environment.

### Frontend

| Variable             | Description                              | Default                 |
| -------------------- | ---------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL`  | Backend URL                              | `http://localhost:3015` |
| `VITE_APP_TITLE`     | App title                                | `Tazama Config Studio`  |
| `VITE_APP_ENV`       | App environment                          | `development`           |
| `VITE_ALLOWED_HOSTS` | Comma-separated allowed hosts (or `all`) | _(none)_                |

## Key Dependencies

### Backend

- NestJS 11, `@nestjs/axios`, `@nestjs/config`, `@nestjs/swagger`
- `@tazama-lf/auth-lib` 4.0.0, `@tazama-lf/frms-coe-lib` ^8.3.0
- `jsonwebtoken`, `class-validator`, `class-transformer`

### Frontend

- React 18, React Router 7, Vite 7
- MUI 7 (`@mui/material`, `@mui/x-data-grid`), Ant Design 5
- Tailwind CSS 4, `react-hook-form` + `yup`, `lucide-react`, `react-icons`

## Test Coverage

This project enforces minimum test coverage thresholds across all packages (backend and frontend). Coverage is measured for lines, branches, functions, and statements.

- **Backend**: Jest, 248 tests, 100% threshold for all metrics
- **Frontend**: Jest, 563 tests, 100% threshold for all metrics

## Running Coverage Locally

### Backend

```bash
cd backend
npm run test:cov
```

Coverage reports are output to `backend/coverage/` in JSON, LCOV, Clover, and text formats.

### Frontend

```bash
cd frontend
npm run test:cov
```

Coverage reports are output to `frontend/coverage/` in the same formats.

## Coverage Configuration

| Package  | Tool   | Config Location                                  |
| -------- | ------ | ------------------------------------------------ |
| Backend  | Jest   | `backend/package.json` (`jest` key)              |
| Frontend | Jest   | `frontend/jest.config.cjs` (`coverageThreshold`)  |

Both are configured with 100% thresholds for all metrics (lines, branches, functions, statements). Tests fail locally if coverage drops below the threshold.

## Linting

ESLint is configured for both backend and frontend. Run linting locally with:

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

> **Note**: The GitLab CI lint pipeline (`.gitlab-ci.yml`) was removed because the available CI runners do not have a compatible Node.js/npm environment (shell executor has Node v14/npm v6 which doesn't support workspace commands or lockfileVersion 3). Linting should be run locally before merging.
