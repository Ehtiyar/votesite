import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Calendar, Award, ExternalLink, Wifi, WifiOff, Server } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useServerStatus } from '../hooks/useServerStatus'
import type { MinecraftServer } from '../types'

interface ServerCardProps {
  server: MinecraftServer
  rank?: number
  onFavoriteSuccess?: () => void
}

export function ServerCard({ server, rank, onFavoriteSuccess }: ServerCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [logoError, setLogoError] = useState(false)
  
  // Server status hook'u kullan
  const { status, loading: statusLoading } = useServerStatus(server.invite_link, server.server_port || 25565)

  // Favicon URL oluştur
  const getFaviconUrl = (ip: string) => {
    // IP'den domain çıkar (port varsa kaldır)
    const domain = ip.split(':')[0]
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  }

  useEffect(() => {
    if (user) {
      checkUserFavorite()
    }
  }, [user, server.id])

  const checkUserFavorite = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('server_id', server.id)
        .single()

      if (!error && data) {
        setIsFavorited(true)
      }
    } catch (error) {
      // Kullanıcı henüz favoriye eklememiş
      setIsFavorited(false)
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      alert('Favorilere eklemek için giriş yapmanız gerekiyor!')
      return
    }

    setIsFavoriting(true)
    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('server_id', server.id)

        if (error) throw error
        setIsFavorited(false)
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert([
            {
              user_id: user.id,
              server_id: server.id
            }
          ])

        if (error) throw error
        setIsFavorited(true)
      }
      
      if (onFavoriteSuccess) {
        onFavoriteSuccess()
      }
    } catch (error) {
      console.error('Error updating favorites:', error)
      alert('Favori işlemi sırasında hata oluştu!')
    } finally {
      setIsFavoriting(false)
    }
  }

  const copyServerIP = () => {
    navigator.clipboard.writeText(server.invite_link)
    alert('Server IP copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 group">
      {/* Rank Badge */}
      {rank && (
        <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm">
          #{rank}
        </div>
      )}

      {/* Server Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Server Logo */}
          <div className="flex-shrink-0">
            {!logoError ? (
              <img
                src={getFaviconUrl(server.invite_link)}
                alt={`${server.name} logo`}
                className="w-12 h-12 rounded-lg border border-white/20"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-12 h-12 rounded-lg border border-white/20 bg-purple-600/20 flex items-center justify-center">
                <Server className="h-6 w-6 text-purple-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              {server.name}
            </h3>
            <button
              onClick={copyServerIP}
              className="text-purple-400 hover:text-purple-300 text-sm font-mono flex items-center space-x-1 transition-colors"
            >
              <span>{server.invite_link}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Member Count */}
        <div className="flex items-center space-x-1 text-yellow-400">
          <Award className="h-4 w-4" />
          <span className="font-bold">{server.member_count || 0}</span>
        </div>
      </div>

      {/* Server Status */}
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

      {/* Server Description */}
      <p className="text-gray-300 text-sm mb-4 overflow-hidden" style={{
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical'
      }}>
        {server.description}
      </p>

      {/* Server Info */}
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

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => navigate(`/server/${server.id}`)}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        >
          <span>Detayları Gör</span>
        </button>
        <button
          onClick={handleFavorite}
          disabled={isFavoriting}
          className={`px-3 py-2 rounded-lg transition-colors ${
            isFavorited
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          } disabled:opacity-50`}
        >
          <Heart className={`h-3 w-3 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Favorite Status */}
      {isFavorited && (
        <div className="mt-2 text-center">
          <span className="text-xs text-red-400 font-medium">❤️ Favorilere eklendi</span>
        </div>
      )}
    </div>
  )
}