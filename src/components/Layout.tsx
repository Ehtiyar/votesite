import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Server, Trophy, Home, Info, LogOut, User, Settings, Plus, Heart, ChevronDown, MessageCircle, Twitter, Instagram, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { id: 'news', label: 'News', icon: Info, path: '/news' },
    { id: 'about', label: 'About', icon: Info, path: '/about' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">MineVote</h1>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map(({ id, label, icon: Icon, path }) => (
                <Link
                  key={id}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(path)
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {/* Social Media Icons */}
              <div className="hidden lg:flex items-center space-x-3">
                <a
                  href="https://discord.gg/minevote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Discord"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com/minevote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/minevote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Hesabım</span>
                        </Link>
                        <Link
                          to="/add-server"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Sunucu Ekle</span>
                        </Link>
                        <Link
                          to="/my-servers"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Server className="h-4 w-4" />
                          <span>Sunucularım</span>
                        </Link>
                        <Link
                          to="/change-password"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Şifre Değiştir</span>
                        </Link>
                        <Link
                          to="/favorites"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Heart className="h-4 w-4" />
                          <span>Beğendiklerim</span>
                        </Link>
                        <Link
                          to="/boost-packages"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Zap className="h-4 w-4" />
                          <span>Boost Paketleri</span>
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            handleSignOut()
                            setIsDropdownOpen(false)
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Çıkış Yap</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-white hover:text-purple-200 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden mt-3 flex flex-wrap gap-2">
            {navItems.map(({ id, label, icon: Icon, path }) => (
              <Link
                key={id}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer with Social Media */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                © 2024 MineVote. Tüm hakları saklıdır.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Bizi takip edin:</span>
              <div className="flex items-center space-x-3">
                <a
                  href="https://discord.gg/minevote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Discord"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com/minevote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/minevote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}