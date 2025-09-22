const { createClient } = require('@supabase/supabase-js')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(supabaseUrl, supabaseKey)

// Validation schemas
const reportCreateSchema = z.object({
  server_id: z.string().uuid(),
  reason: z.enum(['inappropriate_content', 'spam', 'fake_server', 'broken_server', 'other']),
  description: z.string().min(10).max(500)
})

const reportUpdateSchema = z.object({
  status: z.enum(['pending', 'investigating', 'resolved', 'dismissed']),
  admin_notes: z.string().max(1000).optional()
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
    const reportId = event.path.split('/').pop()
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'

    if (event.httpMethod === 'POST' && !reportId) {
      return await createReport(event.body, clientIP, headers)
    } else if (event.httpMethod === 'GET' && !reportId) {
      return await getReports(event.queryStringParameters, headers)
    } else if (event.httpMethod === 'GET' && reportId) {
      return await getReport(reportId, headers)
    } else if (event.httpMethod === 'PUT' && reportId) {
      return await updateReport(reportId, event.body, headers)
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Server reports error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function createReport(body, clientIP, headers) {
  try {
    const data = JSON.parse(body)
    const { server_id, reason, description } = reportCreateSchema.parse(data)

    // Verify user authentication
    const authResult = await verifyUserAuth(event.headers)
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      }
    }

    const { user } = authResult

    // Check if server exists
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .select('id, name')
      .eq('id', server_id)
      .single()

    if (serverError || !server) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Server not found' })
      }
    }

    // Check if user already reported this server recently
    const { data: existingReport } = await supabase
      .from('server_reports')
      .select('id')
      .eq('server_id', server_id)
      .eq('reporter_id', user.id)
      .eq('status', 'pending')
      .single()

    if (existingReport) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'You have already reported this server' })
      }
    }

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('server_reports')
      .insert({
        server_id,
        reporter_id: user.id,
        reason,
        description,
        status: 'pending'
      })
      .select(`
        *,
        server:server_id (
          id,
          name
        ),
        reporter:reporter_id (
          id,
          username
        )
      `)
      .single()

    if (reportError) {
      console.error('Error creating report:', reportError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create report' })
      }
    }

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'create',
        resource_type: 'server_report',
        resource_id: report.id,
        new_values: { server_id, reason, description }
      })

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        report,
        message: 'Report submitted successfully'
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

    console.error('Create report error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create report' })
    }
  }
}

async function getReports(queryParams, headers) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(event.headers)
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Admin authentication required' })
      }
    }

    const page = parseInt(queryParams?.page) || 1
    const limit = parseInt(queryParams?.limit) || 20
    const status = queryParams?.status
    const server_id = queryParams?.server_id

    let query = supabase
      .from('server_reports')
      .select(`
        *,
        server:server_id (
          id,
          name,
          ip,
          port
        ),
        reporter:reporter_id (
          id,
          username,
          avatar_url
        ),
        resolved_by_admin:resolved_by (
          id,
          username
        )
      `)

    // Filters
    if (status) {
      query = query.eq('status', status)
    }

    if (server_id) {
      query = query.eq('server_id', server_id)
    }

    // Sorting
    query = query.order('created_at', { ascending: false })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch reports' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reports,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      })
    }
  } catch (error) {
    console.error('Get reports error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch reports' })
    }
  }
}

async function getReport(reportId, headers) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(event.headers)
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Admin authentication required' })
      }
    }

    const { data: report, error } = await supabase
      .from('server_reports')
      .select(`
        *,
        server:server_id (
          id,
          name,
          ip,
          port,
          description,
          owner_id
        ),
        reporter:reporter_id (
          id,
          username,
          avatar_url
        ),
        resolved_by_admin:resolved_by (
          id,
          username
        )
      `)
      .eq('id', reportId)
      .single()

    if (error || !report) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Report not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ report })
    }
  } catch (error) {
    console.error('Get report error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch report' })
    }
  }
}

async function updateReport(reportId, body, headers) {
  try {
    const data = JSON.parse(body)
    const { status, admin_notes } = reportUpdateSchema.parse(data)

    // Verify admin authentication
    const authResult = await verifyAdminAuth(event.headers)
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Admin authentication required' })
      }
    }

    const { adminUser } = authResult

    // Get current report data
    const { data: currentReport, error: fetchError } = await supabase
      .from('server_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (fetchError || !currentReport) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Report not found' })
      }
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes
    }

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_by = adminUser.id
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: report, error: updateError } = await supabase
      .from('server_reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        *,
        server:server_id (
          id,
          name
        ),
        reporter:reporter_id (
          id,
          username
        ),
        resolved_by_admin:resolved_by (
          id,
          username
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating report:', updateError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update report' })
      }
    }

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        action: 'update',
        resource_type: 'server_report',
        resource_id: reportId,
        old_values: currentReport,
        new_values: report
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        report,
        message: 'Report updated successfully'
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

    console.error('Update report error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update report' })
    }
  }
}

async function verifyUserAuth(headers) {
  const accessToken = headers.authorization?.replace('Bearer ', '')

  if (!accessToken) {
    return { success: false, error: 'No access token provided' }
  }

  try {
    const decoded = jwt.verify(accessToken, jwtSecret)
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.sub)
      .single()

    if (error || !user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false, error: 'Invalid token' }
  }
}

async function verifyAdminAuth(headers) {
  const accessToken = headers.authorization?.replace('Bearer ', '')

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
