# Express Backend

An Express 5 and TypeScript API with PostgreSQL, Drizzle, JWT authentication, admin/user roles, profiles and token revocation on signout. API responses include HATEOAS links for related actions.

## Requirements

- Node.js 22 and npm for local development.
- Docker with Compose for PostgreSQL or the complete stack.
- Postman or another HTTP client.

## Local development

```sh
npm ci
cp .env.example .env
```

Edit `.env` with private database/admin credentials and a random JWT secret of at least 32 characters. For example, generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep `DATABASE_URL` consistent with the database credentials. Local Node connects to `localhost:5434`; the API container connects to `db:5432`. Percent-encode special characters in URL credentials. Never commit `.env` or real tokens.

```sh
docker compose up -d db
npm run db:migrate
npm run seed:admin
npm run dev
```

The API is available at `http://localhost:3000/api`. The seed creates an admin or verifies that an existing account has the admin role. It fails if that email belongs to a normal user and does not promote the account or reset an existing password.

## Run the complete stack with Docker

After configuring `.env`:

```sh
docker compose build api
docker compose up -d db
docker compose run --rm api node dist/scripts/migrate.js
docker compose run --rm api node dist/scripts/seed-admin.js
docker compose up -d api
docker compose ps
```

Use the compiled migration and seed scripts inside the production image: `tsx` is a development dependency and is omitted from that image. Migrations must run before the API handles requests against a new database. PostgreSQL's healthcheck checks database readiness, not application table creation.

After code changes, rebuild with `docker compose up -d --build api`. Stop services with `docker compose down`; the named PostgreSQL volume retains database data.

## Project structure

```text
drizzle/                  Committed generated SQL migrations and metadata
src/
  config/env.ts           Environment configuration
  db/                     PostgreSQL pool, Drizzle schema and DB error helpers
  middleware/             Authentication, authorization, validation, limits and errors
  modules/
    auth/                 Signup, signin and signout
    profile/              Current-user profile creation, reading and updates
    admin/                Admin-only user listing and detail
  utils/httpError.ts       Expected HTTP errors handled centrally
  types/express.d.ts       Authenticated Express request typing
  scripts/                Database migrations and admin provisioning
  app.ts                  Express assembly and route mounting
  server.ts               HTTP listener and expired-revocation cleanup
```

Each feature has four files:

| File | Responsibility |
| --- | --- |
| `*.routes.ts` | Route registration and middleware ordering |
| `*.controller.ts` | HTTP input/output, status codes and HATEOAS links |
| `*.service.ts` | Business rules, password/token operations and database queries |
| `*.schema.ts` | Zod input validation and inferred input types |

Services accept ordinary values rather than Express request/response objects. Expected failures use `HttpError`; Express 5 forwards rejected async handlers to the central error middleware. Unexpected errors return a generic 500 response.

## Postman API guide

Use `Content-Type: application/json` for JSON bodies. For protected routes, choose Bearer Token authorization and use `data.token` from signin.

| Method | Path | Authorization | Purpose |
| --- | --- | --- | --- |
| GET | `/api` | Public | Discover API links |
| POST | `/api/auth/signup` | Public | Create a normal user |
| POST | `/api/auth/signin` | Public | Receive an access token |
| POST | `/api/auth/signout` | Bearer | Revoke the current token |
| POST | `/api/profile` | Bearer | Create own profile |
| GET | `/api/profile` | Bearer | Read own profile |
| PATCH | `/api/profile` | Bearer | Update own profile |
| GET | `/api/admin/users` | Admin bearer | List up to 100 users |
| GET | `/api/admin/users/:id` | Admin bearer | Read a user by UUID |
| DELETE | `/api/admin/users/:id` | Admin bearer | Permanently delete another user and their profile |

### Delete a user as admin

Sign in as admin, then get an ID from `GET /api/admin/users`. In Postman choose method **DELETE**, URL `http://localhost:3000/api/admin/users/USER_ID`, Authorization **Bearer Token** with the admin token (or `{{token}}`), and Body **none**.

Success returns **204 No Content** with an empty response body. Only an admin can delete users; normal users receive 403 and missing/invalid tokens receive 401. Invalid UUIDs return 400, nonexistent users return 404, and deleting your own account returns 403. Deletion is permanent and removes the user's profile through the existing database cascade. Deleted accounts' tokens are rejected on subsequent authenticated requests. Authentication also uses the current database role so role changes affect existing tokens.

Signup/signin body:

```json
{ "email": "student@example.com", "password": "StudentPass123!" }
```

Profile creation body:

```json
{ "full_name": "Student", "phone": "+8801712345678", "bio": "Learning Express" }
```

PATCH accepts one or more of those profile fields. Requests use `full_name`; returned profile data uses `fullName`. Extra fields, including client-supplied roles or ownership IDs, are rejected. Profile ownership always comes from the verified JWT.

Signup passwords require at least eight characters, lowercase/uppercase letters, a number, and at most 72 UTF-8 bytes. Signin enforces the same byte ceiling without imposing new-password complexity rules. The byte limit prevents bcrypt truncation of Unicode passwords.

JWTs use HS256, UUID subject/token identifiers, an explicit admin/user role and an expiry. Revoked tokens are rejected; signout affects only the current token. Revocation database failures propagate as server errors rather than authentication failures.

Common statuses: 201 created, 400 invalid input, 401 invalid credentials/token, 403 insufficient role, 404 missing resource, 409 duplicate email/profile, 413 oversized body, 429 rate limit, 500 unexpected failure.

## Commands and verification

```sh
npm run build
npm start
docker compose config --quiet
npm audit --omit=dev
```

After editing the database schema, run `npm run db:generate`, review and commit the generated SQL and metadata, then run `npm run db:migrate`.

There is no committed automated test suite. Use Postman to verify signup, signin, profile creation/update, admin restrictions and token reuse after signout. Include invalid payloads, oversized Unicode passwords, missing/expired tokens and duplicate records. Local development uses an in-memory limiter: signup/signin share 10 requests per 15 minutes per IP; the API limit is 100 requests per 15 minutes per IP.
