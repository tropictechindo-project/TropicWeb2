'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: 'USER' | 'WORKER' | 'ADMIN'
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const setCookie = (name: string, value: string, days: number = 7) => {
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
        localStorage.setItem('token', bridgeToken)
        setCookie('token', bridgeToken)
        // Clean URL without reloading
        const newUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, '', newUrl)
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

  const logout = () => {
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
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
