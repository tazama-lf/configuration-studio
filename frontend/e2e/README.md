# Playwright E2E Tests

End-to-end tests for the Tazama Config Studio frontend using [Playwright](https://playwright.dev/).

## Prerequisites

1. **Backend API** running on `http://localhost:3011`
2. **Frontend dev server** running on `http://localhost:5173`

```bash
# From the frontend directory
npm run dev
```

3. **Playwright browsers** installed:

```bash
npx playwright install chromium
```

## Test Files

| File                     | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `login.spec.ts`          | Login page: form validation, visibility toggle, successful login, redirect when already authenticated, invalid credentials error |
| `rule-crud.spec.ts`      | Full CRUD lifecycle for Rule configurations: create, view, edit, delete, and a combined lifecycle test |
| `typology-crud.spec.ts`  | Full CRUD lifecycle for Typology configurations: create, view, edit, delete, and a combined lifecycle test |
| `network-map-crud.spec.ts` | Full CRUD lifecycle for Network Map configurations: create, view, edit (toggle active), delete, and a combined lifecycle test |
| `helpers.ts`             | Shared test utilities: login, navigation, dialog/table helpers |

## Running Tests

### All e2e tests

```bash
npm run e2e
```

### Individual test suites

```bash
npm run e2e:login        # Login tests only
npm run e2e:rule         # Rule CRUD tests only
npm run e2e:typology     # Typology CRUD tests only
npm run e2e:network-map  # Network Map CRUD tests only
```

### With interactive UI mode

```bash
npm run e2e:ui
```

### View HTML report

```bash
npm run e2e:report
```

## Configuration

- **Playwright config:** `playwright.config.ts` (in the frontend root)
- **Base URL:** `http://localhost:5173`
- **Browser:** Chromium (Desktop Chrome)
- **Timeouts:** 60s per test, 15s for actions, 30s for navigation
- **Traces:** Captured on first retry
- **Screenshots:** Captured on failure
- **Video:** Retained on failure

## Test Credentials

Tests use the credentials stored in repository memory:

- **Email:** `tazama-user@tazama.org`
- **Password:** `password`

## Test Structure

Each CRUD test suite follows the same pattern:

1. **`beforeEach`** — Logs in and navigates to the relevant config page
2. **Create** — Opens the create dialog, fills in form fields, saves, and verifies the new record appears in the table
3. **Read (View)** — Opens the view dialog on an existing record and verifies read-only display
4. **Update (Edit)** — Opens the edit dialog, modifies a field, saves, and verifies the table refreshes
5. **Delete** — Clicks delete on a row, confirms in the confirmation dialog, and verifies the row is removed
6. **Full CRUD lifecycle** — Creates a record, reads it, updates it, then deletes it — verifying the entire flow end-to-end
