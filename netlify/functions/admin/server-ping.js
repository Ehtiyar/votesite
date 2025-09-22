const { createClient } = require('@supabase/supabase-js')
const jwt = require('jsonwebtoken')
const net = require('net')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(supabaseUrl, supabaseKey)

// Minecraft Server List Ping Protocol implementation
class MCPing {
  constructor(host, port = 25565) {
    this.host = host
    this.port = port
    this.timeout = 5000 // 5 seconds
  }

  async ping() {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket()
      const startTime = Date.now()

      socket.setTimeout(this.timeout)

      socket.on('connect', () => {
        // Send handshake packet
        const handshake = this.createHandshakePacket()
        socket.write(handshake)

        // Send status request
        const statusRequest = Buffer.from([0x00])
        socket.write(statusRequest)
      })

      socket.on('data', (data) => {
        try {
          const response = this.parseResponse(data)
          const ping = Date.now() - startTime
          
          resolve({
            status: 'online',
            ping: ping,
            ...response
          })
        } catch (error) {
          reject(error)
        } finally {
          socket.destroy()
        }
      })

      socket.on('error', (error) => {
        reject(error)
        socket.destroy()
      })

      socket.on('timeout', () => {
        reject(new Error('Connection timeout'))
        socket.destroy()
      })

      socket.connect(this.port, this.host)
    })
  }

  createHandshakePacket() {
    const protocolVersion = Buffer.from([0x00, 0x00]) // Protocol version 0
    const serverAddress = Buffer.from(this.host, 'utf8')
    const serverPort = Buffer.alloc(2)
    serverPort.writeUInt16BE(this.port, 0)
    const nextState = Buffer.from([0x01]) // Status state

    // Create packet
    const packetData = Buffer.concat([
      protocolVersion,
      this.writeVarInt(serverAddress.length),
      serverAddress,
      serverPort,
      nextState
    ])

    return Buffer.concat([
      this.writeVarInt(packetData.length),
      packetData
    ])
  }

  writeVarInt(value) {
    const buffer = Buffer.alloc(5)
    let position = 0

    while (true) {
      if ((value & 0xFFFFFF80) === 0) {
        buffer[position] = value
        break
      }

      buffer[position] = (value & 0x7F) | 0x80
      value >>>= 7
      position++
    }

    return buffer.slice(0, position + 1)
  }

  parseResponse(data) {
    let offset = 0

    // Skip packet length
    offset += this.readVarInt(data, offset).length

    // Skip packet ID
    offset += this.readVarInt(data, offset).length

    // Read JSON response
    const jsonLength = this.readVarInt(data, offset)
    offset += jsonLength.length

    const jsonData = data.slice(offset, offset + jsonLength.value)
    const response = JSON.parse(jsonData.toString('utf8'))

    return {
      version: response.version?.name || 'Unknown',
      motd: this.parseMotd(response.description),
      current_players: response.players?.online || 0,
      max_players: response.players?.max || 0,
      favicon: response.favicon || null
    }
  }

  readVarInt(buffer, offset) {
    let value = 0
    let position = 0
    let currentByte

    while (true) {
      currentByte = buffer[offset + position]
      value |= (currentByte & 0x7F) << (position * 7)

      if ((currentByte & 0x80) === 0) {
        break
      }

      position++
      if (position >= 5) {
        throw new Error('VarInt too long')
      }
    }

    return {
      value: value >>> 0, // Convert to unsigned
      length: position + 1
    }
  }

  parseMotd(description) {
    if (typeof description === 'string') {
      return description
    }

    if (description && description.text) {
      return description.text
    }

    if (description && description.extra) {
      return description.extra.map(part => part.text || '').join('')
    }

    return 'A Minecraft Server'
  }
}

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
    const { action, server_id, ip, port } = JSON.parse(event.body || '{}')

    switch (action) {
      case 'ping_server':
        return await pingServer(server_id, headers)
      case 'ping_manual':
        return await pingManual(ip, port, headers)
      case 'ping_all':
        return await pingAllServers(headers)
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        }
    }
  } catch (error) {
    console.error('Server ping error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function pingServer(serverId, headers) {
  try {
    // Get server data
    const { data: server, error: fetchError } = await supabase
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single()

    if (fetchError || !server) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Server not found' })
      }
    }

    if (!server.ip || !server.port) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Server IP or port not configured' })
      }
    }

    // Validate IP (prevent SSRF)
    if (!isValidIP(server.ip)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid IP address' })
      }
    }

    // Ping the server
    const mcPing = new MCPing(server.ip, server.port)
    const pingResult = await mcPing.ping()

    // Update server with ping results
    const { data: updatedServer, error: updateError } = await supabase
      .from('servers')
      .update({
        status: 'active',
        current_players: pingResult.current_players,
        max_players: pingResult.max_players,
        motd: pingResult.motd,
        version: pingResult.version,
        last_ping_at: new Date().toISOString(),
        next_ping_at: new Date(Date.now() + (server.ping_frequency || 60) * 1000).toISOString()
      })
      .eq('id', serverId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating server:', updateError)
    }

    // Save ping history
    await supabase
      .from('server_ping_history')
      .insert({
        server_id: serverId,
        status: 'online',
        current_players: pingResult.current_players,
        max_players: pingResult.max_players,
        ping_ms: pingResult.ping,
        motd: pingResult.motd,
        version: pingResult.version
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        server: updatedServer,
        ping_result: pingResult
      })
    }
  } catch (error) {
    console.error('Ping server error:', error)

    // Update server as offline
    await supabase
      .from('servers')
      .update({
        status: 'inactive',
        last_ping_at: new Date().toISOString(),
        next_ping_at: new Date(Date.now() + 300000).toISOString() // Retry in 5 minutes
      })
      .eq('id', serverId)

    // Save ping history with error
    await supabase
      .from('server_ping_history')
      .insert({
        server_id: serverId,
        status: 'offline',
        error_message: error.message
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        server_id: serverId
      })
    }
  }
}

