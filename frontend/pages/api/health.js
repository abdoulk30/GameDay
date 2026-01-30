export default async function handler(req, res) {
  try {
    const r = await fetch('http://localhost:3000/api/health')
    const data = await r.json()
    res.status(200).json(data)
  } catch (err) {
    res.status(502).json({ error: 'backend-unreachable' })
  }
}
