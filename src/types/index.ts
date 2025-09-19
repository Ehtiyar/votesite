export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface MinecraftServer {
  id: string
  name: string
  ip_address: string
  game_version: string
  description: string
  votifier_key: string
  votifier_port: number
  owner_id: string
  vote_count: number
  created_at: string
}

export interface Vote {
  id: string
  user_id: string
  server_id: string
  created_at: string
}

export interface AuthContextType {
  user: User | null
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}