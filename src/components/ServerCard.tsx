import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Calendar, Award, ExternalLink, Wifi, WifiOff, Server, Users, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useServerStatus } from '../hooks/useServerStatus'
import { sendVotifierVote } from '../lib/votifier'
import type { MinecraftServer } from '../types'

interface ServerCardProps {
  server: MinecraftServer
  rank?: number
  onFavoriteSuccess?: () => void
  onVoteSuccess?: () => void
}

interface TopVoter {
  minecraft_username: string
  vote_count: number
}

export function ServerCard({ server, rank, onFavoriteSuccess, onVoteSuccess }: ServerCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [minecraftUsername, setMinecraftUsername] = useState('')
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [topVoters, setTopVoters] = useState<TopVoter[]>([])
  const [showTopVoters, setShowTopVoters] = useState(false)
  
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
      checkUserVote()
    }
    fetchTopVoters()
  }, [user, server.id])

  const checkUserVote = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('server_id', server.id)
        .single()

      if (!error && data) {
        setHasVoted(true)
      }
    } catch (error) {
      setHasVoted(false)
    }
  }

  const fetchTopVoters = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('minecraft_username')
        .eq('server_id', server.id)
        .not('minecraft_username', 'is', null)

      if (error) throw error

      // Minecraft username'lere göre grupla ve say
      const voterCounts: { [key: string]: number } = {}
      data?.forEach(vote => {
        if (vote.minecraft_username) {
          voterCounts[vote.minecraft_username] = (voterCounts[vote.minecraft_username] || 0) + 1
        }
      })

      // En çok oy verenleri sırala
      const sortedVoters = Object.entries(voterCounts)
        .map(([username, count]) => ({ minecraft_username: username, vote_count: count }))
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 5) // Top 5

      setTopVoters(sortedVoters)
    } catch (error) {
      console.error('Error fetching top voters:', error)
    }
  }

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

  const handleVote = async () => {
    if (!user) {
      alert('Oy verebilmek için giriş yapmanız gerekiyor!')
      return
    }

    if (hasVoted) {
      alert('Bu sunucuya zaten oy verdiniz!')
      return
    }

    setShowVoteModal(true)
  }

  const handleVoteWithUsername = async () => {
    if (!minecraftUsername.trim()) {
      alert('Minecraft kullanıcı adınızı girin!')
      return
    }

    if (!user || !server) return

    setIsVoting(true)
    setShowVoteModal(false)

    try {
      // Add vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert([
          {
            user_id: user.id,
            server_id: server.id,
            minecraft_username: minecraftUsername.trim()
          }
        ])

      if (voteError) throw voteError

      // Update server vote count
      const { error: updateError } = await supabase
        .from('servers')
        .update({ member_count: server.member_count + 1 })
        .eq('id', server.id)

      if (updateError) throw updateError

      // Votifier ile Minecraft sunucusuna hediye gönder
      if (server.votifier_key && server.votifier_port) {
        try {
          const votifierResponse = await sendVotifierVote(
            server.votifier_key,
            server.invite_link.split(':')[0],
            server.votifier_port,
            minecraftUsername.trim()
          )

          if (votifierResponse.status === 'ok') {
            alert('Oy başarıyla verildi! Minecraft sunucusunda hediyenizi alabilirsiniz.')
          } else {
            console.warn('Votifier error:', votifierResponse.error)
            alert('Oy verildi ancak Minecraft sunucusuna hediye gönderilemedi. Sunucu sahibi ile iletişime geçin.')
          }
        } catch (votifierError) {
          console.error('Votifier error:', votifierError)
          alert('Oy verildi ancak Minecraft sunucusuna hediye gönderilemedi. Sunucu sahibi ile iletişime geçin.')
        }
      } else {
        alert('Oy başarıyla verildi!')
      }

      setHasVoted(true)
      fetchTopVoters() // Top voters listesini güncelle
      
      if (onVoteSuccess) {
        onVoteSuccess()
      }
    } catch (error) {
      console.error('Error voting for server:', error)
      alert('Oy verirken hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsVoting(false)
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
      <div className="flex space-x-2 mb-3">
        <button
          onClick={handleVote}
          disabled={isVoting || hasVoted}
          className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
            hasVoted
              ? 'bg-green-600 text-white cursor-not-allowed'
              : isVoting
              ? 'bg-gray-600 text-white cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          <Trophy className="h-3 w-3" />
          <span>
            {hasVoted ? 'Oy Verildi!' : isVoting ? 'Oy Veriliyor...' : 'Oy Ver'}
          </span>
        </button>
        <button
          onClick={() => navigate(`/server/${server.id}`)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        >
          <span>Detaylar</span>
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

      {/* Top Voters Section */}
      {topVoters.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setShowTopVoters(!showTopVoters)}
            className="flex items-center justify-between w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Top Voters ({topVoters.length})</span>
            </div>
            <span className={`transform transition-transform ${showTopVoters ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {showTopVoters && (
            <div className="mt-2 space-y-1">
              {topVoters.map((voter, index) => (
                <div key={index} className="flex items-center justify-between text-xs text-gray-300 bg-white/5 rounded px-2 py-1">
                  <span className="font-medium">{voter.minecraft_username}</span>
                  <span className="text-yellow-400 font-bold">{voter.vote_count} oy</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorite Status */}
      {isFavorited && (
        <div className="mt-2 text-center">
          <span className="text-xs text-red-400 font-medium">❤️ Favorilere eklendi</span>
        </div>
      )}

      {/* Vote Modal */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Oy Ver - {server.name}</h3>
            <p className="text-gray-400 mb-6">
              Oy verdikten sonra Minecraft sunucusunda hediyenizi alabilmek için kullanıcı adınızı girin.
            </p>
            
            <div className="mb-6">
              <label htmlFor="minecraft-username-card" className="block text-white text-sm font-medium mb-2">
                Minecraft Kullanıcı Adı
              </label>
              <input
                type="text"
                id="minecraft-username-card"
                value={minecraftUsername}
                onChange={(e) => setMinecraftUsername(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Minecraft kullanıcı adınız"
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleVoteWithUsername}
                disabled={isVoting}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isVoting ? 'Oy Veriliyor...' : 'Oy Ver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}