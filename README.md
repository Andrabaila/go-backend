# Go Walk Backend

This repository now contains only the backend API for the Go Walk project. The frontend application has been removed; only server-side code and shared packages remain.

## Technology Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (via TypeORM)
- **Authentication:** JWT, Passport
- **Testing:** Jest for unit and e2e tests
- **Monorepo tooling:** Turbo with workspaces

## Development

1. Install dependencies from the root:
   ```bash
   npm install
   ```
2. Start the backend in watch mode:
   ```bash
   npm run dev --filter=apps/backend
   ```
3. Run tests:
   ```bash
   npm test --filter=apps/backend
   ```

## Project Structure

- `apps/backend/` – NestJS API modules, controllers, services, entities
- `packages/shared/` – shared types and constants used by backend

## Notes

- Frontend-specific code, configuration, and tooling have been removed.
- TypeORM is configured in `apps/backend/src/app.module.ts`.
- Environment variables and database connection details can be found in the backend README.

For more information on the backend implementation, refer to `apps/backend/README.md`.
