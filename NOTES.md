# NOTES.md

## APIs Considered
- **Primary - TheSportsDB** (chosen): Free tier suitable for schedules; will be used as the primary data source for Phase 1.
  - Endpoint: `eventsseason.php`
  - Request pattern (example): `https://www.thesportsdb.com/api/v1/json/<APIKEY>/eventsseason.php?l=<leagueId>&s=<season>`
  - League IDs:
    - NBA: **4387**
    - NFL: **4391**
  - Notes: Rate limits are modest; for Phase 1 we will cache season responses and avoid frequent polling.

- **API-Sports**: Paid tier, more robust, additional sports features (not used in Phase 1)
- **SportsData.io**: Full sports dataset, best for scaling later (not used in Phase 1)

## Seasons & Handling
- Locked seasons for MVP:
  - NBA: **2025-26**
  - NFL: **2024**
- Season format:
  - NBA uses a `YYYY-YYYY` format (e.g., `2024-2025`) — pass this as the `s` parameter.
  - NFL uses a single-year format (e.g., `2024`) — pass this as the `s` parameter.
- Handling decisions:
  - Phase 1 is planning-only: no live data fetches. When implemented, backend will fetch full season schedules once, normalize, and cache them.
  - Update strategy: manual or scheduled refresh per season. Avoid continuous polling; consider a daily/weekly refresh if needed later.

## Internal Schema (MVP normalized format)
We will store schedules in a normalized, minimal format that contains only the fields required for the MVP:
- `league` (string enum: `NBA` | `NFL`)
- `season` (string, e.g., `2024-2025` or `2024`)
- `eventId` (string)
- `date` (ISO 8601 date string, e.g., `2024-10-24`)
- `time` (local time or ISO time string; null if not provided)
- `homeTeam` (string)
- `awayTeam` (string)
- `week` (integer, NFL only, nullable)

Notes:
- `week` will be set when available from API for NFL; otherwise `null`.
- Date/time should be normalized to ISO and documented for frontend rendering.

## Tech Stack (decided)
- Frontend: **Next.js 14** (React 18), standard pages-based app. Dev runs on port 3001.
- Backend: **Node.js** + **Express** (backend server in `backend/index.js`), dev convenience with `nodemon`.
- Rationale: Rapid development with Next.js + lightweight Express backend to normalize and serve cached season schedules.

## Phase 2 — Backend Implementation Notes
- New endpoint: `GET /api/schedules?league=<NBA|NFL>&season=<season>` returns normalized season schedules (internal MVP schema).
- Caching: in-memory cache with TTL; default TTL **12 hours**, configurable via env var `SCHEDULE_CACHE_TTL_MS`.
- Env vars required for fetching:
  - `THESPORTSDB_API_KEY` — API key for TheSportsDB (used only on the server). If not set or if TheSportsDB returns no data, the backend will return **sample fallback data** so the frontend can still demo schedules.
- Week extraction: for NFL, `week` is derived from event properties like `intRound`, `intWeek`, `strRound`, or `round` when available; otherwise `null`.
- Next tasks: add server-side filtering (by date, team, week), add unit tests for normalization, and add more robust fallback snapshots for offline dev/testing.

## UX / Layout Ideas
- Clean calendar-style layout for NFL weeks
- Monthly grid for NBA games
- Color coding by home/away team
- Search/filter by team or date

## Questions / Decisions
- Should we cache all season schedules or fetch on demand?
- How should weekends vs weekdays be visually distinguished?
- Should favorite teams be highlighted for user personalization?

## References / Inspiration
- ESPN schedule pages (dense but informative)
- League apps (complex, overkill for MVP)
- Minimalist dashboards (easy to scan, uncluttered)
