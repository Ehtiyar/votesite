import React from 'react'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  loading?: boolean
  'aria-label'?: string
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  changeType = 'neutral',
  loading = false,
  'aria-label': ariaLabel
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-400'
      case 'negative':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return '↗'
      case 'negative':
        return '↘'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse"
        role="status"
        aria-label="Loading KPI card"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-8 bg-white/20 rounded mb-2"></div>
            <div className="h-3 bg-white/20 rounded w-1/2"></div>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 focus-within:ring-2 focus-within:ring-purple-400/50"
      role="region"
      aria-label={ariaLabel || `${title} KPI card`}
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-gray-400 text-sm font-medium mb-2" id={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
            {title}
          </h3>
          <p 
            className="text-3xl font-bold text-white mb-1"
            aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className={`text-sm ${getChangeColor()}`}>
              <span className="sr-only">Change: </span>
              {getChangeIcon()} {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gradient-to-r ${color}`} aria-hidden="true">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default KPICard
