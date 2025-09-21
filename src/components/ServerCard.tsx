import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Users, Calendar, Award, ExternalLink, Wifi, WifiOff, Server } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useServerStatus } from '../hooks/useServerStatus'
import type { MinecraftServer } from '../types'

interface ServerCardProps {
  server: MinecraftServer
  rank?: number
  onVoteSuccess?: () => void
}

export function ServerCard({ server, rank, onVoteSuccess }: ServerCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [logoError, setLogoError] = useState(false)
  
  // Server status hook'u kullan
  const { status, loading: statusLoading } = useServerStatus(server.invite_link, server.server_port || 25565)

  // Favicon URL oluştur
  const getFaviconUrl = (ip: string) => {
    // IP'den domain çıkar (port varsa kaldır)
    const domain = ip.split(':')[0]
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  }

  React.useEffect(() => {
    if (user) {
      checkUserVote()
    }
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
      // User hasn't voted for this server
      setHasVoted(false)
    }
  }

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when voting
    
    if (!user) {
      alert('Please log in to vote for servers!')
      return
    }

    if (hasVoted) {
      alert('You have already voted for this server!')
      return
    }

    setIsVoting(true)

    try {
      // Add vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert([
          {
            user_id: user.id,
            server_id: server.id,
          }
        ])

      if (voteError) throw voteError

      // Update server vote count
      const { error: updateError } = await supabase
        .from('servers')
        .update({ member_count: server.member_count + 1 })
        .eq('id', server.id)

      if (updateError) throw updateError

      setHasVoted(true)
      if (onVoteSuccess) {
        onVoteSuccess()
      }
    } catch (error) {
      console.error('Error voting for server:', error)
      alert('Failed to vote for server. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  const copyServerIP = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when copying IP
    navigator.clipboard.writeText(server.invite_link)
    alert('Server IP copied to clipboard!')
  }

  const handleCardClick = () => {
    navigate(`/server/${server.id}`)
  }

  return (
    <div 
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
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
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white">{server.name}</h3>
                {rank && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    rank === 1 ? 'bg-yellow-500 text-black' :
                    rank === 2 ? 'bg-gray-400 text-black' :
                    rank === 3 ? 'bg-orange-500 text-white' :
                    'bg-purple-600 text-white'
                  }`}>
                    #{rank}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={copyServerIP}
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
            <span>{new Date(server.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleVote}
        disabled={isVoting || hasVoted}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all ${
          hasVoted
            ? 'bg-green-600 text-white cursor-not-allowed'
            : isVoting
            ? 'bg-gray-600 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transform hover:scale-105'
        }`}
      >
        <Heart className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
        <span>
          {hasVoted ? 'Voted!' : isVoting ? 'Voting...' : 'Vote'}
        </span>
      </button>
    </div>
  )
}
