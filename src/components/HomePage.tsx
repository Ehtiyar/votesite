import React, { useEffect, useState } from 'react'
import { Trophy, Users, Server, TrendingUp, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ServerCard } from './ServerCard'
import type { MinecraftServer } from '../types'

export function HomePage() {
  const [topServers, setTopServers] = useState<MinecraftServer[]>([])
  const [allServers, setAllServers] = useState<MinecraftServer[]>([])
  const [filteredServers, setFilteredServers] = useState<MinecraftServer[]>([])
  const [stats, setStats] = useState({
    totalServers: 0,
    totalVotes: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('votes')
  
  const categories = [
    { value: 'all', label: 'All Categories', icon: '🎮' },
    { value: 'Survival', label: 'Survival', icon: '⛏️' },
    { value: 'Creative', label: 'Creative', icon: '🎨' },
    { value: 'PvP', label: 'PvP', icon: '⚔️' },
    { value: 'SkyBlock', label: 'SkyBlock', icon: '☁️' },
    { value: 'Factions', label: 'Factions', icon: '🏰' },
    { value: 'Minigames', label: 'Minigames', icon: '🎯' },
    { value: 'Roleplay', label: 'Roleplay', icon: '🎭' },
    { value: 'Anarchy', label: 'Anarchy', icon: '💀' },
    { value: 'Hardcore', label: 'Hardcore', icon: '💀' },
    { value: 'Modded', label: 'Modded', icon: '🔧' },
    { value: 'Bedrock', label: 'Bedrock', icon: '📱' }
  ]

  useEffect(() => {
    fetchAllServers()
    fetchStats()
  }, [])

  useEffect(() => {
    filterAndSortServers()
  }, [allServers, searchTerm, selectedCategory, sortBy])

  const fetchAllServers = async () => {
    try {
      console.log('Fetching all servers...')
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('member_count', { ascending: false })

      console.log('Servers fetch result:', { data, error })

      if (error) {
        console.error('Error fetching servers:', error)
        throw error
      }
      
      setAllServers(data || [])
      setTopServers((data || []).slice(0, 6))
      console.log('All servers set:', data)
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortServers = () => {
    let filtered = [...allServers]

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(server => server.category === selectedCategory)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(server => 
        server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.invite_link.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    switch (sortBy) {
      case 'votes':
        filtered.sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }

    setFilteredServers(filtered)
  }

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...')
      const [serversResult, votesResult, profilesResult] = await Promise.all([
        supabase.from('servers').select('id', { count: 'exact', head: true }),
        supabase.from('votes').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ])

      console.log('Stats fetch result:', { serversResult, votesResult, profilesResult })

      setStats({
        totalServers: serversResult.count || 0,
        totalVotes: votesResult.count || 0,
        totalUsers: profilesResult.count || 0
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

      {/* Banner Areas */}
      <div className="space-y-4">
        {/* Top Banner Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 text-center border-2 border-dashed border-gray-500 cursor-pointer hover:border-purple-400 transition-colors">
            <div className="text-gray-400 text-sm">Bu alana reklam vermek için TIKLA!</div>
            <div className="text-gray-400 text-xs">CLICK HERE to advertise in this area!</div>
            <div className="text-gray-500 text-xs mt-1">728x90</div>
          </div>
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 text-center border-2 border-dashed border-gray-500 cursor-pointer hover:border-purple-400 transition-colors">
            <div className="text-gray-400 text-sm">Bu alana reklam vermek için TIKLA!</div>
            <div className="text-gray-400 text-xs">CLICK HERE to advertise in this area!</div>
            <div className="text-gray-500 text-xs mt-1">728x90</div>
          </div>
        </div>

        {/* Middle Banner Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 text-center border-2 border-dashed border-gray-500 cursor-pointer hover:border-purple-400 transition-colors">
            <div className="text-gray-400 text-sm">Bu alana reklam vermek için TIKLA!</div>
            <div className="text-gray-400 text-xs">CLICK HERE to advertise in this area!</div>
            <div className="text-gray-500 text-xs mt-1">728x90</div>
          </div>
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 text-center border-2 border-dashed border-gray-500 cursor-pointer hover:border-purple-400 transition-colors">
            <div className="text-gray-400 text-sm">Bu alana reklam vermek için TIKLA!</div>
            <div className="text-gray-400 text-xs">CLICK HERE to advertise in this area!</div>
            <div className="text-gray-500 text-xs mt-1">728x90</div>
          </div>
        </div>

        {/* Bottom Banner Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 text-center border-2 border-dashed border-gray-500 cursor-pointer hover:border-purple-400 transition-colors">
            <div className="text-gray-400 text-sm">Bu alana reklam vermek için TIKLA!</div>
            <div className="text-gray-400 text-xs">CLICK HERE to advertise in this area!</div>
            <div className="text-gray-500 text-xs mt-1">728x90</div>
          </div>
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 text-center border-2 border-dashed border-gray-500 cursor-pointer hover:border-purple-400 transition-colors">
            <div className="text-gray-400 text-sm">Bu alana reklam vermek için TIKLA!</div>
            <div className="text-gray-400 text-xs">CLICK HERE to advertise in this area!</div>
            <div className="text-gray-500 text-xs mt-1">728x90</div>
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

      {/* Search and Filter Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Search className="h-6 w-6" />
            <span>Find Your Perfect Server</span>
          </h2>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search servers by name, description, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="flex-1 min-w-64">
              <label className="block text-white text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex-1 min-w-48">
              <label className="block text-white text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              >
                <option value="votes">Most Votes</option>
                <option value="name">Name A-Z</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Showing {filteredServers.length} of {allServers.length} servers
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSortBy('votes')
                }}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
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
                onVoteSuccess={fetchAllServers}
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

      {/* Filtered Results Section */}
      {(searchTerm || selectedCategory !== 'all') && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">🔍 Search Results</h2>
            <p className="text-gray-400">
              {filteredServers.length > 0 
                ? `Found ${filteredServers.length} server${filteredServers.length === 1 ? '' : 's'} matching your criteria`
                : 'No servers found matching your criteria'
              }
            </p>
          </div>

          {filteredServers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server, index) => (
                <ServerCard 
                  key={server.id} 
                  server={server} 
                  rank={index + 1}
                  onVoteSuccess={fetchAllServers}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-400">No servers found</p>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* All Servers Section (when no filters applied) */}
      {!searchTerm && selectedCategory === 'all' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">🌟 All Servers</h2>
            <p className="text-gray-400">Browse through all available Minecraft servers</p>
          </div>

          {allServers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allServers.map((server, index) => (
                <ServerCard 
                  key={server.id} 
                  server={server} 
                  rank={index + 1}
                  onVoteSuccess={fetchAllServers}
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
      )}
    </div>
  )
}
