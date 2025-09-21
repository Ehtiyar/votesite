import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { HomePage } from './components/HomePage'
import { AuthPages } from './components/AuthPages'
import { AddServerPage } from './components/AddServerPage'
import { LeaderboardPage } from './components/LeaderboardPage'
import { AboutPage } from './components/AboutPage'
import { ServerDetailPage } from './components/ServerDetailPage'
import { NewsPage } from './components/NewsPage'
import { AdminPanel } from './components/AdminPanel'
import { AdminLogin } from './components/AdminLogin'
import { ProfilePage } from './components/ProfilePage'
import { MyServersPage } from './components/MyServersPage'
import { ChangePasswordPage } from './components/ChangePasswordPage'
import { FavoritesPage } from './components/FavoritesPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthPages type="login" />} />
                <Route path="/register" element={<AuthPages type="register" />} />
                <Route path="/add-server" element={<AddServerPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/server/:id" element={<ServerDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-servers" element={<MyServersPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App