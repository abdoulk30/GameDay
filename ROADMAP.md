# ROADMAP.md

## Phase 1: Planning (1–2 days) — ✅ COMPLETE (2026-01-30)
- Status: Locked scope — NBA + NFL only
- Primary API: TheSportsDB (`eventsseason.php`, NBA=4387, NFL=4391)
- Locked seasons: NBA=`2025-26`, NFL=`2024`
- MVP schema designed (see `NOTES.md`)
- Tech stack decided (Frontend: Next.js 14 + React 18; Backend: Node.js + Express)
- Notes: Phase 1 is planning-only. No live scores, stats, auth, or notifications implemented.

## Phase 2: Backend Setup (2–3 days) — ✅ IN PROGRESS / BASIC IMPLEMENTATION COMPLETE (2026-01-30)
- Set up backend framework: Node.js + Express (done)
- Integrate selected API(s): TheSportsDB `eventsseason.php` endpoint implemented via `GET /api/schedules` (fetch + normalize) — basic implementation complete
- Create caching solution: in-memory cache implemented with configurable TTL (default 12 hours)
- Build filtering logic (by date, team, league): filtering endpoints are not yet implemented; current endpoint returns full season normalized data — next step is adding query-side filters and pagination

## Phase 3: Frontend Setup (3–5 days) — ✅ IN PROGRESS (2026-01-30)
- Create basic layout (calendar/grid / list) — done (simple table view)
- Implement league selection (NBA / NFL) — done
- Implement daily schedule view — done (date picker + games list)
- Implement team schedule view — partial: client-side team filter implemented; dedicated team pages not yet added
- Wire frontend to live backend (TheSportsDB) — **IN PROGRESS** (local dev uses `THESPORTSDB_API_KEY`); UI now fetches live schedules from the backend API
- Next: improve styling, add pagination/filters server-side, and wire more UX polish

## Phase 4: Testing + Refinement (2–3 days)
- Verify API calls return correct data
- Test filters (team, date, league)
- UX testing — readability, clarity, responsiveness
- Adjust visual layout and color scheme

## Phase 5: Optional Enhancements / Stretch Goals
- Favorite teams highlighting
- Minimal animation or hover effects for game info
- Light/dark theme toggle

## Phase 6: Launch / Submission
- Deploy frontend + backend
- Document APIs used, schema, and decisions
- Prepare demo screenshots or short video
- Submit project / share GitHub repo
