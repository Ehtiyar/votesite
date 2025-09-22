const { createClient } = require('@supabase/supabase-js')
const argon2 = require('argon2')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_RULE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

const supabase = createClient(supabaseUrl, supabaseKey)

// Rate limiting configuration
const RATE_LIMITS = {
  login: { max: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  general: { max: 100, window: 60 * 60 * 1000 }, // 100 requests per hour
  refresh: { max: 10, window: 60 * 1000 } // 10 refresh attempts per minute
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
    const { action, ...data } = JSON.parse(event.body || '{}')
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'
    const userAgent = event.headers['user-agent'] || 'Unknown'

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(action, clientIP, data.username)
    if (!rateLimitResult.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter
        })
      }
    }

    switch (action) {
      case 'login':
        return await handleLogin(data, clientIP, userAgent, headers)
      case 'refresh':
        return await handleRefresh(data, clientIP, userAgent, headers)
      case 'logout':
        return await handleLogout(data, clientIP, userAgent, headers)
      case 'verify':
        return await handleVerify(data, clientIP, userAgent, headers)
      case '2fa-verify':
        return await handle2FAVerify(data, clientIP, userAgent, headers)
      case 'enable-2fa':
        return await handleEnable2FA(data, clientIP, userAgent, headers)
      case 'disable-2fa':
        return await handleDisable2FA(data, clientIP, userAgent, headers)
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        }
    }
  } catch (error) {
    console.error('Secure auth error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function checkRateLimit(action, ip, username) {
  const identifier = `${ip}:${username || 'anonymous'}`
  const endpoint = action
  const now = new Date()
  const windowStart = new Date(now.getTime() - RATE_LIMITS[action]?.window || RATE_LIMITS.general.window)

  try {
    const { data: existingLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single()

    if (existingLimit) {
      if (existingLimit.attempts >= (RATE_LIMITS[action]?.max || RATE_LIMITS.general.max)) {
        const retryAfter = Math.ceil((new Date(existingLimit.window_start).getTime() + RATE_LIMITS[action]?.window - now.getTime()) / 1000)
        return { allowed: false, retryAfter }
      }

      // Increment attempts
      await supabase
        .from('rate_limits')
        .update({ attempts: existingLimit.attempts + 1 })
        .eq('id', existingLimit.id)
    } else {
      // Create new rate limit record
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          attempts: 1,
          window_start: windowStart.toISOString()
        })
    }

    return { allowed: true }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true } // Allow on error
  }
}

async function handleLogin(data, clientIP, userAgent, headers) {
  const { username, password, totpCode } = data

  if (!username || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Username and password are required' })
    }
  }

  try {
    // Find admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single()

    if (adminError || !adminUser) {
      await logAuthAttempt(username, clientIP, userAgent, false, 'Invalid username')
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    // Check if user is active
    if (!adminUser.is_active) {
      await logAuthAttempt(username, clientIP, userAgent, false, 'Account inactive')
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Account is inactive' })
      }
    }

    // Check if account is locked
    if (adminUser.is_locked) {
      if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
        await logAuthAttempt(username, clientIP, userAgent, false, 'Account locked')
        return {
          statusCode: 423,
          headers,
          body: JSON.stringify({ 
            error: 'Account is locked',
            lockedUntil: adminUser.locked_until
          })
        }
      } else {
        // Auto-unlock expired lock
        await supabase
          .from('admin_users')
          .update({ 
            is_locked: false,
            locked_until: null,
            failed_attempts: 0
          })
          .eq('id', adminUser.id)
      }
    }

    // Verify password
    const passwordValid = await argon2.verify(adminUser.password_hash, password)
    
    if (!passwordValid) {
      // Increment failed attempts
      const newFailedAttempts = adminUser.failed_attempts + 1
      const shouldLock = newFailedAttempts >= 5
      
      await supabase
        .from('admin_users')
        .update({
          failed_attempts: newFailedAttempts,
          last_failed_at: new Date().toISOString(),
          is_locked: shouldLock,
          locked_until: shouldLock ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null // 24 hours
        })
        .eq('id', adminUser.id)

      await logAuthAttempt(username, clientIP, userAgent, false, 'Invalid password')
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    // Check 2FA if enabled
    if (adminUser.twofa_enabled) {
      if (!totpCode) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            requires2FA: true,
            message: '2FA code required'
          })
        }
      }

      const totpValid = await verifyTOTP(adminUser.twofa_secret, totpCode)
      if (!totpValid) {
        await logAuthAttempt(username, clientIP, userAgent, false, 'Invalid 2FA code')
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid 2FA code' })
        }
      }
    }

    // Successful login - reset failed attempts
    await supabase
      .from('admin_users')
      .update({
        failed_attempts: 0,
        last_failed_at: null,
        is_locked: false,
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', adminUser.id)

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const refreshToken = crypto.randomBytes(32).toString('hex')
    const refreshTokenHash = await argon2.hash(refreshToken)
    
    const fingerprint = crypto.createHash('sha256')
      .update(clientIP + userAgent + adminUser.id)
      .digest('hex')

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        user_id: adminUser.id,
        session_token: sessionToken,
        refresh_token_hash: refreshTokenHash,
        fingerprint,
        ip_address: clientIP,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create session' })
      }
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { 
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        permissions: adminUser.permissions,
        sessionId: session.id
      },
      jwtSecret,
      { expiresIn: '15m' }
    )

    const refreshJWT = jwt.sign(
      { 
        userId: adminUser.id,
        sessionId: session.id,
        type: 'refresh'
      },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    )

    // Generate CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex')
    const csrfTokenHash = await argon2.hash(csrfToken)
    
    await supabase
      .from('csrf_tokens')
      .insert({
        token_hash: csrfTokenHash,
        user_id: adminUser.id,
        session_id: session.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })

    // Log successful login
    await logAuthAttempt(username, clientIP, userAgent, true, null)
    await logAudit(adminUser.id, 'login', 'admin_session', session.id, clientIP, userAgent, session.id)

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Set-Cookie': [
          `refresh_token=${refreshJWT}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=${7 * 24 * 60 * 60}`,
          `csrf_token=${csrfToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=${24 * 60 * 60}`
        ]
      },
      body: JSON.stringify({
        success: true,
        accessToken,
        csrfToken,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          permissions: adminUser.permissions,
          twofaEnabled: adminUser.twofa_enabled
        }
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    await logAuthAttempt(username, clientIP, userAgent, false, 'Server error')
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Login failed' })
    }
  }
}

