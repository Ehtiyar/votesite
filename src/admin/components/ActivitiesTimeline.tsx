import React from 'react'
import { Activity, User, Clock, ArrowRight } from 'lucide-react'

interface Activity {
  type: string
  message: string
  created_at: string
  actor: string
}

interface ActivitiesTimelineProps {
  title: string
  data: Activity[]
  loading?: boolean
  'aria-label'?: string
}

const ActivitiesTimeline: React.FC<ActivitiesTimelineProps> = ({
  title,
  data,
  loading = false,
  'aria-label': ariaLabel
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔐'
      case 'logout':
        return '🚪'
      case 'create':
        return '➕'
      case 'update':
        return '✏️'
      case 'delete':
        return '🗑️'
      case 'view_dashboard':
        return '📊'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'text-green-400'
      case 'logout':
        return 'text-gray-400'
      case 'create':
        return 'text-blue-400'
      case 'update':
        return 'text-yellow-400'
      case 'delete':
        return 'text-red-400'
      case 'view_dashboard':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  if (loading) {
    return (
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse"
        role="status"
        aria-label="Loading activities timeline"
      >
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-white/20 rounded"></div>
          <div className="h-6 bg-white/20 rounded w-32"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </div>
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
      aria-label={ariaLabel || `${title} timeline`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-6 w-6 text-blue-400" aria-hidden="true" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No recent activities</p>
          </div>
        ) : (
          data.map((activity, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors focus-within:ring-2 focus-within:ring-purple-400/50"
              role="listitem"
              tabIndex={0}
              aria-label={`Activity ${index + 1}: ${activity.message} by ${activity.actor} ${formatTimeAgo(activity.created_at)}`}
            >
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <span className="text-white font-medium text-sm">{activity.actor}</span>
                  <ArrowRight className="h-3 w-3 text-gray-500" aria-hidden="true" />
                  <span className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-2">{activity.message}</p>
                
                <div className="flex items-center space-x-1 text-gray-500 text-xs">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={activity.created_at}>
                    {formatTimeAgo(activity.created_at)}
                  </time>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Timeline summary for screen readers */}
      <div className="sr-only">
        <p>
          {title} timeline showing {data.length} recent activities. 
          {data.length > 0 && ` Most recent activity: ${data[0].message} by ${data[0].actor}.`}
        </p>
      </div>
    </div>
  )
}

export default ActivitiesTimeline
