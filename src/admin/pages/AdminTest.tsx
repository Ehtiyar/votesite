import React from 'react'

const AdminTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Admin Panel Test</h1>
        <p className="text-gray-400 mb-8">Admin paneli çalışıyor!</p>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Test Bilgileri</h2>
          <div className="space-y-2 text-left">
            <p className="text-gray-300">
              <span className="text-green-400">✅</span> React component yüklendi
            </p>
            <p className="text-gray-300">
              <span className="text-green-400">✅</span> Routing çalışıyor
            </p>
            <p className="text-gray-300">
              <span className="text-green-400">✅</span> Tailwind CSS aktif
            </p>
            <p className="text-gray-300">
              <span className="text-blue-400">ℹ️</span> Admin login sayfasına gitmek için: /admin/login
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminTest
