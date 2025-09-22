const { createClient } = require('@supabase/supabase-js')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(supabaseUrl, supabaseKey)

// Validation schemas
const serverCreateSchema = z.object({
  name: z.string().min(1).max(100),
  ip: z.string().ip(),
  port: z.number().int().min(1).max(65535),
  description: z.string().min(10).max(1000),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  invite_link: z.string().url().optional(),
  discord_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
  icon_url: z.string().url().optional()
})

const serverUpdateSchema = serverCreateSchema.partial()

const serverActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'feature', 'unfeature', 'verify', 'unverify', 'suspend', 'activate'])
})

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
    // Admin authentication kontrolü
    const authResult = await verifyAdminAuth(event)
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: authResult.error })
      }
    }

    const { adminUser } = authResult
    const serverId = event.path.split('/').pop()

    switch (event.httpMethod) {
      case 'GET':
        if (serverId && serverId !== 'servers') {
          return await getServer(serverId, headers)
        }
        return await getServers(event.queryStringParameters, headers)
      
      case 'POST':
        if (serverId && serverId !== 'servers') {
          return await performServerAction(serverId, event.body, adminUser, headers)
        }
        return await createServer(event.body, adminUser, headers)
      
      case 'PUT':
        return await updateServer(serverId, event.body, adminUser, headers)
      
      case 'DELETE':
        return await deleteServer(serverId, adminUser, headers)
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('Server CRUD error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function verifyAdminAuth(event) {
  const accessToken = event.headers.authorization?.replace('Bearer ', '')
  const csrfToken = event.headers['x-csrf-token']

  if (!accessToken) {
    return { success: false, error: 'No access token provided' }
  }

  try {
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
      return { success: false, error: 'Invalid or expired session' }
    }

    if (!session.admin_user.is_active || session.admin_user.is_locked) {
      return { success: false, error: 'Account is inactive or locked' }
    }

    return { 
      success: true, 
      adminUser: session.admin_user,
      sessionId: session.id
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false, error: 'Invalid token' }
  }
}

async function getServers(queryParams, headers) {
  try {
    const page = parseInt(queryParams?.page) || 1
    const limit = parseInt(queryParams?.limit) || 20
    const status = queryParams?.status
    const search = queryParams?.search
    const category = queryParams?.category
    const sortBy = queryParams?.sortBy || 'created_at'
    const sortOrder = queryParams?.sortOrder || 'desc'

    let query = supabase
      .from('servers')
      .select(`
        *,
        owner:owner_id (
          id,
          username,
          avatar_url
        )
      `)

    // Filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: servers, error, count } = await query

    if (error) {
      console.error('Error fetching servers:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch servers' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        servers,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      })
    }
  } catch (error) {
    console.error('Get servers error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch servers' })
    }
  }
}

async function getServer(serverId, headers) {
  try {
    const { data: server, error } = await supabase
      .from('servers')
      .select(`
        *,
        owner:owner_id (
          id,
          username,
          avatar_url
        ),
        reports:server_reports (
          id,
          reason,
          status,
          created_at
        ),
        votes:server_votes (
          id,
          user_id,
          created_at
        )
      `)
      .eq('id', serverId)
      .single()

    if (error) {
      console.error('Error fetching server:', error)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Server not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ server })
    }
  } catch (error) {
    console.error('Get server error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch server' })
    }
  }
}

async function createServer(body, adminUser, headers) {
  try {
    const data = JSON.parse(body)
    const validatedData = serverCreateSchema.parse(data)

    // Check if server with same IP:port already exists
    const { data: existingServer } = await supabase
      .from('servers')
      .select('id')
      .eq('ip', validatedData.ip)
      .eq('port', validatedData.port)
      .single()

    if (existingServer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Server with this IP:port already exists' })
      }
    }

    const { data: server, error } = await supabase
      .from('servers')
      .insert({
        ...validatedData,
        status: 'pending',
        next_ping_at: new Date(Date.now() + 60000).toISOString() // Ping in 1 minute
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating server:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create server' })
      }
    }

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        action: 'create',
        resource_type: 'server',
        resource_id: server.id,
        new_values: server
      })

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ server })
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Validation error', details: error.errors })
      }
    }

    console.error('Create server error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create server' })
    }
  }
}

async function updateServer(serverId, body, adminUser, headers) {
  try {
    const data = JSON.parse(body)
    const validatedData = serverUpdateSchema.parse(data)

    // Get current server data
    const { data: currentServer, error: fetchError } = await supabase
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single()

    if (fetchError || !currentServer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Server not found' })
      }
    }

    const { data: server, error } = await supabase
      .from('servers')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', serverId)
      .select()
      .single()

    if (error) {
      console.error('Error updating server:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update server' })
      }
    }

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        action: 'update',
        resource_type: 'server',
        resource_id: serverId,
        old_values: currentServer,
        new_values: server
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ server })
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Validation error', details: error.errors })
      }
    }

    console.error('Update server error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update server' })
    }
  }
}

async function performServerAction(serverId, body, adminUser, headers) {
  try {
    const data = JSON.parse(body)
    const { action } = serverActionSchema.parse(data)

    // Get current server data
    const { data: currentServer, error: fetchError } = await supabase
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single()

    if (fetchError || !currentServer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Server not found' })
      }
    }

    let updateData = {}
    let auditMessage = ''

    switch (action) {
      case 'publish':
        updateData = {
          status: 'active',
          published_at: new Date().toISOString(),
          unpublished_at: null
        }
        auditMessage = 'published'
        break

      case 'unpublish':
        updateData = {
          status: 'inactive',
          unpublished_at: new Date().toISOString()
        }
        auditMessage = 'unpublished'
        break

      case 'feature':
        updateData = {
          is_featured: true,
          featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }
        auditMessage = 'featured'
        break

      case 'unfeature':
        updateData = {
          is_featured: false,
          featured_until: null
        }
        auditMessage = 'unfeatured'
        break

      case 'verify':
        updateData = {
          is_verified: true
        }
        auditMessage = 'verified'
        break

      case 'unverify':
        updateData = {
          is_verified: false
        }
        auditMessage = 'unverified'
        break

      case 'suspend':
        updateData = {
          status: 'suspended'
        }
        auditMessage = 'suspended'
        break

      case 'activate':
        updateData = {
          status: 'active'
        }
        auditMessage = 'activated'
        break

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        }
    }

    const { data: server, error } = await supabase
      .from('servers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', serverId)
      .select()
      .single()

    if (error) {
      console.error('Error performing server action:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to perform action' })
      }
    }

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        action: 'update',
        resource_type: 'server',
        resource_id: serverId,
        old_values: currentServer,
        new_values: server
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        server,
        message: `Server ${auditMessage} successfully`
      })
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Validation error', details: error.errors })
      }
    }

    console.error('Server action error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to perform action' })
    }
  }
}

async function deleteServer(serverId, adminUser, headers) {
  try {
    // Get current server data
    const { data: currentServer, error: fetchError } = await supabase
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single()

    if (fetchError || !currentServer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Server not found' })
      }
    }

    const { error } = await supabase
      .from('servers')
      .delete()
      .eq('id', serverId)

    if (error) {
      console.error('Error deleting server:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to delete server' })
      }
    }

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        action: 'delete',
        resource_type: 'server',
        resource_id: serverId,
        old_values: currentServer
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Server deleted successfully' })
    }
  } catch (error) {
    console.error('Delete server error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete server' })
    }
  }
}
