import { useState, useEffect } from 'react'

interface ServerStatus {
  online: boolean
  players: {
    online: number
    max: number
  }
  version?: string
  motd?: string
  favicon?: string
}

interface UseServerStatusReturn {
  status: ServerStatus | null
  loading: boolean
  error: string | null
}

export function useServerStatus(serverIp: string, port: number = 25565): UseServerStatusReturn {
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serverIp) {
      setLoading(false)
      return
    }

    const fetchServerStatus = async () => {
      try {
        setLoading(true)
        setError(null)

        // Minecraft server status API kullanarak online sayısını al
        const response = await fetch(`https://api.mcsrvstat.us/2/${serverIp}:${port}`)
        
        if (!response.ok) {
          throw new Error('Server status API error')
        }

        const data = await response.json()
        
        if (data.online) {
          setStatus({
            online: true,
            players: {
              online: data.players?.online || 0,
              max: data.players?.max || 0
            },
            version: data.version,
            motd: data.motd?.clean?.[0] || data.motd?.raw?.[0] || 'Minecraft Server'
          })
        } else {
          setStatus({
            online: false,
            players: { online: 0, max: 0 }
          })
        }
      } catch (err) {
        console.error('Error fetching server status:', err)
        setError('Failed to fetch server status')
        setStatus({
          online: false,
          players: { online: 0, max: 0 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchServerStatus()

    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchServerStatus, 30000)

    return () => clearInterval(interval)
  }, [serverIp, port])

  return { status, loading, error }
}
