# Playwright API Test Suite — ReqRes

Automated REST API tests for [reqres.in](https://reqres.in) written with [Playwright](https://playwright.dev/) and [Zod](https://zod.dev/) schema validation.

## Prerequisites

- Node.js 18+
- npm
- Free API key from [app.reqres.in/api-keys](https://app.reqres.in/api-keys)

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your API key:

```bash
cp .env.example .env
```

```
BASE_URL=https://reqres.in
API_KEY=your_api_key_here
```

## Running tests

```bash
# Run all tests
npm test

# Run only GET tests
npx playwright test --grep "GET"

# Run only POST tests
npx playwright test --grep "POST"

# View last HTML report
npm run test:report
```

## Test cases

### TC01 – GET /api/users — List Users

| Step | What is asserted |
|------|-----------------|
| HTTP status | `200` |
| Schema | full response validated via Zod — `page`, `per_page`, `total`, `total_pages`: `number` · `data`: array of users with `id` (`number`), `email` (valid format), `first_name`, `last_name`, `avatar` (valid URL) · `support.url`, `support.text`: `string` |
| total | present, value > 0 |
| last_name | first user `Lawson`, second user `Ferguson` (reqres.in serves a fixed dataset) |

### TC01b – GET /api/users — Total count

| Step | What is asserted |
|------|-----------------|
| HTTP status | `200` on both requests |
| Total count | fetches all users with `?per_page=total`, asserts `data.length === total` |

### TC02 – POST /api/users — Create User (data-driven)

Runs once per record in `tests/data/newUsers.json`.

| Step | What is asserted |
|------|-----------------|
| HTTP status | `201` |
| Response time | `< 250 ms` (configurable via `RESPONSE_TIME_LIMIT_MS`) |
| Schema | full response validated via Zod — `name`, `job`, `id`, `createdAt`: `string`, `createdAt` must be a valid ISO datetime |
| ID | non-empty, convertible to a number |
| createdAt | `>= sentAt` and within 10 s of the request |
| Echoed data | `name` and `job` match what was sent |

Adding a new test user requires only a new line in `tests/data/newUsers.json` — no code changes:

```json
[
  { "name": "Viktor V", "job": "QA Engineer"       },
  { "name": "Michal P", "job": "Software Engineer" },
  { "name": "Peter U",  "job": "Boss"              }
]
```

## Project structure

```
tests/
├── data/
│   └── newUsers.json       # external test data for TC02
├── specs/
│   └── users.spec.ts       # TC01, TC01b, TC02
└── utils/
    └── testData.ts         # Zod schemas, inferred types, endpoints, constants
```

## Security

`.env` (API key) is gitignored and never committed. Missing `API_KEY` throws an explicit error before any test runs. Use `.env.example` as a template.
