'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: 'USER' | 'WORKER' | 'ADMIN' | 'OPERATOR'
  whatsapp?: string
  baliAddress?: string
  profileImage?: string
  identityFile?: string
  identityType?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

// Safe default — prevents "must be used within AuthProvider" during SSR/static rendering
const defaultAuth: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: () => { },
}

const AuthContext = createContext<AuthContextType>(defaultAuth)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const setCookie = (name: string, value: string, days: number = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
  }

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }

  const checkAuth = async () => {
    try {
      // Check for bridge_token in URL (from Google Auth callback)
      const urlParams = new URLSearchParams(window.location.search)
      const bridgeToken = urlParams.get('bridge_token')

      if (bridgeToken) {
        setIsLoading(true)
        localStorage.setItem('token', bridgeToken)
        setCookie('token', bridgeToken)

        // Use location.replace to remove the token from history completely
        const url = new URL(window.location.href)
        url.searchParams.delete('bridge_token')
        window.history.replaceState({}, '', url.pathname + url.search)
      }

      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Ensure cookie is in sync with localStorage
      setCookie('token', token)

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        localStorage.removeItem('token')
        deleteCookie('token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      deleteCookie('token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        setCookie('token', data.token)
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (e) {
      console.error('Logout API call failed', e)
    }
    localStorage.removeItem('token')
    deleteCookie('token')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
