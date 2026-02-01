# AGENT.md

## Agent Purpose
The “agent” in GameDay is responsible for fetching, processing, and serving season schedule data for NBA and NFL only. It uses TheSportsDB (primary) and specifically the `eventsseason.php` endpoint to retrieve season schedules. The agent normalizes the data into the project's internal schema, caches season schedules, and serves filtered views to the frontend. This agent explicitly does NOT handle live scores, player/team stats, user authentication, or notifications — schedules-only.

## Responsibilities
1. Fetch season schedule data for the locked leagues (NBA, NFL) from TheSportsDB's `eventsseason.php` endpoint.
2. Normalize data to the MVP schema:
   - `league` (NBA | NFL)
   - `season`
   - `eventId`
   - `date`
   - `time`
   - `homeTeam`
   - `awayTeam`
   - `week` (NFL only, nullable)
3. Store or cache season schedules locally for fast responses (in-memory or lightweight DB).
4. Provide filtered views:
   - By date (daily schedule)
   - By team (team schedule)
   - By league (NBA vs NFL)
5. Enforce scope: no live scores, no stats, no auth, no notifications — these are explicitly out of scope for Phase 1 and MVP.

## Workflow Example
1. Backend requests a season from TheSportsDB: `eventsseason.php?l=<leagueId>&s=<season>`
2. Data returned as JSON → agent normalizes to internal schema and caches the season.
3. User requests team/day/league view → agent filters cached data.
4. Agent sends the structured response to frontend for display.

## Optional Enhancements (future, post-MVP)
- Live updates for games (future, out of scope for MVP)
- Notifications
- Player stats or news integration
