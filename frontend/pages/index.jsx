import { useEffect, useMemo, useState } from 'react'

const LEAGUES = ['NBA', 'NFL']

function formatDateISO(d) {
  return d.toISOString().slice(0, 10)
}

export default function Home() {
  const [health, setHealth] = useState(null)
  const [league, setLeague] = useState('NBA')
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()))
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [teamFilter, setTeamFilter] = useState('')


  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'unreachable' }))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const r = await fetch(`/api/schedules?league=${encodeURIComponent(league)}`)
        const text = await r.text()
        let payload
        try {
          payload = text ? JSON.parse(text) : null
        } catch (e) {
          payload = null
        }
        if (!r.ok) {
          const backendMsg = payload && (payload.error || payload.message) ? (payload.error || payload.message) : r.statusText
          throw new Error(backendMsg || 'backend error')
        }
        const data = payload.data || []
        setSchedules(data)

        // If the currently selected date has no games, auto-select the first available date
        // This helps surface schedules immediately instead of showing "No games scheduled for this date." when data exists
        if (data.length > 0) {
          const dates = Array.from(new Set(data.map((g) => g.date))).sort()
          if (dates.length > 0 && !dates.includes(selectedDate)) {
            setSelectedDate(dates[0])
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load schedules')
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [league])

  const gamesForSelectedDate = useMemo(() => {
    return schedules.filter((g) => g.date === selectedDate)
  }, [schedules, selectedDate])

  const filteredGames = useMemo(() => {
    if (!teamFilter) return gamesForSelectedDate
    const q = teamFilter.toLowerCase()
    return gamesForSelectedDate.filter((g) => (g.homeTeam && g.homeTeam.toLowerCase().includes(q)) || (g.awayTeam && g.awayTeam.toLowerCase().includes(q)))
  }, [gamesForSelectedDate, teamFilter])

  return (
    <main style={{ padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <h1>GameDay</h1>
      <p>Schedules-only demo for NBA & NFL</p>

      <section style={{ marginBottom: 16 }}>
        <strong>Backend health:</strong> <code>{health ? health.status : 'loading...'}</code>
      </section>

      <section style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        {LEAGUES.map((l) => (
          <button key={l} onClick={() => setLeague(l)} style={{ padding: '8px 12px', background: l === league ? '#0366d6' : '#e6eefc', color: l === league ? 'white' : '#0366d6', border: 'none', borderRadius: 6 }}>
            {l}
          </button>
        ))}

        <label style={{ marginLeft: 16 }}>
          Date:{' '}
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </label>

        <label style={{ marginLeft: 12 }}>
          Team filter:{' '}
          <input placeholder="team name" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} />
        </label>
      </section>

      <section>
        <h2 style={{ marginTop: 0 }}>{league} — {selectedDate}</h2>

        {loading && <p>Loading schedules...</p>}
        {error && <p style={{ color: 'red' }}>Error: {String(error)}</p>}

        {!loading && !error && filteredGames.length === 0 && <p>No games scheduled for this date.</p>}

        {!loading && !error && filteredGames.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Date</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Time</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Home</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Away</th>
                {league === 'NFL' && <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Week</th>}
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((g) => (
                <tr key={g.eventId || `${g.homeTeam}-${g.awayTeam}-${g.date}-${g.time}`}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{g.date}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{g.time || 'TBD'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{g.homeTeam}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{g.awayTeam}</td>
                  {league === 'NFL' && <td style={{ padding: '8px', borderBottom: '1px solid #f3f3f3' }}>{g.week ?? '-'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer style={{ marginTop: 24, color: '#666' }}>
        <small>Data provided by backend `/api/schedules` (TheSportsDB &amp; caching). No scores or stats.</small>
      </footer>
    </main>
  )
}
