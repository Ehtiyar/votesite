const { createClient } = require('@supabase/supabase-js')
const jwt = require('jsonwebtoken')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(supabaseUrl, supabaseKey)

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

    const { adminUser, sessionId } = authResult

    if (event.httpMethod === 'GET') {
      return await getDashboardData(adminUser, sessionId, headers)
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Secure dashboard error:', error)
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
    
    // Verify session is still valid
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

    // Verify CSRF token if provided
    if (csrfToken) {
      const { data: csrfData, error: csrfError } = await supabase
        .from('csrf_tokens')
        .select('*')
        .eq('user_id', session.admin_user.id)
        .eq('session_id', session.id)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (csrfError || !csrfData) {
        return { success: false, error: 'Invalid CSRF token' }
      }
    }

    // Update session last active
    await supabase
      .from('admin_sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('id', session.id)

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

async function getDashboardData(adminUser, sessionId, headers) {
  try {
    // Paralel olarak tüm verileri çek
    const [
      usersResult,
      serversResult,
      votesResult,
      bannersResult,
      newsResult,
      recentActivitiesResult,
      authAttemptsResult,
      rateLimitsResult
    ] = await Promise.all([
      // Toplam kullanıcı sayısı
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Toplam sunucu sayısı
      supabase
        .from('servers')
        .select('id', { count: 'exact', head: true }),
      
      // Toplam oy sayısı
      supabase
        .from('votes')
        .select('id', { count: 'exact', head: true }),
      
      // Aktif banner sayısı
      supabase
        .from('banners')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Yayınlanmış haber sayısı
      supabase
        .from('news')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      
      // Son aktiviteler (audit logs)
      supabase
        .from('audit_logs')
        .select(`
          *,
          admin_user:user_id (
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Son auth attempts
      supabase
        .from('auth_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(10),
      
      // Rate limit durumu
      supabase
        .from('rate_limits')
        .select('*')
        .eq('blocked_until', null)
        .is('blocked_until', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ])

    // Son 30 günlük oy sayısı
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentVotes } = await supabase
      .from('votes')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Son 30 günlük yeni kullanıcılar
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Son 30 günlük yeni sunucular
    const { data: recentServers } = await supabase
      .from('servers')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Banner analytics
    const { data: bannerAnalytics } = await supabase
      .from('banners')
      .select('impressions, clicks, spent_amount')
      .eq('is_active', true)

    // Toplam gelir hesapla
    const totalRevenue = bannerAnalytics?.reduce((sum, banner) => sum + (banner.spent_amount || 0), 0) || 0

    // Toplam impression ve click
    const totalImpressions = bannerAnalytics?.reduce((sum, banner) => sum + (banner.impressions || 0), 0) || 0
    const totalClicks = bannerAnalytics?.reduce((sum, banner) => sum + (banner.clicks || 0), 0) || 0

    // Sunucu istatistikleri
    const { data: serverStats } = await supabase
      .from('servers')
      .select('member_count, vote_count, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    const totalPlayers = serverStats?.reduce((sum, server) => sum + (server.member_count || 0), 0) || 0
    const totalVotes = serverStats?.reduce((sum, server) => sum + (server.vote_count || 0), 0) || 0

    // Güvenlik istatistikleri
    const { data: failedAttempts } = await supabase
      .from('auth_attempts')
      .select('*')
      .eq('success', false)
      .gte('attempted_at', thirtyDaysAgo.toISOString())

    const { data: lockedAccounts } = await supabase
      .from('admin_users')
      .select('*')
      .eq('is_locked', true)

    // Chart data için son 7 günlük veriler
    const chartData = await getChartData()

    // Son 7 günlük yeni kullanıcılar (günlük breakdown)
    const newUsersLast7Days = await getNewUsersLast7Days()
    
    // Sunucu durumları
    const serverStatuses = await getServerStatuses()
    
    // En çok oy alan sunucular
    const topServersByVotes = await getTopServersByVotes()
    
    // Son aktiviteler (formatlanmış)
    const recentActivities = await getFormattedRecentActivities()

    const dashboardData = {
      totalUsers: usersResult.count || 0,
      totalServers: serversResult.count || 0,
      totalVotes: votesResult.count || 0,
      totalRevenue: totalRevenue,
      newUsersLast7Days: newUsersLast7Days,
      serverStatuses: serverStatuses,
      topServersByVotes: topServersByVotes,
      recentActivities: recentActivities,
      // Legacy data for backward compatibility
      totalImpressions: totalImpressions,
      totalClicks: totalClicks,
      totalPlayers: totalPlayers,
      activeBanners: bannersResult.count || 0,
      publishedNews: newsResult.count || 0,
      authAttempts: authAttemptsResult.data || [],
      rateLimits: rateLimitsResult.data || [],
      chartData: chartData,
      security: {
        failedAttemptsLast30Days: failedAttempts?.length || 0,
        lockedAccounts: lockedAccounts?.length || 0,
        suspiciousIPs: getSuspiciousIPs(authAttemptsResult.data || [])
      },
      stats: {
        votesLast30Days: recentVotes?.length || 0,
        usersLast30Days: recentUsers?.length || 0,
        serversLast30Days: recentServers?.length || 0,
        clickThroughRate: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0
      }
    }

    // Audit log
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        action: 'view_dashboard',
        resource_type: 'dashboard',
        session_id: sessionId
      })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dashboardData)
    }
  } catch (error) {
    console.error('Dashboard data error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch dashboard data' })
    }
  }
}

async function getChartData() {
  try {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      last7Days.push(date.toISOString().split('T')[0])
    }

    const chartData = {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('tr-TR')),
      datasets: {
        votes: [],
        users: [],
        servers: [],
        authAttempts: []
      }
    }

    // Her gün için verileri çek
    for (const date of last7Days) {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const [votesResult, usersResult, serversResult, authAttemptsResult] = await Promise.all([
        supabase
          .from('votes')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', date)
          .lt('created_at', nextDay.toISOString()),
        
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', date)
          .lt('created_at', nextDay.toISOString()),
        
        supabase
          .from('servers')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', date)
          .lt('created_at', nextDay.toISOString()),
        
        supabase
          .from('auth_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('success', false)
          .gte('attempted_at', date)
          .lt('attempted_at', nextDay.toISOString())
      ])

      chartData.datasets.votes.push(votesResult.count || 0)
      chartData.datasets.users.push(usersResult.count || 0)
      chartData.datasets.servers.push(serversResult.count || 0)
      chartData.datasets.authAttempts.push(authAttemptsResult.count || 0)
    }

    return chartData
  } catch (error) {
    console.error('Chart data error:', error)
    return {
      labels: [],
      datasets: {
        votes: [],
        users: [],
        servers: [],
        authAttempts: []
      }
    }
  }
}

async function getNewUsersLast7Days() {
  try {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      last7Days.push(date.toISOString().split('T')[0])
    }

    const result = []
    
    for (const date of last7Days) {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', date)
        .lt('created_at', nextDay.toISOString())

      result.push({
        date: date,
        count: data?.length || 0
      })
    }

    return result
  } catch (error) {
    console.error('Error getting new users last 7 days:', error)
    return []
  }
}

async function getServerStatuses() {
  try {
    const { data: servers, error } = await supabase
      .from('servers')
      .select(`
        id,
        name,
        invite_link,
        member_count,
        vote_count,
        created_at
      `)
      .order('member_count', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error getting servers:', error)
      return []
    }

    // Simulate server status (in real implementation, this would come from monitoring)
    return servers.map(server => ({
      server_id: server.id,
      name: server.name,
      status: Math.random() > 0.1 ? 'online' : 'offline', // 90% online
      players: server.member_count || Math.floor(Math.random() * 100),
      last_ping: new Date(Date.now() - Math.random() * 30000).toISOString() // Random ping within last 30 seconds
    }))
  } catch (error) {
    console.error('Error getting server statuses:', error)
    return []
  }
}

async function getTopServersByVotes() {
  try {
    const { data: servers, error } = await supabase
      .from('servers')
      .select(`
        id,
        name,
        vote_count
      `)
      .order('vote_count', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error getting top servers:', error)
      return []
    }

    return servers.map(server => ({
      server_id: server.id,
      name: server.name,
      votes: server.vote_count || 0
    }))
  } catch (error) {
    console.error('Error getting top servers by votes:', error)
    return []
  }
}

async function getFormattedRecentActivities() {
  try {
    const { data: activities, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        admin_user:user_id (
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(15)

    if (error) {
      console.error('Error getting recent activities:', error)
      return []
    }

    return activities.map(activity => ({
      type: activity.action,
      message: getActivityMessage(activity),
      created_at: activity.created_at,
      actor: activity.admin_user?.username || 'System'
    }))
  } catch (error) {
    console.error('Error formatting recent activities:', error)
    return []
  }
}

function getActivityMessage(activity) {
  const actor = activity.admin_user?.username || 'System'
  
  switch (activity.action) {
    case 'login':
      return `${actor} logged in`
    case 'logout':
      return `${actor} logged out`
    case 'create':
      return `${actor} created ${activity.resource_type}`
    case 'update':
      return `${actor} updated ${activity.resource_type}`
    case 'delete':
      return `${actor} deleted ${activity.resource_type}`
    case 'view_dashboard':
      return `${actor} viewed dashboard`
    default:
      return `${actor} performed ${activity.action} on ${activity.resource_type}`
  }
}

function getSuspiciousIPs(authAttempts) {
  const ipCounts = {}
  const suspiciousIPs = []

  authAttempts.forEach(attempt => {
    if (!attempt.success) {
      ipCounts[attempt.ip_address] = (ipCounts[attempt.ip_address] || 0) + 1
    }
  })

  Object.entries(ipCounts).forEach(([ip, count]) => {
    if (count >= 5) {
      suspiciousIPs.push({ ip, attempts: count })
    }
  })

  return suspiciousIPs.sort((a, b) => b.attempts - a.attempts)
}
