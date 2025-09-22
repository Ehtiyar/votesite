import React, { useState, useEffect } from 'react'

const AdminDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      localStorage: {
        admin_access_token: localStorage.getItem('admin_access_token') ? 'Present' : 'Not found',
        admin_csrf_token: localStorage.getItem('admin_csrf_token') ? 'Present' : 'Not found',
        admin_user: localStorage.getItem('admin_user') ? 'Present' : 'Not found'
      },
      timestamp: new Date().toISOString(),
      reactVersion: React.version
    }
    setDebugInfo(info)
  }, [])

  const testAPI = async () => {
    try {
      const response = await fetch('/.netlify/functions/admin/secure-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify'
        })
      })
      
      const data = await response.json()
      alert(`API Test Result: ${response.status} - ${JSON.stringify(data)}`)
    } catch (error) {
      alert(`API Test Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">Admin Panel Debug</h1>
          <p className="text-gray-400">Admin paneli debug bilgileri</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debug Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Debug Bilgileri</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">URL:</span>
                <span className="text-white ml-2">{debugInfo.url}</span>
              </div>
              <div>
                <span className="text-gray-400">Pathname:</span>
                <span className="text-white ml-2">{debugInfo.pathname}</span>
              </div>
              <div>
                <span className="text-gray-400">React Version:</span>
                <span className="text-white ml-2">{debugInfo.reactVersion}</span>
              </div>
              <div>
                <span className="text-gray-400">Timestamp:</span>
                <span className="text-white ml-2">{debugInfo.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Local Storage */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Local Storage</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Admin Access Token:</span>
                <span className={`ml-2 ${debugInfo.localStorage?.admin_access_token === 'Present' ? 'text-green-400' : 'text-red-400'}`}>
                  {debugInfo.localStorage?.admin_access_token}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Admin CSRF Token:</span>
                <span className={`ml-2 ${debugInfo.localStorage?.admin_csrf_token === 'Present' ? 'text-green-400' : 'text-red-400'}`}>
                  {debugInfo.localStorage?.admin_csrf_token}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Admin User:</span>
                <span className={`ml-2 ${debugInfo.localStorage?.admin_user === 'Present' ? 'text-green-400' : 'text-red-400'}`}>
                  {debugInfo.localStorage?.admin_user}
                </span>
              </div>
            </div>
          </div>

          {/* User Agent */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">User Agent</h2>
            <p className="text-gray-300 text-sm break-all">{debugInfo.userAgent}</p>
          </div>

          {/* Actions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Test Actions</h2>
            <div className="space-y-3">
              <button
                onClick={testAPI}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Test API Connection
              </button>
              <button
                onClick={() => window.location.href = '/admin/login'}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>

        {/* Raw Debug Data */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Raw Debug Data</h2>
          <pre className="text-xs text-gray-300 bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default AdminDebug
