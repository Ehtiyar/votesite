export interface User {
  id: string
  email: string
  username: string
  minecraft_nick?: string
  discord_username?: string
  created_at: string
}

export interface MinecraftServer {
  id: string
  name: string
  ip_address: string
  invite_link: string
  server_port?: number
  game_version: string
  description: string
  detailed_description?: string
  banner_url?: string
  discord_link?: string
  website_link?: string
  votifier_key: string
  votifier_port: number
  owner_id: string
  vote_count: number
  member_count: number
  category: string
  gamemodes?: string[]
  supported_versions?: string[]
  uptime?: number
  country?: string
  created_at: string
}

export interface Vote {
  id: string
  user_id: string
  server_id: string
  created_at: string
}

export interface NewsArticle {
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

export interface BannerAd {
  id: string
  title: string
  description: string
  image_url?: string
  link_url?: string
  position: string
  is_active: boolean
  created_at: string
}

export interface AuthContextType {
  user: User | null
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}