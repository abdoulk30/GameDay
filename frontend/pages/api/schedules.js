export default async function handler(req, res) {
  try {
    const { league, season } = req.query
    const params = new URLSearchParams()
    if (league) params.set('league', league)
    if (season) params.set('season', season)

    const url = `http://localhost:3000/api/schedules?${params.toString()}`
    const r = await fetch(url)
    if (!r.ok) {
      const text = await r.text()
      return res.status(502).json({ error: 'bad-backend-response', detail: text })
    }
    const data = await r.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'backend-unreachable', message: err.message })
  }
}
