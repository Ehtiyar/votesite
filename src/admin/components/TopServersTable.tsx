import React from 'react'
import { Trophy, Users, ExternalLink } from 'lucide-react'

interface TopServer {
  server_id: string
  name: string
  votes: number
}

interface TopServersTableProps {
  title: string
  data: TopServer[]
  loading?: boolean
  'aria-label'?: string
}

const TopServersTable: React.FC<TopServersTableProps> = ({
  title,
  data,
  loading = false,
  'aria-label': ariaLabel
}) => {
  if (loading) {
    return (
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse"
        role="status"
        aria-label="Loading top servers table"
      >
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-white/20 rounded"></div>
          <div className="h-6 bg-white/20 rounded w-32"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                <div className="h-4 bg-white/20 rounded w-24"></div>
              </div>
              <div className="h-4 bg-white/20 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
      role="region"
      aria-label={ariaLabel || `${title} table`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Trophy className="h-6 w-6 text-yellow-400" aria-hidden="true" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No servers found</p>
          </div>
        ) : (
          data.map((server, index) => (
            <div
              key={server.server_id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors focus-within:ring-2 focus-within:ring-purple-400/50"
              role="row"
              tabIndex={0}
              aria-label={`Server ${index + 1}: ${server.name} with ${server.votes} votes`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-white font-medium">{server.name}</h4>
                  <p className="text-gray-400 text-sm">Server ID: {server.server_id.slice(0, 8)}...</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">{server.votes.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">votes</span>
                </div>
                
                <button
                  className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50 rounded"
                  aria-label={`View details for ${server.name}`}
                  onClick={() => {
                    // Navigate to server details
                    window.open(`/server/${server.server_id}`, '_blank')
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Table summary for screen readers */}
      <div className="sr-only">
        <p>
          {title} table showing {data.length} servers ranked by votes. 
          {data.length > 0 && ` Top server is ${data[0].name} with ${data[0].votes} votes.`}
        </p>
      </div>
    </div>
  )
}

export default TopServersTable
