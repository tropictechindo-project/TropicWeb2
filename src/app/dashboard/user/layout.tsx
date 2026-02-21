'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-1 py-12 px-4 mt-16 pb-20">
        <div className="container mx-auto">
          {/* Dashboard Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-1 bg-primary w-12 rounded-full" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">User Dashboard</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                HELLO, <span className="text-primary">{user?.fullName?.split(' ')[0].toUpperCase()}</span>
              </h1>
              <p className="text-muted-foreground text-lg font-medium">Manage your workspace rentals and account settings.</p>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="rounded-full font-black text-xs hover:bg-primary/5 tracking-widest gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" /> BACK TO HOME
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
