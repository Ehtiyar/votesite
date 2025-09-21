import React, { useEffect, useState } from 'react'
import { Heart, Calendar, Award, ExternalLink, Wifi, WifiOff, Server } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useServerStatus } from '../hooks/useServerStatus'
import type { MinecraftServer } from '../types'

interface FavoriteServer extends MinecraftServer {
  favorite_id: string
}

export function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteServer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id as favorite_id,
          servers (*)
        `)
        .eq('user_id', user?.id)

      if (error) throw error

      const favoriteServers = data?.map(item => ({
        ...item.servers,
        favorite_id: item.favorite_id
      })) || []

      setFavorites(favoriteServers)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId)

      if (error) throw error
      fetchFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('Favoriden çıkarılırken hata oluştu')
    }
  }

  const copyServerIP = (ip: string) => {
    navigator.clipboard.writeText(ip)
    alert('Server IP copied to clipboard!')
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
          <p className="text-gray-400">Favorilerinizi görüntülemek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">❤️ Beğendiklerim</h1>
        <p className="text-gray-400">Favori sunucularınızı yönetin</p>
      </div>

      {/* Favorites List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((server) => (
            <FavoriteServerCard
              key={server.favorite_id}
              server={server}
              onRemove={() => removeFavorite(server.favorite_id)}
              onCopyIP={() => copyServerIP(server.invite_link)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Henüz Favori Yok</h2>
          <p className="text-gray-400 mb-6">Beğendiğiniz sunucuları favorilere ekleyerek burada görüntüleyebilirsiniz.</p>
        </div>
      )}

      {/* Statistics */}
      {favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white mb-1">{favorites.length}</div>
            <div className="text-gray-400 text-sm">Toplam Favori</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {favorites.reduce((total, server) => total + (server.member_count || 0), 0)}
            </div>
            <div className="text-gray-400 text-sm">Toplam Oy</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {favorites.length > 0 ? Math.round(favorites.reduce((total, server) => total + (server.member_count || 0), 0) / favorites.length) : 0}
            </div>
            <div className="text-gray-400 text-sm">Ortalama Oy</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Favorite Server Card Component
function FavoriteServerCard({ server, onRemove, onCopyIP }: { 
  server: FavoriteServer, 
  onRemove: () => void, 
  onCopyIP: () => void 
}) {
  const { status, loading: statusLoading } = useServerStatus(server.invite_link, server.server_port || 25565)

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {/* Server Logo */}
            <div className="flex-shrink-0">
              <img
                src={`https://www.google.com/s2/favicons?domain=${server.invite_link.split(':')[0]}&sz=64`}
                alt={`${server.name} logo`}
                className="w-12 h-12 rounded-lg border border-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling!.style.display = 'flex'
                }}
              />
              <div className="w-12 h-12 rounded-lg border border-white/20 bg-purple-600/20 flex items-center justify-center" style={{ display: 'none' }}>
                <Server className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{server.name}</h3>
            </div>
          </div>
          
          <button
            onClick={onCopyIP}
            className="text-purple-400 hover:text-purple-300 text-sm font-mono flex items-center space-x-1 transition-colors"
          >
            <span>{server.invite_link}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center space-x-1 text-yellow-400">
          <Award className="h-4 w-4" />
          <span className="font-bold">{server.member_count || 0}</span>
        </div>
      </div>

      {/* Online Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {statusLoading ? (
            <div className="flex items-center space-x-1 text-gray-400">
              <div className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
              <span className="text-xs">Checking...</span>
            </div>
          ) : status?.online ? (
            <div className="flex items-center space-x-1 text-green-400">
              <Wifi className="h-3 w-3" />
              <span className="text-xs font-medium">
                {status.players.online}/{status.players.max} online
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-400">
              <WifiOff className="h-3 w-3" />
              <span className="text-xs font-medium">Offline</span>
            </div>
          )}
        </div>
        
        {status?.version && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {status.version}
          </span>
        )}
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
          onClick={() => window.open(`/server/${server.id}`, '_blank')}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        >
          <span>Detayları Gör</span>
        </button>
        <button
          onClick={onRemove}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <Heart className="h-3 w-3 fill-current" />
        </button>
      </div>
    </div>
  )
}
