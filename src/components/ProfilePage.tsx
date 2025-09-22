import React, { useState, useEffect } from 'react'
import { User, Mail, Calendar, Gamepad2, MessageCircle, Save, Edit, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface UserProfile {
  id: string
  username: string
  email: string
  minecraft_nick?: string
  discord_username?: string
  created_at: string
}

export function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    minecraft_nick: '',
    discord_username: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        minecraft_nick: data.minecraft_nick || '',
        discord_username: data.discord_username || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Profil bilgileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          minecraft_nick: formData.minecraft_nick,
          discord_username: formData.discord_username
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Profil başarıyla güncellendi!')
      setIsEditing(false)
      fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Profil güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Profil yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Giriş Gerekli</h2>
          <p className="text-gray-400">Profil sayfasını görüntülemek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">👤 Hesabım</h1>
        <p className="text-gray-400">Profil bilgilerinizi yönetin</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile?.username}</h2>
            <p className="text-gray-400">Üye olma tarihi: {new Date(profile?.created_at || '').toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        {/* Success/Error Messages */}
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

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Email */}
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <label className="block text-gray-400 text-sm">E-posta</label>
              <p className="text-white">{profile?.email}</p>
            </div>
          </div>

          {/* Minecraft Nick */}
          <div className="flex items-center space-x-3">
            <Gamepad2 className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <label className="block text-gray-400 text-sm mb-1">Minecraft Nick</label>
              {isEditing ? (
                <input
                  type="text"
                  name="minecraft_nick"
                  value={formData.minecraft_nick}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="Minecraft kullanıcı adınız"
                />
              ) : (
                <p className="text-white">{profile?.minecraft_nick || 'Belirtilmemiş'}</p>
              )}
            </div>
          </div>

          {/* Discord Username */}
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <label className="block text-gray-400 text-sm mb-1">Discord Kullanıcı Adı</label>
              {isEditing ? (
                <input
                  type="text"
                  name="discord_username"
                  value={formData.discord_username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="Discord kullanıcı adınız"
                />
              ) : (
                <p className="text-white">{profile?.discord_username || 'Belirtilmemiş'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-8">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    minecraft_nick: profile?.minecraft_nick || '',
                    discord_username: profile?.discord_username || ''
                  })
                  setError('')
                  setSuccess('')
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                İptal
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Düzenle</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
          <div className="text-2xl font-bold text-white mb-1">0</div>
          <div className="text-gray-400 text-sm">Eklenen Sunucu</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
          <div className="text-2xl font-bold text-white mb-1">0</div>
          <div className="text-gray-400 text-sm">Verilen Oy</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
          <div className="text-2xl font-bold text-white mb-1">0</div>
          <div className="text-gray-400 text-sm">Favori Sunucu</div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <h3 className="text-blue-400 font-semibold">Güvenlik</h3>
        </div>
        <p className="text-blue-200 text-sm">
          Profil bilgileriniz güvenli bir şekilde saklanmaktadır. Şifrenizi değiştirmek için 
          "Şifre Değiştir" sayfasını kullanabilirsiniz.
        </p>
      </div>
    </div>
  )
}