async function handleRefresh(data, clientIP, userAgent, headers) {
  const refreshToken = data.refreshToken || 
    event.headers.cookie?.match(/refresh_token=([^;]+)/)?.[1]

  if (!refreshToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Refresh token required' })
    }
  }

  try {
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret)
    
    // Find session
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

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        userId: session.admin_user.id,
        username: session.admin_user.username,
        role: session.admin_user.role,
        permissions: session.admin_user.permissions,
        sessionId: session.id
      },
      jwtSecret,
      { expiresIn: '15m' }
    )

    // Update session last active
    await supabase
      .from('admin_sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('id', session.id)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        accessToken: newAccessToken
      })
    }
  } catch (error) {
    console.error('Refresh error:', error)
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid refresh token' })
    }
  }
}

async function handleLogout(data, clientIP, userAgent, headers) {
  const accessToken = data.accessToken || 
    event.headers.authorization?.replace('Bearer ', '')

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, jwtSecret)
      
      // Revoke session
      await supabase
        .from('admin_sessions')
        .update({ is_revoked: true })
        .eq('id', decoded.sessionId)

      // Log logout
      await logAudit(decoded.userId, 'logout', 'admin_session', decoded.sessionId, clientIP, userAgent, decoded.sessionId)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Set-Cookie': [
        'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=0',
        'csrf_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0'
      ]
    },
    body: JSON.stringify({ success: true })
  }
}

async function handleVerify(data, clientIP, userAgent, headers) {
  const accessToken = data.accessToken || 
    event.headers.authorization?.replace('Bearer ', '')

  if (!accessToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Access token required' })
    }
  }

  try {
    const decoded = jwt.verify(accessToken, jwtSecret)
    
    // Verify session is still valid
    const { data: session, error } = await supabase
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

    if (error || !session || new Date(session.expires_at) < new Date()) {
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        user: {
          id: session.admin_user.id,
          username: session.admin_user.username,
          role: session.admin_user.role,
          permissions: session.admin_user.permissions
        }
      })
    }
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    }
  }
}

async function handle2FAVerify(data, clientIP, userAgent, headers) {
  // 2FA verification logic
  return {
    statusCode: 501,
    headers,
    body: JSON.stringify({ error: '2FA not implemented yet' })
  }
}

async function handleEnable2FA(data, clientIP, userAgent, headers) {
  // 2FA enable logic
  return {
    statusCode: 501,
    headers,
    body: JSON.stringify({ error: '2FA not implemented yet' })
  }
}

async function handleDisable2FA(data, clientIP, userAgent, headers) {
  // 2FA disable logic
  return {
    statusCode: 501,
    headers,
    body: JSON.stringify({ error: '2FA not implemented yet' })
  }
}

async function verifyTOTP(secret, code) {
  // TOTP verification logic
  // This would use a library like 'speakeasy' or 'otplib'
  return true // Placeholder
}

async function logAuthAttempt(username, ip, userAgent, success, failureReason) {
  try {
    await supabase
      .from('auth_attempts')
      .insert({
        username,
        ip_address: ip,
        user_agent: userAgent,
        success,
        failure_reason: failureReason
      })
  } catch (error) {
    console.error('Auth attempt logging error:', error)
  }
}

async function logAudit(userId, action, resourceType, resourceId, ip, userAgent, sessionId) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ip,
        user_agent: userAgent,
        session_id: sessionId
      })
  } catch (error) {
    console.error('Audit logging error:', error)
  }
}
