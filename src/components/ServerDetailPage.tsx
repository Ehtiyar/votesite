import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Heart, 
  Award, 
  Wifi, 
  WifiOff, 
  ArrowLeft,
  Copy,
  Globe,
  MessageCircle,
  Star,
  Shield,
  Gamepad2,
  Server,
  ThumbsUp,
  Edit,
  Trash2,
  Send
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useServerStatus } from '../hooks/useServerStatus'
import { sendVotifierVote } from '../lib/votifier'
import type { MinecraftServer } from '../types'

interface ServerReview {
  id: string
  user_id: string
  server_id: string
  rating: number
  comment: string
  is_verified: boolean
  created_at: string
  updated_at: string
  profiles: {
    username: string
  }
}

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
  const [minecraftUsername, setMinecraftUsername] = useState('')
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  
  // Review states
  const [reviews, setReviews] = useState<ServerReview[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [userReview, setUserReview] = useState<ServerReview | null>(null)

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
      fetchReviews()
    }
  }, [id])

  useEffect(() => {
    if (user && server) {
      checkUserVote()
      checkUserReview()
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

  const fetchReviews = async () => {
    if (!server) return

    try {
      const { data, error } = await supabase
        .from('server_reviews')
        .select(`
          *,
          profiles:user_id (
            username
          )
        `)
        .eq('server_id', server.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        // If table doesn't exist, set empty arrays
        if (error.message.includes('relation "server_reviews" does not exist')) {
          setReviews([])
          setAverageRating(0)
          setTotalReviews(0)
          return
        }
        throw error
      }

      setReviews(data || [])
      
      // Calculate average rating
      if (data && data.length > 0) {
        const totalRating = data.reduce((sum: number, review: any) => sum + review.rating, 0)
        setAverageRating(totalRating / data.length)
        setTotalReviews(data.length)
      } else {
        setAverageRating(0)
        setTotalReviews(0)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      // Set empty state on error
      setReviews([])
      setAverageRating(0)
      setTotalReviews(0)
    }
  }

  const checkUserReview = async () => {
    if (!user || !server) return

    try {
      const { data, error } = await supabase
        .from('server_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('server_id', server.id)
        .single()

      if (error) {
        // If table doesn't exist or no review found, set null
        if (error.message.includes('relation "server_reviews" does not exist') || 
            error.message.includes('No rows returned')) {
          setUserReview(null)
          return
        }
        throw error
      }

      if (data) {
        setUserReview(data)
        setReviewRating(data.rating)
        setReviewComment(data.comment || '')
      }
    } catch (error) {
      console.error('Error checking user review:', error)
      setUserReview(null)
    }
  }

  const handleSubmitReview = async () => {
    if (!user || !server) return

    // Validation
    if (reviewRating < 1 || reviewRating > 5) {
      alert('Please select a valid rating (1-5 stars)')
      return
    }

    setIsSubmittingReview(true)

    try {
      if (userReview) {
        // Update existing review
        const { data, error } = await supabase
          .from('server_reviews')
          .update({
            rating: reviewRating,
            comment: reviewComment || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userReview.id)
          .select()

        if (error) {
          console.error('Update review error:', error)
          throw new Error(`Update failed: ${error.message}`)
        }
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('server_reviews')
          .insert([{
            user_id: user.id,
            server_id: server.id,
            rating: reviewRating,
            comment: reviewComment || null
          }])
          .select()

        if (error) {
          console.error('Insert review error:', error)
          throw new Error(`Insert failed: ${error.message}`)
        }
      }

      setShowReviewModal(false)
      setReviewComment('')
      setReviewRating(5)
      await fetchReviews()
      await checkUserReview()
      alert('Review submitted successfully!')
    } catch (error) {
      console.error('Error submitting review:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to submit review: ${errorMessage}`)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!userReview) return

    if (!confirm('Are you sure you want to delete your review?')) return

    try {
      const { error } = await supabase
        .from('server_reviews')
        .delete()
        .eq('id', userReview.id)

      if (error) throw error

      setUserReview(null)
      setReviewRating(5)
      setReviewComment('')
      fetchReviews()
      alert('Review deleted successfully!')
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review. Please try again.')
    }
  }

  const handleVote = async () => {
    if (!user) {
      alert('Oy verebilmek için giriş yapmanız gerekiyor!')
      return
    }

    if (!server) return

    if (hasVoted) {
      alert('Bu sunucuya zaten oy verdiniz!')
      return
    }

    // Minecraft kullanıcı adı modalını göster
    setShowUsernameModal(true)
  }

  const handleVoteWithUsername = async () => {
    if (!minecraftUsername.trim()) {
      alert('Minecraft kullanıcı adınızı girin!')
      return
    }

    if (!user || !server) return

    setIsVoting(true)
    setShowUsernameModal(false)

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

      // Votifier ile Minecraft sunucusuna hediye gönder
      if (server.votifier_key && server.votifier_port) {
        try {
          const votifierResponse = await sendVotifierVote(
            server.votifier_key,
            server.invite_link.split(':')[0], // IP adresini al
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
      setServer(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null)
    } catch (error) {
      console.error('Error voting for server:', error)
      alert('Oy verirken hata oluştu. Lütfen tekrar deneyin.')
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
                  
                  {/* Rating Display */}
                  {totalReviews > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-white font-medium">
                        {averageRating.toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
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

                {user && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <Star className="h-5 w-5" />
                    <span>{userReview ? 'Edit Review' : 'Write Review'}</span>
                  </button>
                )}

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

        {/* Reviews Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <ThumbsUp className="h-6 w-6" />
              <span>Reviews & Ratings</span>
            </h2>
            {user && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                <Star className="h-4 w-4" />
                <span>{userReview ? 'Edit Review' : 'Write Review'}</span>
              </button>
            )}
          </div>

          {totalReviews > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {review.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {review.profiles?.username || 'Anonymous'}
                        </p>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                  )}
                  {user && user.id === review.user_id && (
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => {
                          setReviewRating(review.rating)
                          setReviewComment(review.comment || '')
                          setShowReviewModal(true)
                        }}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteReview}
                        className="flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No reviews yet</p>
              <p className="text-gray-500">Be the first to review this server!</p>
            </div>
          )}
        </div>

        {/* Minecraft Username Modal */}
        {showUsernameModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Minecraft Kullanıcı Adınız</h3>
              <p className="text-gray-400 mb-6">
                Oy verdikten sonra Minecraft sunucusunda hediyenizi alabilmek için kullanıcı adınızı girin.
              </p>
              
              <div className="mb-6">
                <label htmlFor="minecraft-username" className="block text-white text-sm font-medium mb-2">
                  Minecraft Kullanıcı Adı
                </label>
                <input
                  type="text"
                  id="minecraft-username"
                  value={minecraftUsername}
                  onChange={(e) => setMinecraftUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="Minecraft kullanıcı adınız"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUsernameModal(false)}
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

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">
                {userReview ? 'Edit Review' : 'Write a Review'}
              </h3>
              
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setReviewRating(i + 1)}
                      className={`h-8 w-8 ${
                        i < reviewRating ? 'text-yellow-400' : 'text-gray-400'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <Star className={`h-full w-full ${i < reviewRating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="review-comment" className="block text-white text-sm font-medium mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="Share your experience with this server..."
                  rows={4}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
