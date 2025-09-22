import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Eye, 
  Heart, 
  Star,
  Award,
  Activity,
  Clock,
  Globe,
  MessageCircle,
  Download,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { MinecraftServer } from '../types'

interface ServerStats {
  totalVotes: number
  totalViews: number
  totalReviews: number
  averageRating: number
  votesToday: number
  votesThisWeek: number
  votesThisMonth: number
  recentVotes: Array<{
    id: string
    minecraft_username: string
    created_at: string
  }>
  recentReviews: Array<{
    id: string
    rating: number
    comment: string
    created_at: string
    profiles: {
      username: string
    }
  }>
}

export function ServerAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [server, setServer] = useState<MinecraftServer | null>(null)
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id && user) {
      fetchServerAndStats()
    }
  }, [id, user])

  const fetchServerAndStats = async () => {
    try {
      // Fetch server details
      const { data: serverData, error: serverError } = await supabase
        .from('servers')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user?.id)
        .single()

      if (serverError) {
        setError('Server not found or access denied')
        return
      }

      setServer(serverData)

      // Fetch server statistics
      const [
        votesResult,
        reviewsResult,
        recentVotesResult,
        recentReviewsResult
      ] = await Promise.all([
        // Total votes
        supabase
          .from('votes')
          .select('id, created_at, minecraft_username')
          .eq('server_id', id),
        
        // Reviews
        supabase
          .from('server_reviews')
          .select('id, rating, comment, created_at, profiles:user_id(username)')
          .eq('server_id', id)
          .order('created_at', { ascending: false }),
        
        // Recent votes (last 10)
        supabase
          .from('votes')
          .select('id, minecraft_username, created_at')
          .eq('server_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent reviews (last 5)
        supabase
          .from('server_reviews')
          .select('id, rating, comment, created_at, profiles:user_id(username)')
          .eq('server_id', id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      if (votesResult.error) throw votesResult.error
      if (reviewsResult.error) throw reviewsResult.error

      const votes = votesResult.data || []
      const reviews = reviewsResult.data || []

      // Calculate statistics
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      const votesToday = votes.filter(vote => new Date(vote.created_at) >= today).length
      const votesThisWeek = votes.filter(vote => new Date(vote.created_at) >= weekAgo).length
      const votesThisMonth = votes.filter(vote => new Date(vote.created_at) >= monthAgo).length

      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0

      setStats({
        totalVotes: votes.length,
        totalViews: serverData.member_count || 0, // Using member_count as proxy for views
        totalReviews: reviews.length,
        averageRating,
        votesToday,
        votesThisWeek,
        votesThisMonth,
        recentVotes: recentVotesResult.data || [],
        recentReviews: recentReviewsResult.data || []
      })

    } catch (error) {
      console.error('Error fetching server stats:', error)
      setError('Failed to load server statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} dakika önce`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} saat önce`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} gün önce`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !server || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error || 'You do not have permission to view this server\'s analytics.'}</p>
          <button
            onClick={() => navigate('/my-servers')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to My Servers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/my-servers')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to My Servers</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-white">{server.name} Analytics</h1>
            <button
              onClick={fetchServerAndStats}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Votes</p>
                <p className="text-3xl font-bold text-white">{stats.totalVotes}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Reviews</p>
                <p className="text-3xl font-bold text-white">{stats.totalReviews}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Server Views</p>
                <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600">
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Vote Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Vote Trends</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Today</span>
                <span className="text-white font-semibold">{stats.votesToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">This Week</span>
                <span className="text-white font-semibold">{stats.votesThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">This Month</span>
                <span className="text-white font-semibold">{stats.votesThisMonth}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Server Information</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Server IP</span>
                <span className="text-white font-mono">{server.invite_link}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Category</span>
                <span className="text-white">{server.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white">{server.game_version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Created</span>
                <span className="text-white">{formatDate(server.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Votes</span>
            </h3>
            <div className="space-y-3">
              {stats.recentVotes.length > 0 ? (
                stats.recentVotes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Heart className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{vote.minecraft_username || 'Anonymous'}</p>
                        <p className="text-gray-400 text-sm">{getTimeAgo(vote.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No recent votes</p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Recent Reviews</span>
            </h3>
            <div className="space-y-3">
              {stats.recentReviews.length > 0 ? (
                stats.recentReviews.map((review) => (
                  <div key={review.id} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{review.profiles?.username || 'Anonymous'}</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm">{getTimeAgo(review.created_at)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-300 text-sm">{review.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No recent reviews</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
