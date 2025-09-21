import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, Globe, GamepadIcon, FileText, Key, Hash, Plus, Upload, Link, Monitor, Plug, Tag, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function AddServerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    game_version: '',
    description: '',
    votifier_key: '',
    votifier_port: 8192,
    server_port: 25565,
    discord_url: '',
    website_url: '',
    banner_url: '',
    tags: [] as string[],
    versions: [] as string[],
    launcher_type: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Tag seçenekleri
  const availableTags = [
    'Survival', 'Oneblock', 'Skyblock', 'PVP', 'Prison', 'Roleplay', 'Vanilla',
    'Bedwars', 'Mini Games', 'Creative', 'Hardcore', 'Hunger Games', 'PVE',
    'War', 'Raiding', 'PixelMon', 'City', 'LifeSteal', 'Battle Royale',
    'Parkour', 'Faction', 'Towny', 'Adventure', 'SMP', 'KitPVP', 'Anarchy',
    'Arena', 'Modded', 'Earth'
  ]

  // Versiyon seçenekleri
  const availableVersions = [
    'v1.6', 'v1.7', 'v1.8', 'v1.9', 'v1.10', 'v1.11', 'v1.12', 'v1.13',
    'v1.14', 'v1.15', 'v1.16', 'v1.17', 'v1.18', 'v1.19', 'v1.20', 'v1.21'
  ]

  // Launcher türleri
  const launcherTypes = ['Cracked', 'Premium']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('servers')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            invite_link: formData.ip_address,
            category: formData.game_version,
            ip_address: formData.ip_address,
            game_version: formData.game_version,
            votifier_key: formData.votifier_key,
            votifier_port: formData.votifier_port,
            server_port: formData.server_port,
            website_url: formData.website_url,
            discord_url: formData.discord_url,
            banner_url: formData.banner_url,
            tags: formData.tags,
            versions: formData.versions,
            launcher_type: formData.launcher_type,
            vote_count: 0,
            created_by: user.id
          }
        ])

      if (error) throw error

      alert('Server added successfully!')
      navigate('/')
    } catch (error: any) {
      setError(error.message || 'Failed to add server')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleTagToggle = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: formData.tags.filter(t => t !== tag)
      })
    } else if (formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      })
    }
  }

  const handleVersionToggle = (version: string) => {
    if (formData.versions.includes(version)) {
      setFormData({
        ...formData,
        versions: formData.versions.filter(v => v !== version)
      })
    } else if (formData.versions.length < 7) {
      setFormData({
        ...formData,
        versions: [...formData.versions, version]
      })
    }
  }

  const handleLauncherToggle = (launcher: string) => {
    if (formData.launcher_type.includes(launcher)) {
      setFormData({
        ...formData,
        launcher_type: formData.launcher_type.filter(l => l !== launcher)
      })
    } else if (formData.launcher_type.length < 2) {
      setFormData({
        ...formData,
        launcher_type: [...formData.launcher_type, launcher]
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Burada file upload işlemi yapılabilir
      // Şimdilik sadece file'ı state'e kaydediyoruz
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Server className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-gray-400 mb-6">You need to be logged in to add a server.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Login Now
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add Your Minecraft Server</h1>
        <p className="text-gray-400">Share your server with the community and start collecting votes!</p>
      </div>

      {/* Form Version Selection */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-white">
            <input type="radio" name="formVersion" value="minified" defaultChecked className="text-purple-600" />
            <span>Minified Version</span>
          </label>
          <label className="flex items-center space-x-2 text-white">
            <input type="radio" name="formVersion" value="complete" className="text-purple-600" />
            <span>Complete Version</span>
          </label>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Video Game Selection */}
          <div>
            <label htmlFor="game" className="block text-white text-sm font-medium mb-2">
              Video Game *
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                id="game"
                name="game"
                required
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                defaultValue="Minecraft"
              >
                <option value="Minecraft">Minecraft</option>
              </select>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label htmlFor="thumbnail" className="block text-white text-sm font-medium">
                Thumbnail
              </label>
              <div className="flex items-center space-x-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                <Info className="h-3 w-3" />
                <span>Not Sponsored</span>
              </div>
            </div>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
              <input
                type="file"
                id="thumbnail"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="thumbnail" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-white text-sm">Dosya Seç</p>
                <p className="text-gray-400 text-xs mt-1">
                  {selectedFile ? selectedFile.name : 'Dosya seçilmedi'}
                </p>
              </label>
            </div>
          </div>

          {/* Server Name */}
          <div>
            <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
              Server Name *
            </label>
            <div className="relative">
              <Server className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Server Name"
              />
            </div>
          </div>

          {/* Private Server Page URL */}
          <div>
            <label htmlFor="website_url" className="block text-white text-sm font-medium mb-2">
              Private Server Page URL *
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="url"
                id="website_url"
                name="website_url"
                required
                value={formData.website_url}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Private Server Page URL"
              />
            </div>
          </div>

          {/* IP Address and Port */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="ip_address" className="block text-white text-sm font-medium mb-2">
                IP Address *
              </label>
              <div className="relative">
                <Monitor className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="ip_address"
                  name="ip_address"
                  required
                  value={formData.ip_address}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="IP Address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="server_port" className="block text-white text-sm font-medium mb-2">
                Port *
              </label>
              <div className="relative">
                <Plug className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="server_port"
                  name="server_port"
                  required
                  value={formData.server_port}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="Port"
                />
              </div>
            </div>
          </div>

          {/* Server Description */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label htmlFor="description" className="block text-white text-sm font-medium">
                Server Description
              </label>
              <div className="flex items-center space-x-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                <Info className="h-3 w-3" />
                <span>Not Sponsored</span>
              </div>
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none"
                placeholder="Server Description"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-white text-sm font-medium mb-4">
              Tags ({formData.tags.length}/5)
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  disabled={!formData.tags.includes(tag) && formData.tags.length >= 5}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                  } ${
                    !formData.tags.includes(tag) && formData.tags.length >= 5
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Versions Section */}
          <div>
            <label className="block text-white text-sm font-medium mb-4">
              Versions ({formData.versions.length}/7)
            </label>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {availableVersions.map((version) => (
                <button
                  key={version}
                  type="button"
                  onClick={() => handleVersionToggle(version)}
                  disabled={!formData.versions.includes(version) && formData.versions.length >= 7}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.versions.includes(version)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                  } ${
                    !formData.versions.includes(version) && formData.versions.length >= 7
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {version}
                </button>
              ))}
            </div>
          </div>

          {/* Launcher Section */}
          <div>
            <label className="block text-white text-sm font-medium mb-4">
              Launcher ({formData.launcher_type.length}/2)
            </label>
            <div className="flex space-x-4">
              {launcherTypes.map((launcher) => (
                <button
                  key={launcher}
                  type="button"
                  onClick={() => handleLauncherToggle(launcher)}
                  disabled={!formData.launcher_type.includes(launcher) && formData.launcher_type.length >= 2}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                    formData.launcher_type.includes(launcher)
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                  } ${
                    !formData.launcher_type.includes(launcher) && formData.launcher_type.length >= 2
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {launcher}
                </button>
              ))}
            </div>
          </div>

          {/* Discord URL */}
          <div>
            <label htmlFor="discord_url" className="block text-white text-sm font-medium mb-2">
              Discord Server URL
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="url"
                id="discord_url"
                name="discord_url"
                value={formData.discord_url}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="https://discord.gg/your-server"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="game_version" className="block text-white text-sm font-medium mb-2">
                Game Version *
              </label>
              <div className="relative">
                <GamepadIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="game_version"
                  name="game_version"
                  required
                  value={formData.game_version}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="1.20.1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="votifier_port" className="block text-white text-sm font-medium mb-2">
                Votifier Port *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="votifier_port"
                  name="votifier_port"
                  required
                  value={formData.votifier_port}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="8192"
                />
              </div>
            </div>

            <div>
              <label htmlFor="server_port" className="block text-white text-sm font-medium mb-2">
                Server Port *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="server_port"
                  name="server_port"
                  required
                  value={formData.server_port}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="25565"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Default Minecraft server port (usually 25565)
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="votifier_key" className="block text-white text-sm font-medium mb-2">
              Votifier Public Key *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="votifier_key"
                name="votifier_key"
                required
                value={formData.votifier_key}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Paste your Votifier public key here"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Find this in your Votifier plugin config or run /votifier key
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-white text-sm font-medium mb-2">
              Server Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none"
                placeholder="Describe your server's unique features, game modes, and what makes it special..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => onPageChange('home')}
              className="px-6 py-3 text-white hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>{loading ? 'Adding Server...' : 'Add Server'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
