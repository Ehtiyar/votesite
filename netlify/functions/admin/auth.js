const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { action, ...data } = JSON.parse(event.body || '{}')

    switch (action) {
      case 'login':
        return await handleLogin(data, headers)
      case 'verify':
        return await handleVerify(data, headers)
      case 'logout':
        return await handleLogout(data, headers)
      case 'refresh':
        return await handleRefresh(data, headers)
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        }
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function handleLogin(data, headers) {
  const { username, password } = data

  if (!username || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Username and password are required' })
    }
  }

  try {
    // Admin kullanıcısını bul
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        *,
        auth_user:user_id (
          id,
          email
        )
      `)
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    // Account lockout kontrolü
    if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
      return {
        statusCode: 423,
        headers,
        body: JSON.stringify({ 
          error: 'Account is locked',
          locked_until: adminUser.locked_until
        })
      }
    }

    // Supabase Auth ile giriş yap
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminUser.auth_user.email,
      password: password
    })

    if (authError) {
      // Başarısız giriş sayısını artır
      await supabase
        .from('admin_users')
        .update({ 
          login_attempts: adminUser.login_attempts + 1,
          locked_until: adminUser.login_attempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 dakika kilitle
        })
        .eq('id', adminUser.id)

      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    // Başarılı giriş - login attempts'i sıfırla
    await supabase
      .from('admin_users')
      .update({ 
        login_attempts: 0,
        locked_until: null,
        last_login: new Date()
      })
      .eq('id', adminUser.id)

    // JWT token oluştur
    const token = jwt.sign(
      { 
        adminUserId: adminUser.id,
        userId: adminUser.user_id,
        role: adminUser.role,
        permissions: adminUser.permissions
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // Session kaydet
    const sessionToken = jwt.sign(
      { adminUserId: adminUser.id },
      jwtSecret,
      { expiresIn: '7d' }
    )

    await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUser.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün
        ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        user_agent: event.headers['user-agent']
      })

    // Audit log
    await supabase
      .from('audit_logs')
      .insert({
        admin_user_id: adminUser.id,
        action: 'login',
        resource_type: 'admin_session',
        ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        user_agent: event.headers['user-agent']
      })

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Set-Cookie': `admin_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
      },
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          permissions: adminUser.permissions
        }
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Login failed' })
    }
  }
}

async function handleVerify(data, headers) {
  const token = data.token || event.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token required' })
    }
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    
    // Admin kullanıcısını kontrol et
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', decoded.adminUserId)
      .eq('is_active', true)
      .single()

    if (error || !adminUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          permissions: adminUser.permissions
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

async function handleLogout(data, headers) {
  const token = data.token || event.headers.authorization?.replace('Bearer ', '')

  if (token) {
    try {
      const decoded = jwt.verify(token, jwtSecret)
      
      // Session'ı sil
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('admin_user_id', decoded.adminUserId)
        .eq('session_token', token)

      // Audit log
      await supabase
        .from('audit_logs')
        .insert({
          admin_user_id: decoded.adminUserId,
          action: 'logout',
          resource_type: 'admin_session',
          ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
          user_agent: event.headers['user-agent']
        })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Set-Cookie': 'admin_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    },
    body: JSON.stringify({ success: true })
  }
}

async function handleRefresh(data, headers) {
  const token = data.token || event.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token required' })
    }
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    
    // Yeni token oluştur
    const newToken = jwt.sign(
      { 
        adminUserId: decoded.adminUserId,
        userId: decoded.userId,
        role: decoded.role,
        permissions: decoded.permissions
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: newToken
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
