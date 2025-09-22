import React, { useState, useEffect } from 'react'
import { 
  Server, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Star, 
  Shield, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Server {
  id: string
  name: string
  ip: string
  port: number
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'featured'
  current_players: number
  max_players: number
  vote_count: number
  is_verified: boolean
  is_featured: boolean
  categories: string[]
  tags: string[]
  owner: {
    id: string
    username: string
    avatar_url?: string
  }
  created_at: string
  last_ping_at?: string
}

interface ServerManagementProps {
  className?: string
}

const ServerManagement: React.FC<ServerManagementProps> = ({ className }) => {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [showServerModal, setShowServerModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchServers()
  }, [statusFilter, categoryFilter, sortBy, sortOrder])

  const fetchServers = async () => {
    try {
      setLoading(true)
      const accessToken = localStorage.getItem('admin_access_token')
      const csrfToken = localStorage.getItem('admin_csrf_token')

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/.netlify/functions/admin/server-crud?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setServers(data.servers || [])
      } else {
        console.error('Failed to fetch servers')
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServerAction = async (serverId: string, action: string) => {
    try {
      const accessToken = localStorage.getItem('admin_access_token')
      const csrfToken = localStorage.getItem('admin_csrf_token')

      const response = await fetch(`/.netlify/functions/admin/server-crud/${serverId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await fetchServers() // Refresh the list
      } else {
        const error = await response.json()
        console.error('Action failed:', error.error)
      }
    } catch (error) {
      console.error('Error performing action:', error)
    }
  }

  const handlePingServer = async (serverId: string) => {
    try {
      const accessToken = localStorage.getItem('admin_access_token')
      const csrfToken = localStorage.getItem('admin_csrf_token')

      const response = await fetch('/.netlify/functions/admin/server-ping', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'ping_server', server_id: serverId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await fetchServers() // Refresh the list
        }
      }
    } catch (error) {
      console.error('Error pinging server:', error)
    }
  }

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.ip.includes(searchTerm)
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20'
      case 'pending': return 'text-yellow-400 bg-yellow-400/20'
      case 'inactive': return 'text-gray-400 bg-gray-400/20'
      case 'suspended': return 'text-red-400 bg-red-400/20'
      case 'featured': return 'text-purple-400 bg-purple-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <AlertTriangle className="h-4 w-4" />
      case 'inactive': return <XCircle className="h-4 w-4" />
      case 'suspended': return <XCircle className="h-4 w-4" />
      case 'featured': return <Star className="h-4 w-4" />
      default: return <Server className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Server className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Server Management</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Server</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="featured">Featured</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <option value="all">All Categories</option>
          <option value="survival">Survival</option>
          <option value="creative">Creative</option>
          <option value="pvp">PvP</option>
          <option value="skyblock">SkyBlock</option>
          <option value="factions">Factions</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-')
            setSortBy(field)
            setSortOrder(order as 'asc' | 'desc')
          }}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="vote_count-desc">Most Votes</option>
          <option value="current_players-desc">Most Players</option>
          <option value="name-asc">Name A-Z</option>
        </select>
      </div>

      {/* Servers List */}
      <div className="space-y-4">
        {filteredServers.length === 0 ? (
          <div className="text-center py-8">
            <Server className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No servers found</p>
          </div>
        ) : (
          filteredServers.map((server) => (
            <div
              key={server.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Server className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-medium truncate">{server.name}</h3>
                      {server.is_verified && (
                        <Shield className="h-4 w-4 text-green-400" title="Verified" />
                      )}
                      {server.is_featured && (
                        <Star className="h-4 w-4 text-yellow-400" title="Featured" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{server.ip}:{server.port}</span>
                      <span>{server.current_players}/{server.max_players} players</span>
                      <span>{server.vote_count} votes</span>
                      <span>Owner: {server.owner.username}</span>
                    </div>
                    
                    {server.categories && server.categories.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        {server.categories.slice(0, 3).map((category) => (
                          <span
                            key={category}
                            className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(server.status)}`}>
                    {getStatusIcon(server.status)}
                    <span className="capitalize">{server.status}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePingServer(server.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Ping Server"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedServer(server)
                        setShowServerModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {/* Dropdown menu would go here */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Server Details Modal */}
      {showServerModal && selectedServer && (
        <ServerDetailsModal
          server={selectedServer}
          onClose={() => {
            setShowServerModal(false)
            setSelectedServer(null)
          }}
          onAction={handleServerAction}
        />
      )}

      {/* Create Server Modal */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchServers()
          }}
        />
      )}
    </div>
  )
}

// Server Details Modal Component
interface ServerDetailsModalProps {
  server: Server
  onClose: () => void
  onAction: (serverId: string, action: string) => void
}

const ServerDetailsModal: React.FC<ServerDetailsModalProps> = ({ server, onClose, onAction }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Server Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <p className="text-white">{server.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">IP:Port</label>
            <p className="text-white">{server.ip}:{server.port}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <p className="text-white capitalize">{server.status}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Players</label>
            <p className="text-white">{server.current_players}/{server.max_players}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Votes</label>
            <p className="text-white">{server.vote_count}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Owner</label>
            <p className="text-white">{server.owner.username}</p>
          </div>

          {server.categories && server.categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Categories</label>
              <div className="flex flex-wrap gap-2">
                {server.categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-6">
          <button
            onClick={() => onAction(server.id, server.status === 'active' ? 'unpublish' : 'publish')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {server.status === 'active' ? 'Unpublish' : 'Publish'}
          </button>
          
          <button
            onClick={() => onAction(server.id, server.is_featured ? 'unfeature' : 'feature')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            {server.is_featured ? 'Unfeature' : 'Feature'}
          </button>
          
          <button
            onClick={() => onAction(server.id, server.is_verified ? 'unverify' : 'verify')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            {server.is_verified ? 'Unverify' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Create Server Modal Component
interface CreateServerModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CreateServerModal: React.FC<CreateServerModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: 25565,
    description: '',
    categories: [] as string[],
    tags: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implementation for creating server
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Create Server</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">IP Address</label>
            <input
              type="text"
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              rows={3}
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              Create Server
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServerManagement
