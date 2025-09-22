const { createClient } = require('@supabase/supabase-js')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(supabaseUrl, supabaseKey)

// Rate limiting configuration
const VOTE_RATE_LIMITS = {
  per_user_per_server: 24 * 60 * 60 * 1000, // 24 hours
  per_ip_per_server: 24 * 60 * 60 * 1000, // 24 hours
  per_user_global: 60 * 60 * 1000 // 1 hour (max 10 votes per hour)
}

const voteSchema = z.object({
  server_id: z.string().uuid(),
  captcha_token: z.string().optional()
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
    const serverId = event.path.split('/').pop()
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'
    const userAgent = event.headers['user-agent'] || 'Unknown'

    if (event.httpMethod === 'POST') {
      return await handleVote(serverId, event.body, clientIP, userAgent, headers)
    } else if (event.httpMethod === 'GET') {
      return await getVoteStatus(serverId, event.headers, clientIP, headers)
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Server vote error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function handleVote(serverId, body, clientIP, userAgent, headers) {
  try {
    const data = JSON.parse(body)
    const { server_id, captcha_token } = voteSchema.parse({ ...data, server_id: serverId })

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

    // Get server data
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .select('*')
      .eq('id', server_id)
      .single()

    if (serverError || !server) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Server not found' })
      }
    }

    if (server.status !== 'active') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Server is not active' })
      }
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimits(server_id, user.id, clientIP)
    if (!rateLimitResult.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        })
      }
    }

    // Verify CAPTCHA if provided
    if (captcha_token) {
      const captchaValid = await verifyCaptcha(captcha_token, clientIP)
      if (!captchaValid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid CAPTCHA' })
        }
      }
    }

    // Check if user already voted today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingVote } = await supabase
      .from('server_votes')
      .select('id')
      .eq('server_id', server_id)
      .eq('user_id', user.id)
      .gte('created_at', today)
      .single()

    if (existingVote) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'You have already voted for this server today' })
      }
    }

    // Calculate reward points
    const rewardPoints = calculateRewardPoints(server)

    // Create vote record
    const { data: vote, error: voteError } = await supabase
      .from('server_votes')
      .insert({
        server_id,
        user_id: user.id,
        ip_address: clientIP,
        user_agent: userAgent,
        reward_points: rewardPoints
      })
      .select()
      .single()

    if (voteError) {
      console.error('Error creating vote:', voteError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to record vote' })
      }
    }

    // Update server vote count
    const { error: updateError } = await supabase
      .from('servers')
      .update({
        vote_count: (server.vote_count || 0) + 1
      })
      .eq('id', server_id)

    if (updateError) {
      console.error('Error updating server vote count:', updateError)
    }

    // Give reward points to user
    if (rewardPoints > 0) {
      await giveRewardPoints(user.id, rewardPoints, `Vote reward for ${server.name}`)
    }

    // Give reward points to server owner
    if (server.owner_id) {
      const ownerRewardPoints = Math.floor(rewardPoints * 0.5) // 50% of voter reward
      if (ownerRewardPoints > 0) {
        await giveRewardPoints(server.owner_id, ownerRewardPoints, `Vote reward from ${user.username} for ${server.name}`)
      }
    }

    // Log vote activity
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'vote',
        resource_type: 'server',
        resource_id: server_id,
        new_values: { vote_id: vote.id, reward_points: rewardPoints }
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Vote recorded successfully',
        reward_points: rewardPoints,
        next_vote_at: new Date(Date.now() + VOTE_RATE_LIMITS.per_user_per_server).toISOString()
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

    console.error('Handle vote error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process vote' })
    }
  }
}

async function getVoteStatus(serverId, requestHeaders, clientIP, headers) {
  try {
    // Verify user authentication
    const authResult = await verifyUserAuth(requestHeaders)
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      }
    }

    const { user } = authResult

    // Check if user can vote
    const today = new Date().toISOString().split('T')[0]
    const { data: existingVote } = await supabase
      .from('server_votes')
      .select('created_at')
      .eq('server_id', serverId)
      .eq('user_id', user.id)
      .gte('created_at', today)
      .single()

    const canVote = !existingVote
    const nextVoteAt = existingVote 
      ? new Date(new Date(existingVote.created_at).getTime() + VOTE_RATE_LIMITS.per_user_per_server).toISOString()
      : null

    // Get server vote count
    const { data: server } = await supabase
      .from('servers')
      .select('vote_count, name')
      .eq('id', serverId)
      .single()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        can_vote: canVote,
        next_vote_at: nextVoteAt,
        server_votes: server?.vote_count || 0,
        server_name: server?.name || 'Unknown'
      })
    }
  } catch (error) {
    console.error('Get vote status error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get vote status' })
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

async function checkRateLimits(serverId, userId, clientIP) {
  const now = new Date()

  // Check user vote limit for this server
  const { data: userVotes } = await supabase
    .from('server_votes')
    .select('created_at')
    .eq('server_id', serverId)
    .eq('user_id', userId)
    .gte('created_at', new Date(now.getTime() - VOTE_RATE_LIMITS.per_user_per_server).toISOString())

  if (userVotes && userVotes.length > 0) {
    const retryAfter = Math.ceil((new Date(userVotes[0].created_at).getTime() + VOTE_RATE_LIMITS.per_user_per_server - now.getTime()) / 1000)
    return { allowed: false, retryAfter }
  }

  // Check IP vote limit for this server
  const { data: ipVotes } = await supabase
    .from('server_votes')
    .select('created_at')
    .eq('server_id', serverId)
    .eq('ip_address', clientIP)
    .gte('created_at', new Date(now.getTime() - VOTE_RATE_LIMITS.per_ip_per_server).toISOString())

  if (ipVotes && ipVotes.length > 0) {
    const retryAfter = Math.ceil((new Date(ipVotes[0].created_at).getTime() + VOTE_RATE_LIMITS.per_ip_per_server - now.getTime()) / 1000)
    return { allowed: false, retryAfter }
  }

  // Check global user vote limit
  const { data: globalVotes } = await supabase
    .from('server_votes')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(now.getTime() - VOTE_RATE_LIMITS.per_user_global).toISOString())

  if (globalVotes && globalVotes.length >= 10) {
    const retryAfter = Math.ceil((new Date(globalVotes[0].created_at).getTime() + VOTE_RATE_LIMITS.per_user_global - now.getTime()) / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true }
}

function calculateRewardPoints(server) {
  let basePoints = 10

  // Bonus points for verified servers
  if (server.is_verified) {
    basePoints += 5
  }

  // Bonus points for featured servers
  if (server.is_featured) {
    basePoints += 10
  }

  // Bonus points for high player count
  if (server.current_players > 50) {
    basePoints += 5
  }

  return basePoints
}

async function giveRewardPoints(userId, points, reason) {
  try {
    // Update user balance (assuming you have a user_balances table)
    const { error } = await supabase
      .from('user_balances')
      .upsert({
        user_id: userId,
        balance: points,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating user balance:', error)
    }

    // Log reward transaction
    await supabase
      .from('reward_transactions')
      .insert({
        user_id: userId,
        points: points,
        reason: reason,
        type: 'vote_reward'
      })
  } catch (error) {
    console.error('Error giving reward points:', error)
  }
}

async function verifyCaptcha(token, clientIP) {
  // Implement CAPTCHA verification (reCAPTCHA v3)
  // This is a placeholder - implement actual CAPTCHA verification
  return true
}
