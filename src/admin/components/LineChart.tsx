import React, { useRef, useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface LineChartProps {
  title: string
  data: Array<{ date: string; count: number }>
  color?: string
  loading?: boolean
  'aria-label'?: string
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  color = '#7c3aed',
  loading = false,
  'aria-label': ariaLabel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || loading || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    if (width === 0 || height === 0) return

    // Set canvas size
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Chart dimensions
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Find max value
    const maxValue = Math.max(...data.map(d => d.count), 1)

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let i = 0; i <= data.length - 1; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Draw line
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = height - padding - (point.count / maxValue) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = color
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = height - padding - (point.count / maxValue) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '12px system-ui'
    ctx.textAlign = 'center'

    // X-axis labels (dates)
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const date = new Date(point.date)
      const label = date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
      ctx.fillText(label, x, height - 10)
    })

    // Y-axis labels
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * i)
      const y = height - padding - (chartHeight / 5) * i
      ctx.fillText(value.toString(), padding - 10, y + 4)
    }

  }, [data, color, dimensions, loading])

  if (loading) {
    return (
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse"
        role="status"
        aria-label="Loading line chart"
      >
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-white/20 rounded"></div>
          <div className="h-6 bg-white/20 rounded w-32"></div>
        </div>
        <div className="h-64 bg-white/20 rounded"></div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
      role="region"
      aria-label={ariaLabel || `${title} line chart`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-6 w-6 text-purple-400" aria-hidden="true" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64"
          role="img"
          aria-label={`Line chart showing ${title} data over the last 7 days`}
        />
        
        {/* Chart summary for screen readers */}
        <div className="sr-only">
          <p>
            {title} chart showing data for the last 7 days. 
            Maximum value: {Math.max(...data.map(d => d.count))}. 
            Minimum value: {Math.min(...data.map(d => d.count))}.
            Total: {data.reduce((sum, d) => sum + d.count, 0)}.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LineChart
