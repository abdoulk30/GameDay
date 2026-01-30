import { useEffect, useState } from 'react'

export default function Home() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'unreachable' }))
  }, [])

  return (
    <main style={{ padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <h1>GameDay</h1>
      <p>Next.js frontend for the GameDay project.</p>
      <h2>Backend health</h2>
      <pre>{health ? JSON.stringify(health, null, 2) : 'loading...'}</pre>
    </main>
  )
}
