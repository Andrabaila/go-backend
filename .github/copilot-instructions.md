# Copilot Instructions for Go Walk Project

## Architecture Overview

- **Monorepo Structure**: Turbo-managed workspace now containing only the backend (NestJS) at the repository root and shared packages in `packages/`.
- **Backend Modules**: Feature-based modules (auth, game-objects, players, quests, tiles, users) in `src/`, each with controller, service, entity. See `src/app.module.ts`. Database: TypeORM with Postgres; entities like Player, User, Quest.
- **Data Flow**: Backend exposes REST API endpoints used by clients; authentication via JWT and game state persisted in the database.
- **Game Mechanics**: Location-based exploration game with fog of war (30m radius visibility), multiplayer shared world, quests, artifacts. Map uses Leaflet.js with GeoJSON.

## Developer Workflows

- **Development**: `npm run dev` starts the backend in watch mode.
- **Build**: `npm run build` builds all apps with Turbo dependencies.
- **Testing**: `npm run test` runs Jest for backend unit and e2e tests (see `test/`).
- **Linting**: `npm run lint` enforces ESLint + Prettier; auto-fix with `lint-staged`. Husky for pre-commit hooks.
- **Debugging**: Backend debug with `npm run start:debug`.

## Coding Conventions

- **Imports**: Absolute paths with `@` alias, e.g., `import { usePlayerPosition } from '@/hooks'`. Types imported from `@/types` (centralized in `src/types/`).
- **File Naming**: kebab-case for files (e.g., `map-component.tsx`), PascalCase for components/hooks (e.g., `MapComponent`, `useCoins`). Limit files to 50 lines.
- **Structure**: One responsibility per file; DTOs in `dto/`, entities in module root. Feature-based grouping over type-based.
- **Patterns**: React 19 hooks only; async data with TanStack Query; state via Zustand if needed. JSDoc for public APIs explaining why, not what. No `any`, use `unknown` or precise types. Inline styles for dynamic properties (e.g., marker coordinates), Tailwind for static layout.
- **Styling**: Tailwind CSS primary, inline styles for runtime dynamics, CSS Modules for scoped styles. Fog of war layers use dynamic GeoJSON.
- **Commits**: Follow Conventional Commits (e.g., `feat: add quest tracking`).

## Key References

- See [CODING_GUIDELINES.md](CODING_GUIDELINES.md) for detailed rules, including no `any`, modern practices, file size limits.
- [README.md](README.md) for tech stack (Leaflet, Tailwind) and features (fog of war, multiplayer).
- [turbo.json](turbo.json) for task dependencies; [package.json](package.json) for scripts.</content>
  <parameter name="filePath">/home/ya/Downloads/go/.github/copilot-instructions.md
