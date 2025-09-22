import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Crown, 
  Zap, 
  Star, 
  TrendingUp, 
  Target, 
  BarChart3, 
  CheckCircle, 
  ArrowLeft,
  CreditCard,
  Calendar,
  Users,
  Award
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface BoostPackage {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
}

export function BoostPackagesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [packages, setPackages] = useState<BoostPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<BoostPackage | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('server_boost_packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) {
        console.error('Error fetching packages:', error)
        return
      }

      setPackages(data || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchasePackage = (pkg: BoostPackage) => {
    if (!user) {
      alert('Paket satın almak için giriş yapmanız gerekiyor!')
      return
    }
    
    setSelectedPackage(pkg)
    setShowPaymentModal(true)
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'featured_spot':
        return <Crown className="h-4 w-4" />
      case 'top_banner':
        return <TrendingUp className="h-4 w-4" />
      case 'highlighted_card':
        return <Zap className="h-4 w-4" />
      case 'priority_listing':
        return <Star className="h-4 w-4" />
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />
      case 'high_visibility':
        return <Target className="h-4 w-4" />
      case 'click_tracking':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getFeatureName = (feature: string) => {
    switch (feature) {
      case 'featured_spot':
        return 'Ana sayfada öne çıkarma'
      case 'top_banner':
        return 'Üst banner reklamı'
      case 'highlighted_card':
        return 'Vurgulanmış kart'
      case 'priority_listing':
        return 'Öncelikli listeleme'
      case 'analytics':
        return 'Detaylı analitik'
      case 'high_visibility':
        return 'Yüksek görünürlük'
      case 'click_tracking':
        return 'Tıklama takibi'
      default:
        return feature
    }
  }

  const getPackageColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-yellow-500 to-orange-500',
      'from-green-500 to-green-600',
      'from-pink-500 to-pink-600'
    ]
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading boost packages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Boost Your Server
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Make your Minecraft server stand out with our premium boost packages. 
            Get more visibility, more players, and more votes!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-white mb-2">+300%</h3>
            <p className="text-gray-400">More Visibility</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <Award className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-white mb-2">+500%</h3>
            <p className="text-gray-400">More Votes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-white mb-2">+200%</h3>
            <p className="text-gray-400">More Players</p>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`bg-white/10 backdrop-blur-sm rounded-xl p-8 border transition-all duration-300 hover:scale-105 ${
                index === 2 ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/20' : 'border-white/20 hover:border-purple-400/50'
              }`}
            >
              {/* Package Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getPackageColor(index)} flex items-center justify-center mx-auto mb-4`}>
                  {index === 0 && <Star className="h-8 w-8 text-white" />}
                  {index === 1 && <Zap className="h-8 w-8 text-white" />}
                  {index === 2 && <Crown className="h-8 w-8 text-white" />}
                  {index === 3 && <TrendingUp className="h-8 w-8 text-white" />}
                  {index === 4 && <Award className="h-8 w-8 text-white" />}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <p className="text-gray-400 mb-4">{pkg.description}</p>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-4xl font-bold text-white">₺{pkg.price}</span>
                  <div className="text-left">
                    <div className="text-gray-400 text-sm">for</div>
                    <div className="text-white font-semibold">{pkg.duration_days} days</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <h4 className="text-lg font-semibold text-white mb-4">Features:</h4>
                {pkg.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <div className="text-green-400">
                      {getFeatureIcon(feature)}
                    </div>
                    <span className="text-gray-300">{getFeatureName(feature)}</span>
                  </div>
                ))}
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchasePackage(pkg)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  index === 2
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transform hover:scale-105'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                }`}
              >
                {index === 2 ? '🔥 Most Popular' : 'Purchase Now'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">How does boosting work?</h3>
              <p className="text-gray-400">When you purchase a boost package, your server gets special visibility features like featured spots, highlighted cards, and priority listing for the duration you choose.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I cancel my boost?</h3>
              <p className="text-gray-400">Boost packages are non-refundable, but you can let them expire naturally. Contact support if you have any issues.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">How long does it take to activate?</h3>
              <p className="text-gray-400">Your boost features are activated immediately after successful payment processing.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I stack multiple boosts?</h3>
              <p className="text-gray-400">Yes! You can purchase multiple boost packages to extend your server's visibility period.</p>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedPackage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Purchase {selectedPackage.name}</h3>
              <p className="text-gray-400 mb-6">
                You are about to purchase {selectedPackage.name} for ₺{selectedPackage.price} 
                ({selectedPackage.duration_days} days)
              </p>
              
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Features included:</h4>
                <div className="space-y-2">
                  {selectedPackage.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300 text-sm">{getFeatureName(feature)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement payment processing
                    alert('Payment processing will be implemented here!')
                    setShowPaymentModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pay ₺{selectedPackage.price}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
