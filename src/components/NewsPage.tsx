import React, { useEffect, useState } from 'react'
import { Calendar, User, Tag, ArrowRight, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface NewsArticle {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  image_url?: string
  tags?: string[]
  created_at: string
}

export function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState('all')

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(articles.map(article => article.category)))]
  const allTags = Array.from(new Set(articles.flatMap(article => article.tags || [])))

  const filteredArticles = articles.filter(article => {
    const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory
    const tagMatch = selectedTag === 'all' || (article.tags && article.tags.includes(selectedTag))
    return categoryMatch && tagMatch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const articleDate = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - articleDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Az önce'
    if (diffInHours < 24) return `${diffInHours} saat önce`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} gün önce`
    return formatDate(dateString)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">📰 Haberler</h1>
        <p className="text-gray-400">Minecraft dünyasından son haberler</p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {category === 'all' ? 'Tümü' : category}
          </button>
        ))}
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-gray-400 text-sm">Etiketler:</span>
          {['all', ...allTags].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTag === tag
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
              }`}
            >
              {tag === 'all' ? 'Tümü' : `#${tag}`}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-1/3 mb-3"></div>
              <div className="h-6 bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <>
          {/* Featured Article */}
          {filteredArticles[0] && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="h-5 w-5 text-purple-400" />
                <span className="text-purple-400 font-semibold">Öne Çıkan Haber</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {filteredArticles[0].title}
              </h2>
              <p className="text-gray-300 mb-6">
                {filteredArticles[0].excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{filteredArticles[0].author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{getTimeAgo(filteredArticles[0].created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tag className="h-4 w-4" />
                    <span>{filteredArticles[0].category}</span>
                  </div>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  <span>Devamını Oku</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* News List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.slice(1).map((article) => (
              <div key={article.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400 text-sm font-medium">{article.category}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  {article.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {article.excerpt}
                </p>
                
                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{article.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(article.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Henüz Haber Yok</h2>
          <p className="text-gray-400">Bu kategoride henüz haber bulunmuyor.</p>
        </div>
      )}
    </div>
  )
}