async function pingManual(ip, port, headers) {
  try {
    // Validate IP (prevent SSRF)
    if (!isValidIP(ip)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid IP address' })
      }
    }

    // Ping the server
    const mcPing = new MCPing(ip, port)
    const pingResult = await mcPing.ping()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ping_result: pingResult
      })
    }
  } catch (error) {
    console.error('Manual ping error:', error)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

async function pingAllServers(headers) {
  try {
    // Get all servers that need pinging
    const { data: servers, error } = await supabase
      .from('servers')
      .select('*')
      .lte('next_ping_at', new Date().toISOString())
      .not('ip', 'is', null)
      .not('port', 'is', null)

    if (error) {
      console.error('Error fetching servers:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch servers' })
      }
    }

    const results = []

    // Ping each server
    for (const server of servers) {
      try {
        // Validate IP (prevent SSRF)
        if (!isValidIP(server.ip)) {
          results.push({
            server_id: server.id,
            success: false,
            error: 'Invalid IP address'
          })
          continue
        }

        const mcPing = new MCPing(server.ip, server.port)
        const pingResult = await mcPing.ping()

        // Update server
        await supabase
          .from('servers')
          .update({
            status: 'active',
            current_players: pingResult.current_players,
            max_players: pingResult.max_players,
            motd: pingResult.motd,
            version: pingResult.version,
            last_ping_at: new Date().toISOString(),
            next_ping_at: new Date(Date.now() + (server.ping_frequency || 60) * 1000).toISOString()
          })
          .eq('id', server.id)

        // Save ping history
        await supabase
          .from('server_ping_history')
          .insert({
            server_id: server.id,
            status: 'online',
            current_players: pingResult.current_players,
            max_players: pingResult.max_players,
            ping_ms: pingResult.ping,
            motd: pingResult.motd,
            version: pingResult.version
          })

        results.push({
          server_id: server.id,
          success: true,
          ping_result: pingResult
        })
      } catch (error) {
        console.error(`Error pinging server ${server.id}:`, error)

        // Update server as offline
        await supabase
          .from('servers')
          .update({
            status: 'inactive',
            last_ping_at: new Date().toISOString(),
            next_ping_at: new Date(Date.now() + 300000).toISOString() // Retry in 5 minutes
          })
          .eq('id', server.id)

        // Save ping history with error
        await supabase
          .from('server_ping_history')
          .insert({
            server_id: server.id,
            status: 'offline',
            error_message: error.message
          })

        results.push({
          server_id: server.id,
          success: false,
          error: error.message
        })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results,
        total_servers: servers.length,
        successful_pings: results.filter(r => r.success).length,
        failed_pings: results.filter(r => !r.success).length
      })
    }
  } catch (error) {
    console.error('Ping all servers error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to ping servers' })
    }
  }
}

function isValidIP(ip) {
  // Check if IP is valid and not internal
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  
  if (!ipRegex.test(ip)) {
    return false
  }

  // Check for internal IPs (SSRF protection)
  const internalIPs = [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
  ]

  // Check for localhost
  if (ip === '127.0.0.1' || ip === 'localhost') {
    return false
  }

  // Check for private networks
  const parts = ip.split('.').map(Number)
  
  // 10.0.0.0/8
  if (parts[0] === 10) {
    return false
  }
  
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return false
  }
  
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) {
    return false
  }

  return true
}
