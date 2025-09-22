import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Server,
  MessageSquare
} from 'lucide-react'

interface ServerReport {
  id: string
  reason: string
  description: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  created_at: string
  admin_notes?: string
  resolved_at?: string
  server: {
    id: string
    name: string
    ip: string
    port: number
  }
  reporter: {
    id: string
    username: string
    avatar_url?: string
  }
  resolved_by_admin?: {
    id: string
    username: string
  }
}

interface ServerReportsProps {
  className?: string
}

const ServerReports: React.FC<ServerReportsProps> = ({ className }) => {
  const [reports, setReports] = useState<ServerReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState<ServerReport | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchReports()
  }, [statusFilter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const accessToken = localStorage.getItem('admin_access_token')
      const csrfToken = localStorage.getItem('admin_csrf_token')

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/.netlify/functions/server-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        console.error('Failed to fetch reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async (reportId: string, status: string) => {
    try {
      const accessToken = localStorage.getItem('admin_access_token')
      const csrfToken = localStorage.getItem('admin_csrf_token')

      const response = await fetch(`/.netlify/functions/server-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes
        })
      })

      if (response.ok) {
        await fetchReports() // Refresh the list
        setShowReportModal(false)
        setSelectedReport(null)
        setAdminNotes('')
      } else {
        const error = await response.json()
        console.error('Update failed:', error.error)
      }
    } catch (error) {
      console.error('Error updating report:', error)
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reporter.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20'
      case 'investigating': return 'text-blue-400 bg-blue-400/20'
      case 'resolved': return 'text-green-400 bg-green-400/20'
      case 'dismissed': return 'text-gray-400 bg-gray-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'investigating': return <AlertTriangle className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'dismissed': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'inappropriate_content': return '🚫'
      case 'spam': return '📧'
      case 'fake_server': return '❌'
      case 'broken_server': return '🔧'
      case 'other': return '📝'
      default: return '⚠️'
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
      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white/20 rounded"></div>
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
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <h2 className="text-xl font-bold text-white">Server Reports</h2>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {reports.filter(r => r.status === 'pending').length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-400/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No reports found</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedReport(report)
                setShowReportModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{getReasonIcon(report.reason)}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-medium truncate">{report.server.name}</h3>
                      <span className="text-gray-400 text-sm">({report.server.ip}:{report.server.port})</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{report.reporter.username}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(report.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm line-clamp-2">{report.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span className="capitalize">{report.status}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedReport(report)
                      setShowReportModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => {
            setShowReportModal(false)
            setSelectedReport(null)
            setAdminNotes('')
          }}
          onUpdate={handleUpdateReport}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
        />
      )}
    </div>
  )
}

// Report Details Modal Component
interface ReportDetailsModalProps {
  report: ServerReport
  onClose: () => void
  onUpdate: (reportId: string, status: string) => void
  adminNotes: string
  setAdminNotes: (notes: string) => void
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({ 
  report, 
  onClose, 
  onUpdate, 
  adminNotes, 
  setAdminNotes 
}) => {
  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'inappropriate_content': return 'Inappropriate Content'
      case 'spam': return 'Spam'
      case 'fake_server': return 'Fake Server'
      case 'broken_server': return 'Broken Server'
      case 'other': return 'Other'
      default: return reason
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Report Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Report Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Server</label>
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-blue-400" />
                <span className="text-white">{report.server.name}</span>
                <span className="text-gray-400 text-sm">({report.server.ip}:{report.server.port})</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reporter</label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-400" />
                <span className="text-white">{report.reporter.username}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
              <span className="text-white">{getReasonText(report.reason)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <span className="text-white capitalize">{report.status}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reported</label>
              <span className="text-white">{new Date(report.created_at).toLocaleString('tr-TR')}</span>
            </div>

            {report.resolved_at && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Resolved</label>
                <span className="text-white">{new Date(report.resolved_at).toLocaleString('tr-TR')}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white">{report.description}</p>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add admin notes..."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50"
              rows={3}
            />
          </div>

          {/* Existing Admin Notes */}
          {report.admin_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Previous Admin Notes</label>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white">{report.admin_notes}</p>
              </div>
            </div>
          )}

          {/* Resolved By */}
          {report.resolved_by_admin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Resolved By</label>
              <span className="text-white">{report.resolved_by_admin.username}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-6">
          {report.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdate(report.id, 'investigating')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Start Investigation
              </button>
              <button
                onClick={() => onUpdate(report.id, 'dismissed')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </>
          )}

          {report.status === 'investigating' && (
            <>
              <button
                onClick={() => onUpdate(report.id, 'resolved')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Resolve
              </button>
              <button
                onClick={() => onUpdate(report.id, 'dismissed')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </>
          )}

          {(report.status === 'resolved' || report.status === 'dismissed') && (
            <button
              onClick={() => onUpdate(report.id, 'investigating')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServerReports
