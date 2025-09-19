import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AuthContextType, User } from '../types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('Fetching user profile for:', userId)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('Profile fetch result:', { data, error })

      if (error) {
        console.error('Profile fetch error:', error)
        throw error
      }
      
      setUser(data)
      console.log('User profile set:', data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
      console.log('Loading set to false')
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    console.log('SignUp attempt:', { email, username })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      console.log('SignUp result:', { data, error })

      if (error) {
        console.error('SignUp error:', error)
        throw error
      }

      // Email doğrulama kapalıysa otomatik login yap
      if (data.user && !data.user.email_confirmed_at) {
        console.log('Auto-login after signup')
        // Kısa bir bekleme sonrası otomatik login
        setTimeout(async () => {
          try {
            await signIn(email, password)
          } catch (loginError) {
            console.error('Auto-login failed:', loginError)
          }
        }, 1000)
      }

      return data
    } catch (error) {
      console.error('SignUp catch error:', error)
      throw error
    } finally {
      // Loading state'i her durumda false yap
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('SignIn attempt:', { email })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('SignIn result:', { data, error })

      if (error) {
        console.error('SignIn error:', error)
        throw error
      }

      if (data.user) {
        console.log('User signed in:', data.user.id)
        await fetchUserProfile(data.user.id)
      }
    } catch (error) {
      console.error('SignIn catch error:', error)
      throw error
    } finally {
      // Loading state'i her durumda false yap
      setLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value: AuthContextType = {
    user,
    signUp,
    signIn,
    signOut,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
