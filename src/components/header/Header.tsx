'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShoppingCart, User, Globe, Menu, X, FileText, Trash2, LayoutDashboard, LogOut, Home } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LoginModal } from '@/components/auth/LoginModal'
import { SignupModal } from '@/components/auth/SignupModal'
import { useTheme } from 'next-themes'
import { useCart } from '@/contexts/CartContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { language, setLanguage, languageNames, t } = useLanguage()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [globeOpen, setGlobeOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showGlobeTooltip, setShowGlobeTooltip] = useState(false)
  const { theme, setTheme } = useTheme()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const { items, removeItem, itemCount, totalPrice } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let isActive = true
    setMounted(true)
    const handleScroll = () => {
      if (isActive) setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)

    // Show educational tooltip after 5 seconds
    let tooltipTimer2: NodeJS.Timeout | null = null
    const tooltipTimer = setTimeout(() => {
      if (isActive) {
        setShowGlobeTooltip(true)
        // Hide it after 5 seconds of showing
        tooltipTimer2 = setTimeout(() => {
          if (isActive) setShowGlobeTooltip(false)
        }, 5000)
      }
    }, 5000)

    return () => {
      isActive = false
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(tooltipTimer)
      if (tooltipTimer2) clearTimeout(tooltipTimer2)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleProfileClick = () => {
    if (user?.role === 'ADMIN') {
      router.push('/admin/overview')
    } else if (user?.role === 'WORKER') {
      router.push('/dashboard/worker')
    } else {
      router.push('/dashboard/user')
    }
  }

  const handleGlobeMouseDown = () => {
    timerRef.current = setTimeout(() => {
      setGlobeOpen(true)
    }, 2000) // 2 seconds
  }

  const handleGlobeMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleGlobeClick = (e: React.MouseEvent) => {
    // If modal didn't open (short click), toggle theme
    e.preventDefault()
    if (!globeOpen) {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  const isAdminRoute = pathname?.startsWith('/admin')
  const showLogo = !isAdminRoute || (mounted && isScrolled)
  const showCTA = !isAdminRoute || (mounted && isScrolled)

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          mounted && isScrolled
            ? "bg-background/25 backdrop-blur-md border-b border-border/10"
            : "bg-transparent border-transparent"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className={cn(
              "flex items-center space-x-2 transition-all duration-500",
              mounted && showLogo ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
            )}>
              <Link href="/" className="text-2xl font-bold text-primary">
                Tropic Tech
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className={cn(
              "hidden md:flex items-center space-x-6 transition-all duration-500",
              mounted && showCTA ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
            )} aria-label="Main navigation">

              {/* Cart Button with Sheet - Visible to all */}
              {mounted ? (
                <>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative" aria-label={`View shopping cart with ${itemCount} items`}>
                        <ShoppingCart className="h-5 w-5" />
                        {itemCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white" aria-hidden="true">
                            {itemCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[350px] sm:w-[500px] flex flex-col">
                      <SheetHeader>
                        <SheetTitle>Your Cart</SheetTitle>
                      </SheetHeader>

                      <div className="flex-1 overflow-y-auto py-4">
                        {items.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                            <p>Your cart is empty</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {items.map((item) => (
                              <div key={item.id} className="flex gap-4 p-3 rounded-lg border bg-card">
                                <div className="flex-1 space-y-1">
                                  <h4 className="font-medium leading-none">{item.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {item.type} • {item.duration ? `${item.duration} Days` : 'Monthly'}
                                  </p>
                                  <p className="text-sm font-semibold">
                                    Rp {item.price.toLocaleString('id-ID')}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {items.length > 0 && (
                        <SheetFooter className="flex-col gap-3 sm:flex-col sm:space-x-0 border-t pt-6">
                          <div className="flex justify-between items-center w-full mb-2">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="text-lg font-bold text-primary">
                              Rp {totalPrice.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <SheetClose asChild>
                            <Button
                              className="w-full"
                              onClick={() => router.push('/checkout')}
                            >
                              Proceed to Checkout
                            </Button>
                          </SheetClose>
                        </SheetFooter>
                      )}
                    </SheetContent>
                  </Sheet>

                  {isAuthenticated ? (
                    <>
                      {/* Globe with Tooltip and Hover-to-Language */}
                      <TooltipProvider>
                        <Tooltip open={showGlobeTooltip && !globeOpen}>
                          <div
                            className="relative inline-block"
                            onMouseEnter={() => {
                              if (window.innerWidth >= 768) setGlobeOpen(true)
                            }}
                            onMouseLeave={() => {
                              if (window.innerWidth >= 768) setGlobeOpen(false)
                            }}
                          >
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onMouseDown={handleGlobeMouseDown}
                                onMouseUp={handleGlobeMouseUp}
                                onTouchStart={handleGlobeMouseDown}
                                onTouchEnd={handleGlobeMouseUp}
                                onClick={handleGlobeClick}
                                className="relative transition-all duration-300"
                              >
                                <Globe className="h-5 w-5 transition-transform duration-500 hover:rotate-180" />
                              </Button>
                            </TooltipTrigger>

                            <DropdownMenu open={globeOpen} onOpenChange={setGlobeOpen} modal={false}>
                              <DropdownMenuTrigger className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden="true" />
                              <DropdownMenuContent
                                align="end"
                                className="dark:bg-slate-900 dark:border-slate-800 animate-in slide-in-from-top-5 fade-in duration-300"
                                onMouseEnter={() => {
                                  if (window.innerWidth >= 768) setGlobeOpen(true)
                                }}
                                onMouseLeave={() => {
                                  if (window.innerWidth >= 768) setGlobeOpen(false)
                                }}
                              >
                                {(Object.keys(languageNames) as Array<keyof typeof languageNames>).map((lang) => (
                                  <DropdownMenuItem
                                    key={lang}
                                    onClick={() => {
                                      setLanguage(lang)
                                      setGlobeOpen(false)
                                    }}
                                    className={language === lang ? 'bg-accent' : ''}
                                  >
                                    {languageNames[lang]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <TooltipContent side="bottom" className="animate-in fade-in slide-in-from-top-2 duration-2000 bg-transparent backdrop-blur-md border-none shadow-none text-foreground">
                            <p className="font-semibold">Click on Change to Dark/White Mode</p>
                            <p className="text-xs">Hover or Hold 2s for Language Options</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Dashboard Link */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleProfileClick}
                        title="Dashboard"
                        aria-label="Go to Dashboard"
                      >
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        <span className="sr-only">Dashboard</span>
                      </Button>

                      {/* Logout */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        title="Logout"
                        aria-label="Logout"
                      >
                        <LogOut className="h-5 w-5 text-destructive" />
                        <span className="sr-only">Logout</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => setShowSignupModal(true)}>
                        {t('signUp')}
                      </Button>
                      <Button onClick={() => setShowLoginModal(true)}>
                        {t('login')}
                      </Button>

                      {/* Globe with Tooltip and Hover-to-Language */}
                      <TooltipProvider>
                        <Tooltip open={showGlobeTooltip && !globeOpen}>
                          <div
                            className="relative inline-block"
                            onMouseEnter={() => {
                              if (window.innerWidth >= 768) setGlobeOpen(true)
                            }}
                            onMouseLeave={() => {
                              if (window.innerWidth >= 768) setGlobeOpen(false)
                            }}
                          >
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onMouseDown={handleGlobeMouseDown}
                                onMouseUp={handleGlobeMouseUp}
                                onTouchStart={handleGlobeMouseDown}
                                onTouchEnd={handleGlobeMouseUp}
                                onClick={handleGlobeClick}
                              >
                                <Globe className="h-5 w-5 transition-transform duration-500 hover:rotate-180" />
                              </Button>
                            </TooltipTrigger>

                            <DropdownMenu open={globeOpen} onOpenChange={setGlobeOpen} modal={false}>
                              <DropdownMenuTrigger className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden="true" />
                              <DropdownMenuContent
                                align="end"
                                className="dark:bg-slate-900 dark:border-slate-800 animate-in slide-in-from-top-5 fade-in duration-300"
                                onMouseEnter={() => {
                                  if (window.innerWidth >= 768) setGlobeOpen(true)
                                }}
                                onMouseLeave={() => {
                                  if (window.innerWidth >= 768) setGlobeOpen(false)
                                }}
                              >
                                {(Object.keys(languageNames) as Array<keyof typeof languageNames>).map((lang) => (
                                  <DropdownMenuItem
                                    key={lang}
                                    onClick={() => {
                                      setLanguage(lang)
                                      setGlobeOpen(false)
                                    }}
                                    className={language === lang ? 'bg-accent' : ''}
                                  >
                                    {languageNames[lang]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <TooltipContent side="bottom" className="animate-in fade-in slide-in-from-top-2 duration-1000 bg-transparent backdrop-blur-md border-none shadow-none text-foreground">
                            <p className="font-semibold">Click on Change to Dark/White Mode</p>
                            <p className="text-xs">Hover or Hold 2s for Language Options</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </>
              ) : (
                /* Static placeholder to avoid layout shift */
                <div className="h-10 w-48 bg-muted/20 animate-pulse rounded-md" />
              )}
            </nav>

            {/* Mobile Menu Button - TODO: Update mobile menu to match */}
            <button
              className={cn(
                "md:hidden transition-all duration-500",
                showCTA ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-6 px-4 space-y-3 border-t border-white/10 bg-background/60 backdrop-blur-md animate-in slide-in-from-top-5 duration-300 shadow-lg">
              <div className="grid grid-cols-1 gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" className="w-full justify-start h-12 text-base px-3" onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/checkout');
                  }}>
                    <ShoppingCart className="h-5 w-5 mr-3 text-primary" />
                    {t('cart')}
                    {itemCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {itemCount}
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base px-3"
                    onClick={handleGlobeClick}
                    onMouseDown={handleGlobeMouseDown}
                    onMouseUp={handleGlobeMouseUp}
                    onTouchStart={handleGlobeMouseDown}
                    onTouchEnd={handleGlobeMouseUp}
                  >
                    <Globe className="h-5 w-5 mr-3 text-primary" />
                    Mode / Lang
                  </Button>
                </div>

                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" className="w-full justify-start h-12 text-base" onClick={() => {
                      setMobileMenuOpen(false);
                      handleProfileClick();
                    }}>
                      <User className="h-5 w-5 mr-3 text-primary" />
                      {t('profile')}
                    </Button>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full h-11 border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('logout')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <Button
                      className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/10"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLoginModal(true);
                      }}
                    >
                      {t('login')}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full h-11 text-base"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowSignupModal(true);
                      }}
                    >
                      {t('signUp')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
      />
    </>
  )
}
