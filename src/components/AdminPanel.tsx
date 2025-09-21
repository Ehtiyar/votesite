import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Server, 
  Trophy, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface AdminStats {
  totalUsers: number
  totalServers: number
  totalVotes: number
  totalRevenue: number
}

interface BannerAd {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  position: string
  is_active: boolean
  created_at: string
}

export function AdminPanel() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalServers: 0,
    totalVotes: 0,
    totalRevenue: 0
  })
  const [banners, setBanners] = useState<BannerAd[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchBanners()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const [usersResult, serversResult, votesResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('servers').select('id', { count: 'exact', head: true }),
        supabase.from('votes').select('id', { count: 'exact', head: true })
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalServers: serversResult.count || 0,
        totalVotes: votesResult.count || 0,
        totalRevenue: 0 // Bu daha sonra payment tablosundan gelecek
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_ads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const addBanner = async () => {
    try {
      const { error } = await supabase
        .from('banner_ads')
        .insert([
          {
            title: 'Yeni Banner',
            description: 'Banner açıklaması',
            image_url: '',
            link_url: '',
            position: 'top-left',
            is_active: false
          }
        ])

      if (error) throw error
      fetchBanners()
    } catch (error) {
      console.error('Error adding banner:', error)
    }
  }

  const updateBanner = async (id: string, updates: Partial<BannerAd>) => {
    try {
      const { error } = await supabase
        .from('banner_ads')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      fetchBanners()
    } catch (error) {
      console.error('Error updating banner:', error)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Bu bannerı silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('banner_ads')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
    }
  }

  const statCards = [
    { label: 'Toplam Üye', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Toplam Sunucu', value: stats.totalServers, icon: Server, color: 'from-green-500 to-green-600' },
    { label: 'Toplam Oy', value: stats.totalVotes, icon: Trophy, color: 'from-purple-500 to-purple-600' },
    { label: 'Toplam Gelir', value: `₺${stats.totalRevenue}`, icon: DollarSign, color: 'from-orange-500 to-orange-600' },
  ]

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'banners', label: 'Banner Yönetimi', icon: Settings },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'servers', label: 'Sunucular', icon: Server },
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-400">Admin paneline erişmek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">⚙️ Admin Paneli</h1>
        <p className="text-gray-400">Site yönetimi ve istatistikler</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-r ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Son Aktiviteler</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Yeni sunucu eklendi: "MegaCraft"</span>
                <span className="text-gray-500 text-sm">2 saat önce</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Yeni üye kaydı: "Ehtiyars"</span>
                <span className="text-gray-500 text-sm">5 saat önce</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Banner güncellendi: "KALİTENİN ADRESİ"</span>
                <span className="text-gray-500 text-sm">1 gün önce</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Banner Yönetimi</h3>
            <button
              onClick={addBanner}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Banner</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse">
                  <div className="h-32 bg-gray-600 rounded mb-4"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="mb-4">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Resim Yok</span>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="text-lg font-bold text-white mb-2">{banner.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{banner.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      banner.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {banner.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                    <span className="text-gray-400 text-xs">{banner.position}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateBanner(banner.id, { is_active: !banner.is_active })}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Eye className="h-3 w-3" />
                      <span>{banner.is_active ? 'Pasifleştir' : 'Aktifleştir'}</span>
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Kullanıcı Yönetimi</h3>
          <p className="text-gray-400">Kullanıcı yönetimi özellikleri yakında eklenecek...</p>
        </div>
      )}

      {/* Servers Tab */}
      {activeTab === 'servers' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Sunucu Yönetimi</h3>
          <p className="text-gray-400">Sunucu yönetimi özellikleri yakında eklenecek...</p>
        </div>
      )}
    </div>
  )
}
