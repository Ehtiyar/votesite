import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Heart, 
  Users, 
  Calendar, 
  Award, 
  ExternalLink, 
  Wifi, 
  WifiOff, 
  ArrowLeft,
  Copy,
  Globe,
  MessageCircle,
  Star,
  Shield,
  Clock,
  MapPin,
  Gamepad2,
  Server
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useServerStatus } from '../hooks/useServerStatus'
import type { MinecraftServer } from '../types'

export function ServerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [server, setServer] = useState<MinecraftServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)

  // Server status hook'u kullan
  const { status, loading: statusLoading } = useServerStatus(
    server?.invite_link || '', 
    server?.server_port || 25565
  )

  // Favicon URL oluştur
  const getFaviconUrl = (ip: string) => {
    // IP'den domain çıkar (port varsa kaldır)
    const domain = ip.split(':')[0]
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  }

  useEffect(() => {
    if (id) {
      fetchServer()
    }
  }, [id])

  useEffect(() => {
    if (user && server) {
      checkUserVote()
    }
  }, [user, server])

  const fetchServer = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching server:', error)
        setError('Server not found')
        return
      }

      setServer(data)
    } catch (error) {
      console.error('Error fetching server:', error)
      setError('Failed to load server details')
    } finally {
      setLoading(false)
    }
  }

  const checkUserVote = async () => {
    if (!user || !server) return

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

  const handleVote = async () => {
    if (!user) {
      alert('Please log in to vote for servers!')
      return
    }

    if (!server) return

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
      setServer(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null)
    } catch (error) {
      console.error('Error voting for server:', error)
      alert('Failed to vote for server. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  const copyServerIP = () => {
    if (server) {
      navigator.clipboard.writeText(server.invite_link)
      alert('Server IP copied to clipboard!')
    }
  }

  const openDiscord = () => {
    if (server?.discord_link) {
      window.open(server.discord_link, '_blank')
    }
  }

  const openWebsite = () => {
    if (server?.website_link) {
      window.open(server.website_link, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading server details...</p>
        </div>
      </div>
    )
  }

  if (error || !server) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Server Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The server you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </button>

        {/* Server Banner */}
        {server.banner_url && (
          <div className="mb-8">
            <img
              src={server.banner_url}
              alt={`${server.name} banner`}
              className="w-full h-48 object-cover rounded-xl shadow-2xl"
            />
          </div>
        )}

        {/* Server Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                {/* Server Logo */}
                <div className="flex-shrink-0">
                  {!logoError ? (
                    <img
                      src={getFaviconUrl(server.invite_link)}
                      alt={`${server.name} logo`}
                      className="w-16 h-16 rounded-xl border border-white/20"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-white/20 bg-purple-600/20 flex items-center justify-center">
                      <Server className="h-8 w-8 text-purple-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-4xl font-bold text-white">{server.name}</h1>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Award className="h-6 w-6" />
                      <span className="text-xl font-bold">{server.member_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Status */}
              <div className="flex items-center space-x-4 mb-4">
                {statusLoading ? (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
                    <span>Checking status...</span>
                  </div>
                ) : status?.online ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Wifi className="h-5 w-5" />
                    <span className="font-medium">
                      ✓ Online - {status.players.online}/{status.players.max} players
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-400">
                    <WifiOff className="h-5 w-5" />
                    <span className="font-medium">✗ Offline</span>
                  </div>
                )}

                {status?.version && (
                  <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                    {status.version}
                  </span>
                )}
              </div>

              {/* Server IP */}
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={copyServerIP}
                  className="text-purple-400 hover:text-purple-300 text-lg font-mono flex items-center space-x-2 transition-colors"
                >
                  <span>{server.invite_link}</span>
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleVote}
                  disabled={isVoting || hasVoted}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    hasVoted
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : isVoting
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transform hover:scale-105'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${hasVoted ? 'fill-current' : ''}`} />
                  <span>
                    {hasVoted ? 'Voted!' : isVoting ? 'Voting...' : 'Vote'}
                  </span>
                </button>

                {server.website_link && (
                  <button
                    onClick={openWebsite}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                    <span>Website</span>
                  </button>
                )}

                {server.discord_link && (
                  <button
                    onClick={openDiscord}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Discord</span>
                  </button>
                )}
              </div>
            </div>

            {/* Server Stats */}
            <div className="lg:w-80 space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Server Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white bg-blue-600 px-2 py-1 rounded text-xs">
                      {server.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white">{server.game_version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(server.created_at).toLocaleDateString()}</span>
                  </div>
                  {server.uptime && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-green-400">{server.uptime}%</span>
                    </div>
                  )}
                  {server.country && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white">{server.country}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Description */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About This Server</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            {server.detailed_description || server.description}
          </p>
        </div>

        {/* Gamemodes */}
        {server.gamemodes && server.gamemodes.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6" />
              <span>Gamemodes</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {server.gamemodes.map((gamemode, index) => (
                <span
                  key={index}
                  className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm"
                >
                  {gamemode}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Supported Versions */}
        {server.supported_versions && server.supported_versions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span>Supported Versions</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {server.supported_versions.map((version, index) => (
                <span
                  key={index}
                  className="bg-green-600 text-white px-3 py-1 rounded-full text-sm"
                >
                  {version}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
