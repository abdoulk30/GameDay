# GameDay

A small project for managing and experimenting with game-day scheduling and task automation.

## About

This repository contains planning and notes for the GameDay project. Key documents:

- `AGENT.md` — agent responsibilities and workflow
- `NOTES.md` — working notes and ideas
- `ROADMAP.md` — project roadmap and milestones

## Quick start

1. Install dependencies (if any) — the tech stack is not yet chosen.
2. Initialize the repository (if not already):

```bash
git init
```

3. See project docs above for next steps and design decisions.

## Contributing

Please open issues or pull requests. Add a `LICENSE` when you decide on a license (MIT recommended for permissive use).

## License

This project is licensed under the MIT License — see `LICENSE` for details.

## Setup

Back-end (Node + Express):

```bash
cd backend
npm install
npm run dev   # or npm start
```

Front-end (Next.js + React):

```bash
cd frontend
npm install
npm run dev   # runs Next.js on port 3001
```

## Developer Notes

- **Combined dev script:** from the repository root run `npm run dev`. This starts both backend and frontend concurrently using `concurrently` (root `package.json`).
- **Run separately:**
  - Backend: `npm run dev --prefix backend`
  - Frontend: `npm run dev --prefix frontend`
- **Environment variables:**
  - `THESPORTSDB_API_KEY` — required when the backend is implemented to fetch season schedules from TheSportsDB (`eventsseason.php`). Not required for Phase 1 (planning). If this environment variable is not set, the backend will return small sample schedules for local development and demos to avoid client-side errors.
- **Schedules fetching (Phase 1 decision):**
  - Phase 1 was planning-only. Phase 2 adds a backend endpoint that fetches and normalizes season schedules from TheSportsDB.

## Backend endpoints

- `GET /api/schedules?league=<NBA|NFL>&season=<season>`
  - Parameters:
    - `league` — required: `NBA` or `NFL`.
    - `season` — optional: defaults to locked seasons (NBA=`2025-26`, NFL=`2024`).
  - Response: JSON `{ league, season, source: 'api'|'cache', data: [ ...normalizedEvents ] }`.
  - Normalized event fields (MVP schema): `league`, `season`, `eventId`, `date`, `time`, `homeTeam`, `awayTeam`, `week` (NFL only, nullable).
  - Requirements: Set `THESPORTSDB_API_KEY` environment variable on the server before calling.

- Caching:
  - Responses are cached in-memory for a TTL (default 12 hours). Configure with `SCHEDULE_CACHE_TTL_MS` env var.

- Frontend notes:
  - The Next.js frontend includes a proxy API route at `/api/schedules` that forwards to the backend and returns normalized data to the UI.
  - For quick offline demos, the frontend has a "Use sample data" button to populate schedules without an API key.

- **Developer tips:**
  - Ensure Node >= 18 for `fetch` support in the backend when running locally, or add a fetch polyfill.
  - If `concurrently` is missing, install it at root with: `npm install --save-dev concurrently`.


