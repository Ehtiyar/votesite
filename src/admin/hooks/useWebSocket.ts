import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketOptions {
  url: string
  accessToken: string
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export const useWebSocket = ({
  url,
  accessToken,
  onMessage,
  onError,
  onClose,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(async () => {
    try {
      // First, establish connection with Netlify Function
      const response = await fetch('/.netlify/functions/admin/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          accessToken,
          connectionId: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to establish WebSocket connection')
      }

      setConnectionId(data.connectionId)
      setIsConnected(true)
      setError(null)
      setReconnectAttempts(0)

      // Start ping interval
      pingIntervalRef.current = setInterval(async () => {
        try {
          await fetch('/.netlify/functions/admin/websocket', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'ping',
              connectionId: data.connectionId
            })
          })
        } catch (error) {
          console.error('Ping failed:', error)
        }
      }, 30000) // Ping every 30 seconds

    } catch (error) {
      console.error('WebSocket connection error:', error)
      setError(error instanceof Error ? error.message : 'Connection failed')
      setIsConnected(false)
      
      // Attempt reconnection
      if (reconnectAttempts < maxReconnectAttempts) {
        setReconnectAttempts(prev => prev + 1)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, reconnectInterval)
      }
    }
  }, [accessToken, reconnectInterval, maxReconnectAttempts, reconnectAttempts])

  const disconnect = useCallback(async () => {
    if (connectionId) {
      try {
        await fetch('/.netlify/functions/admin/websocket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'disconnect',
            connectionId
          })
        })
      } catch (error) {
        console.error('Disconnect error:', error)
      }
    }

    // Clear intervals
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setIsConnected(false)
    setConnectionId(null)
  }, [connectionId])

  const sendMessage = useCallback((message: any) => {
    if (isConnected && connectionId) {
      // In a real WebSocket implementation, you would send via WebSocket
      // For now, we'll simulate by calling the appropriate API
      console.log('Sending message:', message)
    }
  }, [isConnected, connectionId])

  // Simulate receiving server status updates
  const simulateServerUpdate = useCallback((serverId: string, status: string, players: number) => {
    if (onMessage) {
      onMessage({
        type: 'server_status_update',
        data: {
          server_id: serverId,
          status,
          players,
          last_ping: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      })
    }
  }, [onMessage])

  useEffect(() => {
    if (accessToken) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [accessToken, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    connectionId,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    simulateServerUpdate // For testing purposes
  }
}
