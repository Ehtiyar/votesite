const { createClient } = require('@supabase/supabase-js')
const jwt = require('jsonwebtoken')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(supabaseUrl, supabaseKey)

// WebSocket connections storage (in production, use Redis or similar)
const connections = new Map()

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { action, ...data } = JSON.parse(event.body || '{}')

    switch (action) {
      case 'connect':
        return await handleConnect(data, headers)
      case 'disconnect':
        return await handleDisconnect(data, headers)
      case 'ping':
        return await handlePing(data, headers)
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        }
    }
  } catch (error) {
    console.error('WebSocket error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function handleConnect(data, headers) {
  const { accessToken, connectionId } = data

  if (!accessToken || !connectionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Access token and connection ID required' })
    }
  }

  try {
    // Verify admin authentication
    const decoded = jwt.verify(accessToken, jwtSecret)
    
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_user:user_id (
          id,
          username,
          role,
          permissions,
          is_active,
          is_locked
        )
      `)
      .eq('id', decoded.sessionId)
      .eq('is_revoked', false)
      .single()

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired session' })
      }
    }

    if (!session.admin_user.is_active || session.admin_user.is_locked) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Account is inactive or locked' })
      }
    }

    // Store connection
    connections.set(connectionId, {
      userId: session.admin_user.id,
      username: session.admin_user.username,
      role: session.admin_user.role,
      connectedAt: new Date(),
      lastPing: new Date()
    })

    // Log connection
    await supabase
      .from('audit_logs')
      .insert({
        user_id: session.admin_user.id,
        action: 'websocket_connect',
        resource_type: 'websocket',
        session_id: session.id
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'WebSocket connection established',
        connectionId
      })
    }
  } catch (error) {
    console.error('WebSocket connect error:', error)
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authentication failed' })
    }
  }
}

async function handleDisconnect(data, headers) {
  const { connectionId } = data

  if (!connectionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Connection ID required' })
    }
  }

  const connection = connections.get(connectionId)
  if (connection) {
    // Log disconnection
    await supabase
      .from('audit_logs')
      .insert({
        user_id: connection.userId,
        action: 'websocket_disconnect',
        resource_type: 'websocket'
      })

    connections.delete(connectionId)
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'WebSocket connection closed'
    })
  }
}

async function handlePing(data, headers) {
  const { connectionId } = data

  if (!connectionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Connection ID required' })
    }
  }

  const connection = connections.get(connectionId)
  if (connection) {
    connection.lastPing = new Date()
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Pong',
        timestamp: new Date().toISOString()
      })
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Connection not found' })
  }
}

// Server status update function (called by monitoring system)
async function updateServerStatus(serverId, status, players, lastPing) {
  try {
    const updateData = {
      type: 'server_status_update',
      data: {
        server_id: serverId,
        status: status,
        players: players,
        last_ping: lastPing,
        timestamp: new Date().toISOString()
      }
    }

    // Broadcast to all connected clients
    for (const [connectionId, connection] of connections) {
      try {
        // In a real WebSocket implementation, you would send this data
        // For now, we'll just log it
        console.log(`Broadcasting to ${connection.username}:`, updateData)
      } catch (error) {
        console.error(`Error broadcasting to ${connectionId}:`, error)
        connections.delete(connectionId)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating server status:', error)
    return { success: false, error: error.message }
  }
}

// Cleanup inactive connections
setInterval(() => {
  const now = new Date()
  for (const [connectionId, connection] of connections) {
    const timeSinceLastPing = now - connection.lastPing
    if (timeSinceLastPing > 60000) { // 1 minute timeout
      console.log(`Cleaning up inactive connection: ${connectionId}`)
      connections.delete(connectionId)
    }
  }
}, 30000) // Check every 30 seconds

// Export for use in other functions
module.exports = {
  updateServerStatus,
  getConnections: () => connections
}
