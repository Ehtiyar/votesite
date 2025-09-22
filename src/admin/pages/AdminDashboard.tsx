import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Server, 
  Trophy, 
  DollarSign, 
  Eye, 
  MousePointer, 
  TrendingUp,
  Activity,
  BarChart3,
  LogOut,
  Settings,
  Bell
} from 'lucide-react'
import KPICard from '../components/KPICard'
import LineChart from '../components/LineChart'
import BarChart from '../components/BarChart'
import TopServersTable from '../components/TopServersTable'
import ActivitiesTimeline from '../components/ActivitiesTimeline'
import { useWebSocket } from '../hooks/useWebSocket'

interface DashboardData {
  totalUsers: number
  totalServers: number
  totalVotes: number
  totalRevenue: number
  newUsersLast7Days: Array<{ date: string; count: number }>
  serverStatuses: Array<{
    server_id: string
    name: string
    status: string
    players: number
    last_ping: string
  }>
  topServersByVotes: Array<{
    server_id: string
    name: string
    votes: number
  }>
  recentActivities: Array<{
    type: string
    message: string
    created_at: string
    actor: string
  }>
  // Legacy data for backward compatibility
  totalImpressions: number
  totalClicks: number
  totalPlayers: number
  activeBanners: number
  publishedNews: number
  chartData: {
    labels: string[]
    datasets: {
      votes: number[]
      users: number[]
      servers: number[]
    }
  }
  stats: {
    votesLast30Days: number
    usersLast30Days: number
    serversLast30Days: number
    clickThroughRate: string
  }
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [realTimeServerStatuses, setRealTimeServerStatuses] = useState<Array<{
    server_id: string
    name: string
    status: string
    players: number
    last_ping: string
  }>>([])
  const navigate = useNavigate()

  // WebSocket connection
  const accessToken = localStorage.getItem('admin_access_token')
  const { isConnected, error: wsError } = useWebSocket({
    url: '/ws/admin',
    accessToken: accessToken || '',
    onMessage: (message) => {
      if (message.type === 'server_status_update') {
        setRealTimeServerStatuses(prev => {
          const updated = prev.filter(s => s.server_id !== message.data.server_id)
          return [...updated, message.data]
        })
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    }
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const accessToken = localStorage.getItem('admin_access_token')
      const csrfToken = localStorage.getItem('admin_csrf_token')
      
      if (!accessToken) {
        navigate('/admin/login')
        return
      }

      const response = await fetch('/.netlify/functions/admin/secure-dashboard', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_csrf_token')
        localStorage.removeItem('admin_user')
        navigate('/admin/login')
        return
      }

      const data = await response.json()

      if (response.ok) {
        setDashboardData(data)
      } else {
        setError(data.error || 'Veri yüklenemedi')
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem('admin_access_token')
      if (accessToken) {
        await fetch('/.netlify/functions/admin/secure-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'logout',
            accessToken
          })
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_csrf_token')
      localStorage.removeItem('admin_user')
      navigate('/admin/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Dashboard yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Hata</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  // Use real-time server statuses if available, otherwise fall back to dashboard data
  const currentServerStatuses = realTimeServerStatuses.length > 0 
    ? realTimeServerStatuses 
    : dashboardData?.serverStatuses || []

  // Prepare revenue data for bar chart
  const revenueData = [
    { label: 'Banner', value: dashboardData?.totalRevenue || 0 },
    { label: 'Premium', value: 0 }, // Placeholder for premium features
    { label: 'Ads', value: 0 } // Placeholder for ad revenue
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">MineVote Yönetim Paneli</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Toplam Kullanıcı"
            value={dashboardData?.totalUsers || 0}
            icon={Users}
            color="from-blue-500 to-blue-600"
            change={`+${dashboardData?.stats.usersLast30Days || 0} son 30 gün`}
            changeType="positive"
            loading={loading}
          />
          <KPICard
            title="Toplam Sunucu"
            value={dashboardData?.totalServers || 0}
            icon={Server}
            color="from-green-500 to-green-600"
            change={`+${dashboardData?.stats.serversLast30Days || 0} son 30 gün`}
            changeType="positive"
            loading={loading}
          />
          <KPICard
            title="Toplam Oy"
            value={dashboardData?.totalVotes || 0}
            icon={Trophy}
            color="from-yellow-500 to-yellow-600"
            change={`+${dashboardData?.stats.votesLast30Days || 0} son 30 gün`}
            changeType="positive"
            loading={loading}
          />
          <KPICard
            title="Toplam Gelir"
            value={`$${dashboardData?.totalRevenue.toFixed(2) || '0.00'}`}
            icon={DollarSign}
            color="from-purple-500 to-purple-600"
            change="Banner gelirleri"
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LineChart
            title="Son 7 Günlük Yeni Kullanıcılar"
            data={dashboardData?.newUsersLast7Days || []}
            color="#3b82f6"
            loading={loading}
          />
          <BarChart
            title="Gelir Dağılımı"
            data={revenueData}
            color="#10b981"
            loading={loading}
          />
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TopServersTable
            title="En Çok Oy Alan Sunucular"
            data={dashboardData?.topServersByVotes || []}
            loading={loading}
          />
          <ActivitiesTimeline
            title="Son Aktiviteler"
            data={dashboardData?.recentActivities || []}
            loading={loading}
          />
        </div>

        {/* Real-time Server Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Server className="h-6 w-6" />
              <span>Sunucu Durumları</span>
              {isConnected && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">Canlı</span>
                </div>
              )}
            </h2>
            <div className="text-sm text-gray-400">
              {currentServerStatuses.length} sunucu
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentServerStatuses.map((server) => (
              <div
                key={server.server_id}
                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium truncate">{server.name}</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    server.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                </div>
                <div className="text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{server.players} oyuncu</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Son ping: {new Date(server.last_ping).toLocaleTimeString('tr-TR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
