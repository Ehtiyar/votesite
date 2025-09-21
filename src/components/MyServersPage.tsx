import React, { useEffect, useState } from 'react'
import { Server, Edit, Trash2, Eye, Plus, Calendar, Users, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { MinecraftServer } from '../types'

export function MyServersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [servers, setServers] = useState<MinecraftServer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMyServers()
    }
  }, [user])

  const fetchMyServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setServers(data || [])
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteServer = async (serverId: string) => {
    if (!confirm('Bu sunucuyu silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId)

      if (error) throw error
      fetchMyServers()
    } catch (error) {
      console.error('Error deleting server:', error)
      alert('Sunucu silinirken hata oluştu')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Giriş Gerekli</h2>
          <p className="text-gray-400">Sunucularınızı görüntülemek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🖥️ Sunucularım</h1>
        <p className="text-gray-400">Eklediğiniz sunucuları yönetin</p>
      </div>

      {/* Add Server Button */}
      <div className="text-center">
        <button
          onClick={() => navigate('/add-server')}
          className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mx-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Sunucu Ekle</span>
        </button>
      </div>

      {/* Servers List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      ) : servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div key={server.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{server.name}</h3>
                  <p className="text-purple-400 text-sm font-mono mb-2">{server.invite_link}</p>
                </div>
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Award className="h-4 w-4" />
                  <span className="font-bold">{server.member_count || 0}</span>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{server.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-600 px-2 py-1 rounded text-white text-xs">
                    {server.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(server.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/server/${server.id}`)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Eye className="h-3 w-3" />
                  <span>Görüntüle</span>
                </button>
                <button
                  onClick={() => navigate(`/edit-server/${server.id}`)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => deleteServer(server.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Server className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Henüz Sunucu Yok</h2>
          <p className="text-gray-400 mb-6">İlk sunucunuzu ekleyerek başlayın!</p>
          <button
            onClick={() => navigate('/add-server')}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Sunucu Ekle</span>
          </button>
        </div>
      )}

      {/* Statistics */}
      {servers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white mb-1">{servers.length}</div>
            <div className="text-gray-400 text-sm">Toplam Sunucu</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {servers.reduce((total, server) => total + (server.member_count || 0), 0)}
            </div>
            <div className="text-gray-400 text-sm">Toplam Oy</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {servers.length > 0 ? Math.round(servers.reduce((total, server) => total + (server.member_count || 0), 0) / servers.length) : 0}
            </div>
            <div className="text-gray-400 text-sm">Ortalama Oy</div>
          </div>
        </div>
      )}
    </div>
  )
}
