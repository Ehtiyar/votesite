const { createClient } = require('@supabase/supabase-js')
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

    if (event.httpMethod === 'GET') {
      return await getDashboardData(adminUser, headers)
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Dashboard error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function verifyAdminAuth(event) {
  const token = event.headers.authorization?.replace('Bearer ', '') || 
                event.headers.cookie?.match(/admin_session=([^;]+)/)?.[1]

  if (!token) {
    return { success: false, error: 'No token provided' }
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', decoded.adminUserId)
      .eq('is_active', true)
      .single()

    if (error || !adminUser) {
      return { success: false, error: 'Invalid token' }
    }

    return { success: true, adminUser }
  } catch (error) {
    return { success: false, error: 'Invalid token' }
  }
}

async function getDashboardData(adminUser, headers) {
  try {
    // Paralel olarak tüm verileri çek
    const [
      usersResult,
      serversResult,
      votesResult,
      bannersResult,
      newsResult,
      recentActivitiesResult,
      serverStatsResult
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
          admin_user:admin_user_id (
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Sunucu istatistikleri
      supabase
        .from('servers')
        .select('member_count, vote_count, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
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
    const totalPlayers = serverStatsResult.data?.reduce((sum, server) => sum + (server.member_count || 0), 0) || 0
    const totalVotes = serverStatsResult.data?.reduce((sum, server) => sum + (server.vote_count || 0), 0) || 0

    // Chart data için son 7 günlük veriler
    const chartData = await getChartData()

    const dashboardData = {
      totalUsers: usersResult.count || 0,
      totalServers: serversResult.count || 0,
      totalVotes: votesResult.count || 0,
      totalRevenue: totalRevenue,
      totalImpressions: totalImpressions,
      totalClicks: totalClicks,
      totalPlayers: totalPlayers,
      activeBanners: bannersResult.count || 0,
      publishedNews: newsResult.count || 0,
      recentActivities: recentActivitiesResult.data || [],
      chartData: chartData,
      stats: {
        votesLast30Days: recentVotes?.length || 0,
        usersLast30Days: recentUsers?.length || 0,
        serversLast30Days: recentServers?.length || 0,
        clickThroughRate: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0
      }
    }

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
        servers: []
      }
    }

    // Her gün için verileri çek
    for (const date of last7Days) {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const [votesResult, usersResult, serversResult] = await Promise.all([
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
          .lt('created_at', nextDay.toISOString())
      ])

      chartData.datasets.votes.push(votesResult.count || 0)
      chartData.datasets.users.push(usersResult.count || 0)
      chartData.datasets.servers.push(serversResult.count || 0)
    }

    return chartData
  } catch (error) {
    console.error('Chart data error:', error)
    return {
      labels: [],
      datasets: {
        votes: [],
        users: [],
        servers: []
      }
    }
  }
}
