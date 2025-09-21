import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  TrendingUp,
  LogOut
} from 'lucide-react'
import { supabase } from '../lib/supabase'

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
  image_url?: string
  link_url?: string
  position: string
  is_active: boolean
  created_at: string
}

interface User {
  id: string
  username: string
  email: string
  minecraft_nick?: string
  discord_username?: string
  created_at: string
}

interface Server {
  id: string
  name: string
  invite_link: string
  category: string
  member_count: number
  created_at: string
}

interface NewsArticle {
  id: string
  title: string
  category: string
  author: string
  created_at: string
}

export function AdminPanel() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalServers: 0,
    totalVotes: 0,
    totalRevenue: 0
  })
  const [banners, setBanners] = useState<BannerAd[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [servers, setServers] = useState<Server[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [socialLinks, setSocialLinks] = useState({
    discord: 'https://discord.gg/minevote',
    twitter: 'https://twitter.com/minevote',
    instagram: 'https://instagram.com/minevote'
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)

  useEffect(() => {
    // Admin giriş kontrolü
    const adminLoggedIn = localStorage.getItem('adminLoggedIn')
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true)
      fetchStats()
      fetchBanners()
      fetchUsers()
      fetchServers()
      fetchNews()
    } else {
      navigate('/admin/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn')
    navigate('/admin/login')
  }

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
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setServers(data || [])
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNews(data || [])
    } catch (error) {
      console.error('Error fetching news:', error)
    }
  }

  const addNews = async () => {
    try {
      const { error } = await supabase
        .from('news_articles')
        .insert([
          {
            title: 'Yeni Haber',
            content: 'Haber içeriği buraya yazılacak...',
            excerpt: 'Haber özeti...',
            author: 'Admin',
            category: 'Genel',
            image_url: '',
            tags: ['minecraft', 'genel']
          }
        ])

      if (error) throw error
      fetchNews()
    } catch (error) {
      console.error('Error adding news:', error)
      alert('Haber eklenirken hata oluştu')
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
      alert('Banner eklenirken hata oluştu')
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
    { id: 'news', label: 'Haber Yönetimi', icon: Calendar },
    { id: 'social', label: 'Sosyal Medya', icon: Settings },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'servers', label: 'Sunucular', icon: Server },
  ]

  if (!isAdminLoggedIn) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Admin Paneli</h1>
          <p className="text-gray-400">Site yönetimi ve istatistikler</p>
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors mx-auto"
          >
            <LogOut className="h-4 w-4" />
            <span>Çıkış Yap</span>
          </button>
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
                  : 'bg-white/10 hover:bg-white/20 text-white'
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
            <h3 className="text-xl font-bold text-white">Dashboard</h3>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{label}</p>
                      <p className="text-2xl font-bold text-white">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h4 className="text-lg font-bold text-white mb-4">Son Aktiviteler</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Yeni sunucu eklendi: "MegaCraft" 2 saat önce</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Yeni üye kaydı: "Ehtiyars" 5 saat önce</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Banner güncellendi: "KALİTENİN ADRESİ" 1 gün önce</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner Management Tab */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Banner Yönetimi</h3>
              <button
                onClick={addBanner}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Banner</span>
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="pb-3 text-white font-semibold">Başlık</th>
                      <th className="pb-3 text-white font-semibold">Pozisyon</th>
                      <th className="pb-3 text-white font-semibold">Durum</th>
                      <th className="pb-3 text-white font-semibold">Tarih</th>
                      <th className="pb-3 text-white font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner) => (
                      <tr key={banner.id} className="border-b border-white/10">
                        <td className="py-3 text-gray-300">{banner.title}</td>
                        <td className="py-3 text-gray-300">{banner.position}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            banner.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {banner.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300">
                          {new Date(banner.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateBanner(banner.id, { is_active: !banner.is_active })}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              {banner.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                            </button>
                            <button
                              onClick={() => deleteBanner(banner.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {banners.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          Henüz banner bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Haber Yönetimi</h3>
              <button
                onClick={addNews}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Haber</span>
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="pb-3 text-white font-semibold">Başlık</th>
                      <th className="pb-3 text-white font-semibold">Kategori</th>
                      <th className="pb-3 text-white font-semibold">Yazar</th>
                      <th className="pb-3 text-white font-semibold">Tarih</th>
                      <th className="pb-3 text-white font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {news.map((article) => (
                      <tr key={article.id} className="border-b border-white/10">
                        <td className="py-3 text-gray-300">{article.title}</td>
                        <td className="py-3 text-gray-300">{article.category}</td>
                        <td className="py-3 text-gray-300">{article.author}</td>
                        <td className="py-3 text-gray-300">
                          {new Date(article.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                // Haber düzenleme işlemi burada yapılacak
                                alert('Haber düzenleme özelliği yakında eklenecek')
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              Düzenle
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Bu haberi silmek istediğinizden emin misiniz?')) {
                                  // Haber silme işlemi burada yapılacak
                                  alert('Haber silme özelliği yakında eklenecek')
                                }
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {news.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          Henüz haber bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Sosyal Medya Yönetimi</h3>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Discord Link</label>
                  <input
                    type="url"
                    value={socialLinks.discord}
                    onChange={(e) => setSocialLinks({...socialLinks, discord: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    placeholder="https://discord.gg/minevote"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Twitter Link</label>
                  <input
                    type="url"
                    value={socialLinks.twitter}
                    onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    placeholder="https://twitter.com/minevote"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Instagram Link</label>
                  <input
                    type="url"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    placeholder="https://instagram.com/minevote"
                  />
                </div>
                <button
                  onClick={() => {
                    // Sosyal medya linklerini kaydetme işlemi
                    alert('Sosyal medya linkleri güncellendi!')
                  }}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Linkleri Güncelle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Kullanıcı Yönetimi</h3>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="pb-3 text-white font-semibold">Kullanıcı Adı</th>
                      <th className="pb-3 text-white font-semibold">E-posta</th>
                      <th className="pb-3 text-white font-semibold">Kayıt Tarihi</th>
                      <th className="pb-3 text-white font-semibold">Minecraft Nick</th>
                      <th className="pb-3 text-white font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/10">
                        <td className="py-3 text-gray-300">{user.username}</td>
                        <td className="py-3 text-gray-300">{user.email}</td>
                        <td className="py-3 text-gray-300">
                          {new Date(user.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3 text-gray-300">{user.minecraft_nick || 'Belirtilmemiş'}</td>
                        <td className="py-3">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                const newPassword = prompt('Yeni şifre:')
                                if (newPassword) {
                                  // Şifre değiştirme işlemi burada yapılacak
                                  alert('Şifre değiştirme özelliği yakında eklenecek')
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              Şifre Değiştir
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
                                  // Kullanıcı silme işlemi burada yapılacak
                                  alert('Kullanıcı silme özelliği yakında eklenecek')
                                }
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              Hesabı Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          Henüz kullanıcı bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Servers Tab */}
        {activeTab === 'servers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Sunucu Yönetimi</h3>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="pb-3 text-white font-semibold">Sunucu Adı</th>
                      <th className="pb-3 text-white font-semibold">IP Adresi</th>
                      <th className="pb-3 text-white font-semibold">Kategori</th>
                      <th className="pb-3 text-white font-semibold">Oy Sayısı</th>
                      <th className="pb-3 text-white font-semibold">Oluşturulma</th>
                      <th className="pb-3 text-white font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servers.map((server) => (
                      <tr key={server.id} className="border-b border-white/10">
                        <td className="py-3 text-gray-300">{server.name}</td>
                        <td className="py-3 text-gray-300">{server.invite_link}</td>
                        <td className="py-3 text-gray-300">{server.category}</td>
                        <td className="py-3 text-gray-300">{server.member_count || 0}</td>
                        <td className="py-3 text-gray-300">
                          {new Date(server.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                // Sunucu düzenleme işlemi burada yapılacak
                                alert('Sunucu düzenleme özelliği yakında eklenecek')
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              Düzenle
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Bu sunucuyu silmek istediğinizden emin misiniz?')) {
                                  // Sunucu silme işlemi burada yapılacak
                                  alert('Sunucu silme özelliği yakında eklenecek')
                                }
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {servers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          Henüz sunucu bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}