const express = require('express');
const path = require('path');
// Load local .env for development (THESPORTSDB_API_KEY, etc.)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// In-memory cache for season responses
const cache = new Map(); // key -> { data, expiresAt }
const CACHE_TTL_MS = parseInt(process.env.SCHEDULE_CACHE_TTL_MS || String(12 * 60 * 60 * 1000), 10); // default 12 hours

// League mapping
const LEAGUES = {
  NBA: { id: '4387', defaultSeason: '2025-26' },
  NFL: { id: '4391', defaultSeason: '2024' },
};

function normalizeEvent(event, league, season) {
  // event comes from TheSportsDB. Fields vary; we pick common ones.
  const eventId = event.idEvent || event.id || event.eventId || null;
  const date = event.dateEvent || event.strDate || event.date || null; // expect YYYY-MM-DD
  const time = event.strTime || event.time || null; // keep as-is; frontend will parse/format
  const homeTeam = event.strHomeTeam || event.homeTeam || null;
  const awayTeam = event.strAwayTeam || event.awayTeam || null;

  // attempt to derive week for NFL
  let week = null;
  if (league === 'NFL') {
    const maybeWeek = event.intRound || event.intWeek || event.strRound || event.round || null;
    if (maybeWeek) {
      // try numeric extraction
      const match = String(maybeWeek).match(/(\d+)/);
      if (match) week = parseInt(match[1], 10);
    }
  }

  return {
    league,
    season,
    eventId: eventId ? String(eventId) : null,
    date,
    time,
    homeTeam,
    awayTeam,
    week: week === undefined ? null : week,
  };
}

// Sample fallback data used when TheSportsDB returns no events or is unreachable
const SAMPLE_DATA = {
  NBA: [
    { league: 'NBA', season: '2025-26', eventId: 'NBA-SAMPLE-1', date: '2026-01-10', time: '19:00', homeTeam: 'Lakers', awayTeam: 'Warriors', week: null },
    { league: 'NBA', season: '2025-26', eventId: 'NBA-SAMPLE-2', date: '2026-01-12', time: '20:30', homeTeam: 'Nets', awayTeam: 'Celtics', week: null },
  ],
  NFL: [
    { league: 'NFL', season: '2024', eventId: 'NFL-SAMPLE-1', date: '2024-09-08', time: '13:00', homeTeam: 'Cowboys', awayTeam: 'Giants', week: 1 },
    { league: 'NFL', season: '2024', eventId: 'NFL-SAMPLE-2', date: '2024-09-08', time: '16:25', homeTeam: 'Packers', awayTeam: 'Vikings', week: 1 },
  ],
}

async function fetchSeasonFromTheSportsDB(leagueKey, season, apiKey) {
  const leagueInfo = LEAGUES[leagueKey];
  if (!leagueInfo) throw new Error('Unsupported league');

  // Per API reference, use the following URL (server-side only):
  // const API_KEY = process.env.THESPORTSDB_API_KEY
  // const leagueId = league === "NBA" ? "4387" : "4391"
  // const season = league === "NBA" ? "2024-2025" : "2024"
  // const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${leagueId}&s=${season}`
  const API_KEY = apiKey
  const leagueId = leagueInfo.id
  // Normalize season format for TheSportsDB when needed (e.g., NBA '2025-26' -> '2025-2026')
  let apiSeason = season
  if (leagueKey === 'NBA') {
    const m = String(season).match(/^(\d{4})-(\d{2})$/)
    if (m) {
      const start = parseInt(m[1], 10)
      apiSeason = `${start}-${start + 1}`
    }
  }
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${leagueId}&s=${encodeURIComponent(apiSeason)}`
  console.debug('Fetching TheSportsDB url:', url)

  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      const text = await resp.text().catch(() => resp.statusText)
      throw new Error(`TheSportsDB returned ${resp.status} ${resp.statusText}: ${text}`)
    }
    const json = await resp.json()
    if (!Array.isArray(json.events) || json.events.length === 0) {
      throw new Error(`TheSportsDB returned no events for ${leagueKey} ${season}`)
    }
    return json.events.map((ev) => normalizeEvent(ev, leagueKey, season))
  } catch (err) {
    console.error('Error fetching from TheSportsDB:', err.message || err)
    // propagate the error so callers can decide how to handle fallback
    throw err
  }
}

// GET /api/schedules?league=NBA|NFL&season=YYYY or season=YYYY-YYYY
app.get('/api/schedules', async (req, res) => {
  try {
    const league = (req.query.league || '').toUpperCase()
    if (!['NBA', 'NFL'].includes(league)) {
      return res.status(400).json({ error: "Invalid or missing 'league' query param. Use 'NBA' or 'NFL'." })
    }

    const season = req.query.season || LEAGUES[league].defaultSeason

    const cacheKey = `${league}:${season}`
    const now = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return res.json({ league, season, source: 'cache', data: cached.data })
    }

    const apiKey = process.env.THESPORTSDB_API_KEY
    const useSample = process.env.USE_SAMPLE_DATA === 'true'

    // If API key is missing, fail (unless sample fallback explicitly enabled)
    if (!apiKey) {
      const msg = 'THESPORTSDB_API_KEY is not set'
      console.warn(msg)
      if (useSample) {
        const sample = SAMPLE_DATA[league] ? SAMPLE_DATA[league].filter((s) => s.season === season) : []
        const fallback = sample.length > 0 ? sample : (SAMPLE_DATA[league] || [])
        cache.set(cacheKey, { data: fallback, expiresAt: now + CACHE_TTL_MS })
        return res.json({ league, season, source: 'sample', data: fallback, note: 'Using sample data because THESPORTSDB_API_KEY is missing.' })
      }
      return res.status(502).json({ error: 'upstream_error', message: 'THESPORTSDB_API_KEY is not set; cannot fetch schedules.' })
    }

    // Attempt to fetch real data (fetchSeasonFromTheSportsDB will throw on HTTP errors or empty events)
    let data
    try {
      data = await fetchSeasonFromTheSportsDB(league, season, apiKey)
    } catch (err) {
      console.error('Upstream error fetching schedules:', err.message || err)
      if (useSample) {
        const sample = SAMPLE_DATA[league] ? SAMPLE_DATA[league].filter((s) => s.season === season) : []
        const fallback = sample.length > 0 ? sample : (SAMPLE_DATA[league] || [])
        cache.set(cacheKey, { data: fallback, expiresAt: now + CACHE_TTL_MS })
        return res.json({ league, season, source: 'sample', data: fallback, note: 'Using sample data due to upstream error.' })
      }
      return res.status(502).json({ error: 'upstream_error', message: `Error fetching from TheSportsDB: ${err.message || 'unknown'}` })
    }

    // Defensive: if we somehow got no data, return 502
    if (!data || data.length === 0) {
      return res.status(502).json({ error: 'upstream_error', message: `No events returned from TheSportsDB for ${league} ${season}` })
    }

    cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS })

    return res.json({ league, season, source: 'api', data })
  } catch (err) {
    console.error('Unexpected server error:', err)
    return res.status(502).json({ error: 'server_error', message: 'Unexpected server error fetching schedules.' })
  }
});

// Clear cache on startup to avoid retaining stale in-memory entries across restarts
cache.clear();
console.log('Cleared in-memory schedule cache on startup');

const server = app.listen(PORT, () => {
  console.log(`GameDay backend listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Another process may be running. Kill it or set PORT to a different value.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
