import React, { useRef, useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'

interface BarChartProps {
  title: string
  data: Array<{ label: string; value: number }>
  color?: string
  loading?: boolean
  'aria-label'?: string
}

const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  color = '#10b981',
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
    const padding = 60
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value), 1)

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

    // Draw bars
    const barWidth = chartWidth / data.length * 0.8
    const barSpacing = chartWidth / data.length * 0.2

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight
      const x = padding + (chartWidth / data.length) * index + barSpacing / 2
      const y = height - padding - barHeight

      // Draw bar
      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw value on top of bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(
        item.value.toString(),
        x + barWidth / 2,
        y - 5
      )

      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(
        item.label,
        x + barWidth / 2,
        height - 10
      )
    })

    // Draw Y-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '12px system-ui'
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
        aria-label="Loading bar chart"
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
      aria-label={ariaLabel || `${title} bar chart`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="h-6 w-6 text-green-400" aria-hidden="true" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64"
          role="img"
          aria-label={`Bar chart showing ${title} data`}
        />
        
        {/* Chart summary for screen readers */}
        <div className="sr-only">
          <p>
            {title} bar chart showing data for {data.length} categories. 
            Maximum value: {Math.max(...data.map(d => d.value))}. 
            Minimum value: {Math.min(...data.map(d => d.value))}.
            Total: {data.reduce((sum, d) => sum + d.value, 0)}.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BarChart
