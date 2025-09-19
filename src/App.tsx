import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { HomePage } from './components/HomePage'
import { AuthPages } from './components/AuthPages'
import { AddServerPage } from './components/AddServerPage'
import { LeaderboardPage } from './components/LeaderboardPage'
import { AboutPage } from './components/AboutPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'login':
        return <AuthPages type="login" onPageChange={setCurrentPage} />
      case 'register':
        return <AuthPages type="register" onPageChange={setCurrentPage} />
      case 'add-server':
        return <AddServerPage onPageChange={setCurrentPage} />
      case 'leaderboard':
        return <LeaderboardPage />
      case 'about':
        return <AboutPage />
      default:
        return <HomePage />
    }
  }

  return (
    <AuthProvider>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderPage()}
      </Layout>
    </AuthProvider>
  )
}

export default App