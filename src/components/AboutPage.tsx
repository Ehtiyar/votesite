import React from 'react'
import { Server, Heart, Shield, Zap, Mail, Github, Twitter } from 'lucide-react'

export function AboutPage() {
  const features = [
    {
      icon: Server,
      title: 'Server Promotion',
      description: 'List your Minecraft server and reach thousands of potential players in our community.'
    },
    {
      icon: Heart,
      title: 'Fair Voting System',
      description: 'One vote per user per server ensures fair competition and authentic rankings.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Built with modern security practices and reliable infrastructure you can trust.'
    },
    {
      icon: Zap,
      title: 'Votifier Integration',
      description: 'Seamless integration with the Votifier plugin for instant reward distribution.'
    }
  ]

  const rules = [
    'Only real Minecraft servers are allowed - no fake or test servers',
    'One server listing per user to maintain fairness',
    'Servers must be publicly accessible and operational',
    'No offensive or inappropriate content in server names or descriptions',
    'Vote manipulation or bot voting will result in immediate removal',
    'Server information must be accurate and up-to-date'
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white mb-4">
          About <span className="text-purple-400">MineVote</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          The ultimate platform for Minecraft server promotion and discovery. We connect server owners 
          with players through a fair and transparent voting system.
        </p>
      </div>

      {/* Features Grid */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">Why Choose MineVote?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-300">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">How It Works</h2>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-white">Register & Add Server</h3>
              <p className="text-gray-300">Create your account and list your Minecraft server with all the details.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-white">Get Votes</h3>
              <p className="text-gray-300">Players discover your server and vote to show their support.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-white">Climb the Rankings</h3>
              <p className="text-gray-300">Higher vote counts mean better visibility and more players!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">Community Rules</h2>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-gray-300">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">Get In Touch</h2>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="text-center space-y-6">
            <p className="text-gray-300 text-lg">
              Have questions, suggestions, or need help? We're here to support the Minecraft community!
            </p>
            <div className="flex justify-center space-x-6">
              <a
                href="mailto:support@minevote.com"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
              >
                <Mail className="h-5 w-5" />
                <span>Email Us</span>
              </a>
              <a
                href="#"
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all transform hover:scale-105"
              >
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </a>
              <a
                href="#"
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
              >
                <Twitter className="h-5 w-5" />
                <span>Twitter</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-white/20">
        <p className="text-gray-400">
          © 2025 MineVote. Built with ❤️ for the Minecraft community.
        </p>
      </div>
    </div>
  )
}