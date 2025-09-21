import React, { useState } from 'react'
import { Lock, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function ChangePasswordPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor!')
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır!')
      setLoading(false)
      return
    }

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      setSuccess('Şifreniz başarıyla değiştirildi!')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      setError(error.message || 'Şifre değiştirilirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Giriş Gerekli</h2>
          <p className="text-gray-400">Şifre değiştirmek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🔐 Şifre Değiştir</h1>
        <p className="text-gray-400">Hesap güvenliğiniz için şifrenizi güncelleyin</p>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Profili Dön</span>
        </button>
      </div>

      {/* Password Change Form */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-6">
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-white text-sm font-medium mb-2">
              Mevcut Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                required
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Mevcut şifrenizi girin"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
              >
                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-white text-sm font-medium mb-2">
              Yeni Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                required
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Yeni şifrenizi girin"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
              >
                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-white text-sm font-medium mb-2">
              Yeni Şifre Tekrar
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Yeni şifrenizi tekrar girin"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
              >
                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Şifre değiştiriliyor...' : 'Şifreyi Değiştir'}</span>
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2">Güvenlik İpuçları</h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Şifreniz en az 8 karakter uzunluğunda olsun</li>
          <li>• Büyük harf, küçük harf, rakam ve özel karakter kullanın</li>
          <li>• Kişisel bilgilerinizi şifre olarak kullanmayın</li>
          <li>• Şifrenizi kimseyle paylaşmayın</li>
        </ul>
      </div>
    </div>
  )
}
