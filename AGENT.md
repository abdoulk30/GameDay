# AGENT.md

## Agent Purpose
The “agent” in GameDay is the system that fetches, processes, and serves NBA and NFL schedules. It retrieves structured data from APIs and organizes it for display in the app.

## Responsibilities
1. Fetch schedule data from selected API(s).
2. Store/cache the data locally or in a database for faster access.
3. Provide filtered views:
   - By date (daily schedule)
   - By team (team schedule)
   - By league (NBA vs NFL)
4. Format data for clean presentation in the frontend UI.

## Workflow Example
1. Backend requests schedules from API
2. Data returned as JSON → stored/cached
3. User requests team/day/league view → agent filters data
4. Agent sends structured response to frontend
5. Frontend displays schedule with clean visual layout

## Optional Enhancements (future, post-MVP)
- Live updates for games
- Notifications
- Player stats or news integration
