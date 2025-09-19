import React, { useState } from 'react'
import { Server, Globe, GamepadIcon, FileText, Key, Hash, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface AddServerPageProps {
  onPageChange: (page: string) => void
}

export function AddServerPage({ onPageChange }: AddServerPageProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    game_version: '',
    description: '',
    votifier_key: '',
    votifier_port: 8192
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('minecraft_servers')
        .insert([
          {
            ...formData,
            owner_id: user.id,
            vote_count: 0
          }
        ])

      if (error) throw error

      alert('Server added successfully!')
      onPageChange('home')
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <Server className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-gray-400 mb-6">You need to be logged in to add a server.</p>
        <button
          onClick={() => onPageChange('login')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Login Now
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add Your Minecraft Server</h1>
        <p className="text-gray-400">Share your server with the community and start collecting votes!</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="My Awesome Server"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ip_address" className="block text-white text-sm font-medium mb-2">
                Server IP Address *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="ip_address"
                  name="ip_address"
                  required
                  value={formData.ip_address}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="play.myserver.com"
                />
              </div>
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