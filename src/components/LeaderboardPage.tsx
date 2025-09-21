import React, { useEffect, useState } from 'react'
import { Trophy, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ServerCard } from './ServerCard'
import type { MinecraftServer } from '../types'

export function LeaderboardPage() {
  const [servers, setServers] = useState<MinecraftServer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [versionFilter, setVersionFilter] = useState('')

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('member_count', { ascending: false })

      if (error) throw error
      setServers(data || [])
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVersion = !versionFilter || server.game_version.includes(versionFilter)
    return matchesSearch && matchesVersion
  })

  const uniqueVersions = [...new Set(servers.map(server => server.game_version))]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center space-x-3">
          <Trophy className="h-10 w-10 text-yellow-400" />
          <span>Server Leaderboard</span>
        </h1>
        <p className="text-gray-400">Top-rated Minecraft servers ranked by community votes</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="pl-10 pr-8 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 appearance-none cursor-pointer"
          >
            <option value="">All Versions</option>
            {uniqueVersions.map(version => (
              <option key={version} value={version} className="bg-gray-800">
                {version}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center text-gray-400">
        Showing {filteredServers.length} of {servers.length} servers
      </div>

      {/* Server Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredServers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server, index) => (
            <ServerCard 
              key={server.id} 
              server={server} 
              rank={servers.findIndex(s => s.id === server.id) + 1}
              onVoteSuccess={fetchServers}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-400">No servers found</p>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}