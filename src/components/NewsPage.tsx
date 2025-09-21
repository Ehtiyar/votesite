import React, { useEffect, useState } from 'react'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface NewsArticle {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  created_at: string
  image_url?: string
}

export function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchNews()
  }, [selectedCategory])

  const fetchNews = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'updates', label: 'Güncellemeler' },
    { id: 'events', label: 'Etkinlikler' },
    { id: 'servers', label: 'Sunucular' },
    { id: 'community', label: 'Topluluk' },
    { id: 'minecraft', label: 'Minecraft' }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">📰 Minecraft Haberleri</h1>
        <p className="text-gray-400">Minecraft dünyasından en güncel haberler ve duyurular</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* News Articles */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse">
              <div className="h-48 bg-gray-600 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                    {article.category}
                  </span>
                  <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(article.created_at)}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <User className="h-3 w-3" />
                    <span>{article.author}</span>
                  </div>
                  <button className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors">
                    <span className="text-sm">Devamını Oku</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-2xl font-bold text-white mb-2">Henüz Haber Yok</h2>
          <p className="text-gray-400">Bu kategoride henüz haber bulunmuyor.</p>
        </div>
      )}

      {/* Featured Article */}
      {articles.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-8 border border-purple-400/30">
          <div className="flex items-center space-x-2 mb-4">
            <Tag className="h-5 w-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">Öne Çıkan Haber</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{articles[0].title}</h2>
          <p className="text-gray-300 text-lg mb-6">{articles[0].excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{articles[0].author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(articles[0].created_at)}</span>
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2">
              <span>Haberi Oku</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
