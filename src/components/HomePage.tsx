import React, { useEffect, useState } from 'react'
import { Trophy, Users, Server, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ServerCard } from './ServerCard'
import type { MinecraftServer } from '../types'

export function HomePage() {
  const [topServers, setTopServers] = useState<MinecraftServer[]>([])
  const [stats, setStats] = useState({
    totalServers: 0,
    totalVotes: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopServers()
    fetchStats()
  }, [])

  const fetchTopServers = async () => {
    try {
      const { data, error } = await supabase
        .from('minecraft_servers')
        .select('*')
        .order('vote_count', { ascending: false })
        .limit(6)

      if (error) throw error
      setTopServers(data || [])
    } catch (error) {
      console.error('Error fetching top servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [serversResult, votesResult, usersResult] = await Promise.all([
        supabase.from('minecraft_servers').select('id', { count: 'exact', head: true }),
        supabase.from('votes').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true })
      ])

      setStats({
        totalServers: serversResult.count || 0,
        totalVotes: votesResult.count || 0,
        totalUsers: usersResult.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const statCards = [
    { label: 'Total Servers', value: stats.totalServers, icon: Server, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Votes', value: stats.totalVotes, icon: Trophy, color: 'from-purple-500 to-purple-600' },
    { label: 'Active Users', value: stats.totalUsers, icon: Users, color: 'from-green-500 to-green-600' },
    { label: 'Trending', value: topServers.length, icon: TrendingUp, color: 'from-orange-500 to-orange-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-white mb-4">
          Promote Your <span className="text-purple-400">Minecraft</span> Servers
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Stand out through voting! Join the ultimate platform for Minecraft server promotion and discovery.
        </p>
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-1 rounded-lg">
            <div className="bg-gray-900 rounded-lg px-6 py-3">
              <p className="text-white font-semibold">🚀 Get your server noticed by thousands of players!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Servers Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">🏆 Top Voted Servers</h2>
          <p className="text-gray-400">Discover the most popular Minecraft servers chosen by our community</p>
        </div>

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
        ) : topServers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topServers.map((server, index) => (
              <ServerCard 
                key={server.id} 
                server={server} 
                rank={index + 1}
                onVoteSuccess={fetchTopServers}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Server className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No servers available yet</p>
            <p className="text-gray-500">Be the first to add your server!</p>
          </div>
        )}
      </div>
    </div>
  )
}