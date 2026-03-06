'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Download,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Camera,
  Upload,
  UserCheck,
  IdCard,
  Pencil,
  Loader2,
  AlertCircle,
  Package,
  CreditCard,
  User as UserIcon,
  MessageSquare,
  Headset,
  LogOut,
  Bell,
  ExternalLink,
  Map as MapIcon,
  Truck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SupportChatHub } from '@/components/chat/SupportChatHub'
import { useNotification } from '@/contexts/NotificationContext'
import { AiDashboardPanel } from '@/components/ai/AiDashboardPanel'
import { Bot } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { countries, normalizeWhatsApp } from '@/lib/utils/whatsapp'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/user/UserSidebar"
import { DeliveriesClient } from "@/components/admin/deliveries/DeliveriesClient"

import { useRealtimePoller } from '@/hooks/useRealtimePoller'

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const { unreadMessagesCount, spiNotifications } = useNotification()
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('rentals')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '' })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Chat State
  const [showSupportHub, setShowSupportHub] = useState(false)
  const [defaultSupportGroup, setDefaultSupportGroup] = useState<string | undefined>(undefined)

  // Support Group Chat (for Hub default open)
  const [supportGroup, setSupportGroup] = useState<{ id: string, name: string } | null>(null)

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  // Profile Edit State
  const [editForm, setEditForm] = useState({
    fullName: '',
    whatsappCode: '+62',
    whatsappNumber: '',
    baliAddress: '',
  })

  // ─── Real-time Polling ───────────────────────────────────────────────────
  // Poll every 30 seconds for order status updates
  useRealtimePoller(() => {
    if (user) fetchOrders(true)
  }, 30000)

  useEffect(() => {
    if (user) {
      fetchOrders()

      // Try to split user.whatsapp into code and number
      let code = '+62'
      let num = user.whatsapp || ''

      for (const c of countries) {
        if (num.startsWith(c.code)) {
          code = c.code
          num = num.substring(c.code.length)
          break
        }
      }

      setEditForm({
        fullName: user.fullName || '',
        whatsappCode: code,
        whatsappNumber: num,
        baliAddress: user.baliAddress || '',
      })
      fetchSupportGroup()
    }
  }, [user])

  const fetchSupportGroup = async () => {
    try {
      const token = localStorage.getItem('token')
      // Use the init endpoint which creates/returns the group
      const res = await fetch('/api/groups/support', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.group) {
        setSupportGroup({ id: data.group.id, name: data.group.name })
        return data.group
      }
    } catch (e) {
      console.error('Failed to initialize support group', e)
    }
    return null
  }

  const fetchOrders = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders/my-orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const normalizedWhatsapp = normalizeWhatsApp(editForm.whatsappCode, editForm.whatsappNumber)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          whatsapp: normalizedWhatsapp,
          baliAddress: editForm.baliAddress,
        }),
      })

      if (response.ok) {
        toast.success('Profile updated successfully')
        setIsEditing(false)
        // Note: useAuth should refresh or we can manually update local state if needed
        // For simplicity, we trigger a page refresh or wait for context update
        window.location.reload()
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      toast.error('Error updating profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.current || !passwordForm.new) {
      toast.error('Both current and new passwords are required')
      return
    }
    if (passwordForm.new.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Password updated successfully')
        setPasswordForm({ current: '', new: '' })
      } else {
        toast.error(data.error || 'Failed to update password')
      }
    } catch (error) {
      toast.error('Error changing password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profileImage' | 'identityFile') => {
    const file = e.target.files?.[0]
    if (!file) return

    // In a real app, you'd upload to Supabase Storage or S3
    // For now, we'll simulate an upload and get a temporary URL (using FileReader for preview)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      // Mocking the upload process
      toast.loading(`Uploading ${type === 'profileImage' ? 'photo' : 'document'}...`)

      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/auth/me', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [type]: base64String }),
        })

        if (response.ok) {
          toast.dismiss()
          toast.success('File uploaded successfully')
          window.location.reload()
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        toast.dismiss()
        toast.error('Max file size exceeded or upload failed')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleExtendRental = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}/extend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 7 }),
      })

      if (response.ok) {
        toast.success('Rental extension request sent')
        fetchOrders()
      } else {
        toast.error('Failed to extend rental')
      }
    } catch (error) {
      toast.error('Failed to extend rental')
    }
  }

  const handleItemRequest = async (itemId: string, type: string) => {
    let reason = ''
    if (type === 'SWAP') {
      const input = prompt('Please specify the reason for the equipment swap:')
      if (input === null) return
      reason = input
    } else if (type === 'RETURN') {
      if (!confirm('Are you sure you want to return this specific item early?')) return
    } else if (type === 'EXTENSION') {
      if (!confirm('Request an extension for this specific item?')) return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/rental-items/${itemId}/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reason })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed request')
      toast.success(`${type} request submitted successfully.`)
      fetchOrders()
    } catch (err: any) {
      toast.error(err.message || 'Could not place request')
    }
  }

  const handleConfirmReceipt = async (deliveryId: string) => {
    if (!confirm('Confirm that you have received all your rented items?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/user/deliveries/${deliveryId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('✅ Receipt confirmed! Your rental is now active.')
      fetchOrders()
    } catch (err: any) {
      toast.error(err.message || 'Could not confirm receipt')
    }
  }

  const NotificationBell = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group rounded-full hover:bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {spiNotifications.length > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between p-2 pb-1 border-b mb-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notifications</h3>
          {spiNotifications.length > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1">{spiNotifications.length}</Badge>}
        </div>
        <ScrollArea className="h-[300px]">
          {spiNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs font-medium">No new alerts</div>
          ) : (
            spiNotifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className="p-3 rounded-lg cursor-pointer flex flex-col items-start gap-1 hover:bg-muted/50 focus:bg-muted/50 mb-1"
                onClick={() => {
                  if (notif.link) window.location.href = notif.link
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-bold text-xs truncate flex-1">{notif.title}</span>
                  {notif.link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{notif.message}</p>
                <span className="text-[9px] text-muted-foreground/60 mt-1">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3 font-bold text-[10px]">COMPLETED</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 rounded-full px-3 font-bold text-[10px]">CANCELLED</Badge>
      case 'ACTIVE':
        return <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 font-bold text-[10px]">ACTIVE RENTAL</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-full px-3 font-bold text-[10px]">CONFIRMED</Badge>
      default:
        return <Badge variant="secondary" className="rounded-full px-3 font-bold text-[10px]">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const activeOrders = orders.filter(o => o.status === 'ACTIVE' || o.status === 'CONFIRMED' || o.status === 'PAID' || o.status === 'PENDING')
  const pastOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')

  return (
    <SidebarProvider>
      <UserSidebar currentTab={activeTab} onTabChange={setActiveTab} userName={user?.fullName || 'User'} isGuest={!user?.identityFile} />
      <SidebarInset className="bg-background min-h-screen relative flex w-full flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div className="flex flex-col ml-2">
              <h1 className="text-lg font-black uppercase tracking-tight leading-tight flex items-center gap-2">
                <span className="text-primary truncate">Client Portal</span>
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/tracking'} className="h-8 gap-1.5 flex text-xs">
            <MapIcon className="w-3.5 h-3.5" />Global Tracker
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            if (supportGroup) setDefaultSupportGroup(supportGroup.id)
            setShowSupportHub(true)
          }} className="h-8 gap-1.5 flex text-xs">
            <Headset className="w-3.5 h-3.5" />Support
            {unreadMessagesCount > 0 && <Badge className="ml-0.5 h-4 px-1" variant="destructive">{unreadMessagesCount}</Badge>}
          </Button>
          <NotificationBell />
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Live Delivery Status (Grab/Gojek Style) */}
          {(() => {
            const activeDeliveryOrder = activeOrders.find(o =>
              o.invoices?.some((i: any) =>
                i.deliveries?.some((d: any) =>
                  ['QUEUED', 'CLAIMED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(d.status)
                )
              )
            )

            if (!activeDeliveryOrder) return null

            const delivery = activeDeliveryOrder.invoices
              .flatMap((i: any) => i.deliveries)
              .find((d: any) => ['QUEUED', 'CLAIMED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(d.status))

            const statusConfig = {
              QUEUED: { label: 'Finding a Worker', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              CLAIMED: { label: 'Preparing your Gear', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              OUT_FOR_DELIVERY: { label: 'Courier is En Route', icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
              ARRIVED: { label: 'Courier has Arrived!', icon: MapPin, color: 'text-green-500', bg: 'bg-green-500/10' },
            } as any

            const config = statusConfig[delivery.status] || statusConfig.QUEUED

            return (
              <Card className="border-none shadow-xl bg-card border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`${config.bg} ${config.color} border-none font-black text-[10px] tracking-widest uppercase px-3 py-1 flex items-center gap-2`}>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                          </span>
                          Live Tracking
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order: {activeDeliveryOrder.orderNumber}</span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-2xl font-black tracking-tighter uppercase">{config.label}</h3>
                        <p className="text-xs text-muted-foreground font-medium">Estimated arrival in Bali traffic is subject to change.</p>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <div className={`p-4 rounded-2xl ${config.bg}`}>
                          <config.icon className={`h-8 w-8 ${config.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${config.color.replace('text', 'bg')} transition-all duration-1000`}
                              style={{
                                width: delivery.status === 'QUEUED' ? '25%' :
                                  delivery.status === 'CLAIMED' ? '50%' :
                                    delivery.status === 'OUT_FOR_DELIVERY' ? '75%' : '100%'
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-2">
                            {['Order', 'Prep', 'Transit', 'Here'].map((s, i) => (
                              <span key={s} className="text-[9px] font-black uppercase text-muted-foreground">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          className="flex-1 font-black rounded-xl gap-2 h-12 shadow-lg shadow-primary/20"
                          onClick={() => window.location.href = `/tracking/${delivery.trackingCode || activeDeliveryOrder.invoices?.[0]?.invoiceNumber}`}
                        >
                          <MapPin className="h-4 w-4" /> OPEN LIVE MAP
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-xl"
                          onClick={() => {
                            if (supportGroup) setDefaultSupportGroup(supportGroup.id)
                            setShowSupportHub(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {delivery.claimedByWorker && (
                      <div className="w-full md:w-64 bg-muted/30 border-t md:border-t-0 md:border-l p-6 flex flex-col justify-center items-center text-center space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Assigned Courier</p>
                        <div className="relative">
                          {delivery.claimedByWorker.profileImage ? (
                            <img src={delivery.claimedByWorker.profileImage} alt={delivery.claimedByWorker.fullName} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-background shadow-lg" />
                          ) : (
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-2 ring-background shadow-lg">
                              <UserIcon className="h-8 w-8 text-primary" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-background" title="Online" />
                        </div>
                        <div>
                          <p className="font-black tracking-tight">{delivery.claimedByWorker.fullName}</p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-[10px] font-bold uppercase text-primary"
                            onClick={() => window.open(`https://wa.me/${delivery.claimedByWorker.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                          >
                            WhatsApp Courier
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {activeTab === 'rentals' && (
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in duration-500">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-1 bg-primary w-12 rounded-full" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">User Dashboard</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                  HELLO, <span className="text-primary">{user?.fullName?.split(' ')[0].toUpperCase()}</span>
                </h1>
                <p className="text-muted-foreground text-base font-medium">Manage your workspace rentals and account settings.</p>
              </div>
            </div>
          )}

          {activeTab === 'rentals' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="border-none shadow-sm bg-zinc-900 text-white overflow-hidden group cursor-pointer hover:bg-zinc-800 transition-colors">
                      <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                          <Package className="h-20 w-20" />
                        </div>
                        <div className="space-y-1 relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Rentals</p>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black">{orders.length}</span>
                            <span className="text-xs text-primary font-bold mb-1">UNITS</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">Rented Equipment</DialogTitle>
                      <DialogDescription>Full list of gear currently assigned to your account.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="space-y-3">
                        {orders.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground text-sm">No rentals found</p>
                        ) : (
                          orders.flatMap(o => o.rentalItems).map((item, idx) => {
                            const name = item.variant?.product?.name || item.rentalPackage?.name || "Equipment"
                            return (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                                <Package className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                  <p className="font-bold text-sm tracking-tight">{name}</p>
                                  <p className="text-[10px] font-mono text-muted-foreground">SN: {item.unit?.serialNumber || 'PENDING'}</p>
                                </div>
                                <Badge variant="secondary" className="text-[9px] uppercase font-black">{item.status || 'Active'}</Badge>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 to-transparent overflow-hidden cursor-pointer hover:bg-primary/5 transition-colors">
                      <CardContent className="p-6 text-zinc-900 dark:text-zinc-100">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Island Logistics</p>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black">{orders.filter(o => o.invoices?.some((i: any) => i.deliveries?.some((d: any) => d.status !== 'COMPLETED'))).length}</span>
                            <span className="text-xs text-muted-foreground font-bold mb-1 uppercase">Active Shipments</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">Active Shipments</DialogTitle>
                      <DialogDescription>Real-time status of your gear in transit across Bali.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-4">
                      {orders.filter(o => o.invoices?.some((i: any) => i.deliveries?.some((d: any) => d.status !== 'COMPLETED'))).length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground text-sm italic">No active shipments at the moment.</p>
                      ) : (
                        orders.filter(o => o.invoices?.some((i: any) => i.deliveries?.some((d: any) => d.status !== 'COMPLETED'))).map((order, idx) => {
                          const delivery = order.invoices.flatMap((i: any) => i.deliveries).find((d: any) => d.status !== 'COMPLETED')
                          return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
                              <div className="flex items-center gap-3">
                                <Truck className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="font-bold text-sm">Order #{order.orderNumber}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">{delivery.status.replace(/_/g, ' ')}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] font-bold"
                                onClick={() => window.location.href = `/tracking/${delivery.trackingCode || order.orderNumber}`}
                              >
                                TRACK
                              </Button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="border-none shadow-sm bg-muted/30 overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Island Coverage</p>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-bold uppercase">Bali Delivery</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Certified 24/7 Support Included</p>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">Our Bali Guarantee</DialogTitle>
                      <DialogDescription>Why professionals choose Tropic Tech for Bali workstations.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Island-Wide Internal Fleet</h4>
                          <p className="text-xs text-muted-foreground">We don't just use apps. We have our own couriers who know Bali traffic and Canggu shortcuts.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <ShieldCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Equipment Protection</h4>
                          <p className="text-xs text-muted-foreground">Every rental includes structural insurance and 1:1 hardware swap if any technical issues arise.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Headset className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">24/7 On-Ground Support</h4>
                          <p className="text-xs text-muted-foreground">Broken charger? Connectivity issues? Our team is on WhatsApp 24/7 to solve it locally.</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* ACTIVE RENTED EQUIPMENT LIST */}
              <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Active Rented Equipment
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-primary/5 text-primary border-none">
                    Realtime Data
                  </Badge>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-black text-lg uppercase tracking-tighter">No Equipment Deployed</p>
                    <p className="text-muted-foreground text-xs mt-1">Visit our catalog to start your workstation rental.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activeOrders.flatMap((order: any) =>
                      order.rentalItems.map((item: any) => ({ ...item, orderNumber: order.orderNumber, orderId: order.id }))
                    ).map((item: any, idx: number) => {
                      const name = item.variant?.product?.name || item.rentalPackage?.name || "Equipment"
                      return (
                        <Card
                          key={`${item.id}-${idx}`}
                          className="group hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden bg-card/50 backdrop-blur-sm cursor-pointer"
                          onClick={() => {
                            const order = orders.find(o => o.id === item.orderId)
                            if (order) {
                              setSelectedOrder(order)
                              setIsOrderModalOpen(true)
                            }
                          }}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                {item.variant?.product?.images?.[0] ? (
                                  <img src={item.variant.product.images[0]} alt={name} className="h-8 w-8 object-contain" />
                                ) : (
                                  <Package className="h-6 w-6 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-black text-sm tracking-tight">{name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <ShoppingBag className="w-3 h-3" /> {item.orderNumber}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">|</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">SN: {item.unit?.serialNumber || 'PENDING DISPATCH'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="hidden md:block text-right pr-4 border-r">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                                <p className="text-[10px] font-bold text-green-600 uppercase">Deployed</p>
                              </div>
                              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* RENTAL HISTORY LIST */}
              <div className="space-y-4 pt-8 pb-12">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Rental History
                  </h3>
                  <Button variant="link" onClick={() => setActiveTab('history')} className="text-[10px] font-black uppercase tracking-widest">
                    View All History
                  </Button>
                </div>

                {pastOrders.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-xs italic bg-muted/5 rounded-2xl border border-dashed">No past rental activity recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {pastOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex items-center justify-center text-muted-foreground">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm tracking-tight">#{order.orderNumber}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-black text-xs">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const shareableToken = order.invoices?.[0]?.shareableToken;
                              if (shareableToken) window.open(`/invoice/public/${shareableToken}`, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeOrders.length === 0 ? (
                <div className="hidden py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-black text-xl uppercase tracking-tighter">No Active Gear Found</p>
                  <p className="text-muted-foreground text-sm mt-1">Ready to upgrade your workspace? Browse our products.</p>
                  <Button className="mt-6 rounded-full font-bold px-8" variant="outline" onClick={() => window.location.href = '#products'}>
                    EXPLORE CATALOG
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {activeOrders.map((order) => (
                    <Card key={order.id} className="border-none shadow-lg overflow-hidden group">
                      <div className="flex flex-col md:flex-row h-full">
                        <div className="bg-muted/50 p-6 md:w-72 flex flex-col justify-between border-r">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order ID</div>
                            <div className="text-xl font-black tracking-tighter text-primary">{order.orderNumber}</div>
                            <div className="pt-2">{getStatusBadge(order.status)}</div>
                          </div>
                          <div className="pt-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Expires: {new Date(order.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-4 md:p-6 flex-1 flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-4 flex-1">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deployed Equipment</label>
                              <div className="grid gap-2">
                                {order.rentalItems.map((item: any) => {
                                  const name = item.variant?.product?.name || item.rentalPackage?.name || "Equipment"
                                  const activeRequest = item.itemRequests?.find((r: any) => r.status === 'PENDING')

                                  return (
                                    <div key={item.id} className="flex flex-col gap-3 p-3 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 transition-colors">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-background rounded-lg shrink-0">
                                            <Package className="h-4 w-4 text-primary" />
                                          </div>
                                          <span className="font-bold text-sm tracking-tight truncate border-b border-transparent">
                                            {name}
                                            <span className="text-primary ml-1 shrink-0">x{item.quantity}</span>
                                          </span>
                                        </div>
                                        {item.unit && (
                                          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-background px-2 py-1 rounded-md border w-fit">
                                            SN: <span className="font-bold text-foreground">{item.unit.serialNumber.slice(-6)}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Item State Machine Engine */}
                                      {activeRequest ? (
                                        <div className="flex items-center gap-2 bg-orange-500/10 text-orange-600 p-2 rounded-lg text-[10px] font-black tracking-widest uppercase">
                                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                                          {activeRequest.type} REQUEST PENDING
                                        </div>
                                      ) : (
                                        order.status === 'ACTIVE' && (
                                          <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold flex-1 bg-background hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => handleItemRequest(item.id, 'EXTENSION')}>
                                              EXTEND
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold flex-1 bg-background" onClick={() => handleItemRequest(item.id, 'SWAP')}>
                                              SWAP
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold flex-1 bg-background text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleItemRequest(item.id, 'RETURN')}>
                                              RETURN E.T.A
                                            </Button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="md:w-64 flex flex-col justify-between items-start md:items-end gap-6">
                            <div className="w-full md:text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Bill</p>
                              <p className="text-2xl font-black tracking-tighter">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                              <p className="text-[10px] font-bold text-green-600 tracking-wider uppercase">VIA {order.paymentMethod}</p>
                            </div>
                            <div className="grid grid-cols-1 w-full gap-2">
                              {/* New Delivery Confirmation Logic */}
                              {order.invoices?.flatMap((i: any) => i.deliveries || []).some((d: any) => d.status === 'ARRIVED') && (
                                <Button
                                  size="sm"
                                  className="w-full font-black rounded-lg gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/10 animate-pulse"
                                  onClick={() => {
                                    const arrivedDelivery = order.invoices?.flatMap((i: any) => i.deliveries || []).find((d: any) => d.status === 'ARRIVED')
                                    if (arrivedDelivery) handleConfirmReceipt(arrivedDelivery.id)
                                  }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  CONFIRM ARRIVAL
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full font-black rounded-lg gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                                onClick={() => {
                                  // Use invoice number as fallback for tracking if trackingCode is missing
                                  const dc = order.invoices?.flatMap((i: any) => i.deliveries || []).find((d: any) => d.status !== 'COMPLETED');
                                  const trackingRef = dc?.trackingCode || order.invoices?.[0]?.invoiceNumber;

                                  if (trackingRef) {
                                    window.location.href = `/tracking/${trackingRef}`;
                                  } else {
                                    setActiveTab('tracking');
                                  }
                                }}
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                LIVE MAP TRACKER
                              </Button>

                              <Button size="sm" className="w-full font-black rounded-lg gap-2" onClick={() => handleExtendRental(order.id)}>
                                <Clock className="h-3.5 w-3.5" />
                                EXTEND RENTAL
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full font-bold text-xs"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setIsOrderModalOpen(true)
                                }}
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                VIEW ORDER DETAILS
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}

                  {/* Order Detail Modal */}
                  <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                    <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                      {selectedOrder && (
                        <div className="flex flex-col">
                          <div className="bg-zinc-900 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-20">
                              <ShoppingBag className="h-32 w-32" />
                            </div>
                            <div className="space-y-2 relative z-10">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="border-primary text-primary font-black text-[10px] uppercase px-3">
                                  {selectedOrder.status}
                                </Badge>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reference: {selectedOrder.orderNumber}</span>
                              </div>
                              <h2 className="text-4xl font-black tracking-tighter">ORDER DETAILS</h2>
                              <p className="text-zinc-400 text-xs font-medium max-w-md">Comprehensive view of your workstation deployment and billing items.</p>
                            </div>
                          </div>

                          <div className="p-6 space-y-6 bg-card">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Start Date</p>
                                <p className="font-bold text-sm">{new Date(selectedOrder.startDate).toLocaleDateString()}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">End Date</p>
                                <p className="font-bold text-sm">{new Date(selectedOrder.endDate).toLocaleDateString()}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Payment Method</p>
                                <p className="font-bold text-sm uppercase">{selectedOrder.paymentMethod}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Paid</p>
                                <p className="font-bold text-sm text-primary">Rp {selectedOrder.totalAmount?.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h3 className="text-xs font-black uppercase tracking-widest">Inventory Deployed</h3>
                              <div className="divide-y border rounded-2xl overflow-hidden">
                                {selectedOrder.rentalItems?.map((item: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-muted/10">
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-xl bg-background border flex items-center justify-center">
                                        <Package className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm tracking-tight">{item.variant?.product?.name || item.rentalPackage?.name}</p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-muted-foreground">SN: {item.unit?.serialNumber || 'Pending Dispatch'}</span>
                                          {item.unit?.status && <Badge variant="secondary" className="text-[8px] h-4 px-1">{item.unit.status}</Badge>}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-black">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button
                                className="flex-1 font-black rounded-xl"
                                onClick={() => {
                                  if (selectedOrder.invoices?.[0]?.shareableToken) {
                                    window.open(`/invoice/public/${selectedOrder.invoices[0].shareableToken}`, '_blank')
                                  } else {
                                    toast.error('Invoice not available')
                                  }
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" /> DOWNLOAD INVOICE
                              </Button>
                              <Button
                                variant="outline"
                                className="font-black rounded-xl"
                                onClick={() => window.location.href = `/tracking/${selectedOrder.invoices?.[0]?.deliveries?.[0]?.trackingCode || selectedOrder.orderNumber}`}
                              >
                                <MapPin className="h-4 w-4 mr-2" /> LIVE TRACKING
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in duration-500">
              <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/30 border-b">
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Range</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pastOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm font-medium">No previous orders found</td>
                          </tr>
                        ) : (
                          pastOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-muted/20 transition-colors group">
                              <td className="px-6 py-4">
                                <span className="font-black tracking-tight">{order.orderNumber}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(order.status)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-bold">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="group-hover:text-primary transition-colors"
                                  onClick={() => {
                                    const shareableToken = order.invoices?.[0]?.shareableToken;
                                    if (shareableToken) {
                                      window.open(`/invoice/public/${shareableToken}`, '_blank');
                                    } else {
                                      toast.error('Invoice link not available');
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Delivery Tracker Tab */}
          {activeTab === 'tracking' && (
            <div className="animate-in fade-in duration-500 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Delivery Tracker</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Live monitoring of your active dispatches and deliveries.</p>
                </div>
              </div>
              <div className="w-full">
                <DeliveriesClient
                  userRole="USER"
                  initialDeliveries={orders.flatMap((o: any) =>
                    o.invoices?.flatMap((i: any) => i.deliveries || []) || []
                  )}
                />
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-500">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-none shadow-lg overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-primary" />
                          PERSONAL IDENTITY
                        </CardTitle>
                        <CardDescription>Verified account information used for deliveries.</CardDescription>
                      </div>
                      {!isEditing ? (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="rounded-full h-8 px-4 font-bold text-[10px] gap-2">
                          <Pencil className="h-3 w-3" /> EDIT
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-full h-8 px-4 font-bold text-[10px]">
                          CANCEL
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-8">
                    <div className="flex flex-col items-center gap-4 mb-4">
                      <div className="relative group">
                        <div className="h-24 w-24 rounded-2xl bg-muted overflow-hidden border-4 border-background shadow-xl">
                          {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <UserIcon className="h-10 w-10 text-muted-foreground opacity-20" />
                            </div>
                          )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <Camera className="h-4 w-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profileImage')} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Photo</p>
                    </div>

                    {!isEditing ? (
                      <div className="grid gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
                          <p className="font-bold border-b border-muted py-2">{user?.fullName}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp Contact</label>
                          <p className="font-bold border-b border-muted py-2">{user?.whatsapp}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity File (Passport/KTP)</label>
                          <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-dashed mt-2">
                            {user?.identityFile ? (
                              <>
                                <div className="h-8 w-8 bg-green-500/10 text-green-600 rounded flex items-center justify-center">
                                  <ShieldCheck className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-bold text-green-600">Document Uploaded</span>
                              </>
                            ) : (
                              <>
                                <div className="h-8 w-8 bg-orange-500/10 text-orange-600 rounded flex items-center justify-center">
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-bold text-orange-600 tracking-tight">No document on file</span>
                              </>
                            )}
                            <label className="ml-auto text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-primary transition-colors">
                              {user?.identityFile ? 'REPLACE' : 'UPLOAD NOW'}
                              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'identityFile')} />
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                          <Input
                            value={editForm.fullName}
                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            className="rounded-xl font-bold bg-muted/30 border-none h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp Contact</Label>
                          <div className="flex gap-2">
                            <Select
                              value={editForm.whatsappCode}
                              onValueChange={(val) => setEditForm({ ...editForm, whatsappCode: val })}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[110px] h-12 rounded-xl bg-muted/30 border-none">
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((c) => (
                                  <SelectItem key={c.code + c.name} value={c.code}>
                                    <span className="flex items-center gap-2">
                                      <span>{c.flag}</span>
                                      <span>{c.code}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={editForm.whatsappNumber}
                              onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                              className="flex-1 rounded-xl font-bold bg-muted/30 border-none h-12"
                              placeholder="812345678"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bali Delivery Address</Label>
                          <Input
                            value={editForm.baliAddress}
                            onChange={(e) => setEditForm({ ...editForm, baliAddress: e.target.value })}
                            className="rounded-xl font-bold bg-muted/30 border-none h-12"
                            placeholder="Villas Name, Street, Room Number"
                          />
                        </div>
                        <Button type="submit" disabled={isUpdating} className="w-full rounded-xl font-black py-7 gap-2 shadow-xl shadow-primary/20">
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                          SAVE PROFILE CHANGES
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-zinc-900 text-white overflow-hidden">
                  <div className="p-1 px-4 pt-6 pb-2">
                    <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      TRUST & SECURITY
                    </CardTitle>
                    <CardDescription className="text-zinc-400">Manage your verified workstation rental identity.</CardDescription>
                  </div>
                  <CardContent className="space-y-6 pt-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
                          <IdCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">Document Status</p>
                          <p className="text-sm font-medium">{user?.identityFile ? 'Verified Identification' : 'Action Required'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        To maintain our premium service levels and island-wide delivery, we require a valid passport or identity card copy on file for all workstations rentals.
                      </p>
                      {!user?.identityFile && (
                        <div className="pt-2">
                          <label className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-2xl hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group">
                            <Upload className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest group-hover:text-primary">Upload Passport/ID</span>
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'identityFile')} />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Rental Protection</span>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-none font-black text-[9px]">ACTIVE</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">24/7 Support Tier</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[9px]">PREMIUM</Badge>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <p className="text-xs font-black uppercase tracking-widest mb-4">Account Security</p>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-zinc-400">Current Password</Label>
                          <Input
                            type="password"
                            required
                            value={passwordForm.current}
                            onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-zinc-400">New Password (Min 8 Chars)</Label>
                          <Input
                            type="password"
                            required
                            minLength={8}
                            value={passwordForm.new}
                            onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white focus-visible:ring-primary"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isChangingPassword || !passwordForm.current || passwordForm.new.length < 8}
                          className="w-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                        >
                          {isChangingPassword ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                          UPDATE PASSWORD
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <AiDashboardPanel
                title="Ask-Me"
                agentName="Ask-Me"
                welcomeMessage="Hi! I am Ask-Me, your Tropic Tech neural assistant. How can I help you today?"
                apiRoute="/api/ai/seller"
                icon={<Bot className="w-5 h-5 text-primary" />}
              />
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'chat' && (
            <div className="animate-in fade-in duration-500 max-w-lg mx-auto mt-12 w-full">
              <Card className="border-none bg-primary text-primary-foreground shadow-2xl shadow-primary/20 rounded-3xl overflow-hidden h-fit">
                <CardContent className="p-8 flex flex-col items-center justify-between gap-6 text-center">
                  <div className="flex flex-col items-center gap-5">
                    <div className="h-20 w-20 bg-white/20 rounded-3xl flex items-center justify-center shrink-0">
                      <Headset className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-widest">Need Human Assistance?</h3>
                      <p className="opacity-90 font-medium text-sm">Our support team and workers are ready to help with your rental Gear in real-time.</p>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-white text-primary hover:bg-zinc-100 font-black rounded-xl px-10 py-7 shadow-xl mt-4"
                    onClick={() => {
                      if (supportGroup) setDefaultSupportGroup(supportGroup.id)
                      setShowSupportHub(true)
                    }}
                  >
                    OPEN CHAT HUB
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </SidebarInset>

      {/* Support Chat Hub */}
      <SupportChatHub
        open={showSupportHub}
        onOpenChange={setShowSupportHub}
        defaultSupportGroupId={defaultSupportGroup}
      />

      {/* Floating Chat Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300"
        onClick={() => {
          if (supportGroup) setDefaultSupportGroup(supportGroup.id)
          setShowSupportHub(true)
        }}
      >
        <Headset className="h-6 w-6 text-primary-foreground" />
      </Button>
    </SidebarProvider>
  )
}
