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
  Headset
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SupportChatHub } from '@/components/chat/SupportChatHub'
import { useNotification } from '@/contexts/NotificationContext'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { countries, normalizeWhatsApp } from '@/lib/utils/whatsapp'

export default function UserDashboard() {
  const { user } = useAuth()
  const { unreadMessagesCount } = useNotification()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Chat State
  const [showSupportHub, setShowSupportHub] = useState(false)
  const [defaultSupportGroup, setDefaultSupportGroup] = useState<string | undefined>(undefined)

  // Support Group Chat (for Hub default open)
  const [supportGroup, setSupportGroup] = useState<{ id: string, name: string } | null>(null)

  // Profile Edit State
  const [editForm, setEditForm] = useState({
    fullName: '',
    whatsappCode: '+62',
    whatsappNumber: '',
    baliAddress: '',
  })

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

  const fetchOrders = async () => {
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
      setIsLoading(false)
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

  const activeOrders = orders.filter(o => o.status === 'ACTIVE' || o.status === 'CONFIRMED' || o.status === 'PENDING')
  const pastOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')

  return (
    <div className="space-y-10">
      {/* CTA Buttons */}
      <div className="flex flex-row gap-2 justify-end mt-8">
        <Button
          variant="default"
          className="gap-2"
          onClick={() => {
            if (supportGroup) setDefaultSupportGroup(supportGroup.id)
            setShowSupportHub(true)
          }}
        >
          <Headset className="w-4 h-4" />
          Chat Hub
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-zinc-900 text-white overflow-hidden group">
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

        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Subscriptions</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">{activeOrders.length}</span>
                <span className="text-xs text-muted-foreground font-bold mb-1">RUNNING</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-muted/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Island Coverage</p>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-sm font-bold uppercase">Bali Island Delivery</span>
              </div>
              <p className="text-xs text-muted-foreground">Certified 24/7 Support Included</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer border-primary/20 bg-primary/5"
          onClick={() => {
            if (supportGroup) setDefaultSupportGroup(supportGroup.id)
            setShowSupportHub(true)
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Chat</CardTitle>
            <div className="relative">
              <MessageSquare className="h-4 w-4 text-primary" />
              {unreadMessagesCount > 0 && (
                <Badge variant="destructive" className="absolute -top-3 -right-3 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] rounded-full">
                  {unreadMessagesCount}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Team</div>
            <p className="text-xs text-muted-foreground">Chat with Workers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rentals" className="space-y-8">
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger
              value="rentals"
              className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs tracking-widest uppercase transition-all"
            >
              ACTIVE RENTALS ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs tracking-widest uppercase transition-all"
            >
              PAST ORDERS
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs tracking-widest uppercase transition-all"
            >
              ACCOUNT SECURITY
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Active Rentals Tab */}
        <TabsContent value="rentals" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeOrders.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10">
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
                            {order.rentalItems.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 transition-colors">
                                <div className="p-2 bg-background rounded-lg shrink-0">
                                  <Package className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-bold text-sm tracking-tight truncate">{item.name} <span className="text-primary ml-1 shrink-0">x{item.quantity}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="md:w-64 flex flex-col justify-between items-start md:items-end gap-6">
                        <div className="w-full md:text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Bill</p>
                          <p className="text-2xl font-black tracking-tighter">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                          <p className="text-[10px] font-bold text-green-600 tracking-wider uppercase">VIA {order.paymentMethod}</p>
                        </div>
                        <div className="flex flex-col w-full gap-2">
                          <Button size="sm" className="w-full font-black rounded-lg gap-2" onClick={() => handleExtendRental(order.id)}>
                            EXTEND RENTAL
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full font-bold text-xs"
                            onClick={() => {
                              const shareableToken = order.invoices?.[0]?.shareableToken;
                              if (shareableToken) {
                                window.open(`/invoice/public/${shareableToken}`, '_blank');
                              } else {
                                toast.error('Invoice not yet generated for this order');
                              }
                            }}
                          >
                            DOWNLOAD INVOICE
                          </Button>
                          {order.workerSchedules?.[0]?.worker && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full font-black rounded-lg gap-2 text-[10px]"
                              onClick={() => {
                                // const worker = order.workerSchedules[0].worker
                                // Open Chat Hub? Or Direct Chat? 
                                // Ideally we open the hub and pre-select the user.
                                // For now, just open the hub.
                                setShowSupportHub(true)
                                // In a future iteration, we can pass a specific userId to open directly
                              }}
                            >
                              <MessageSquare className="h-3 w-3" />
                              MESSAGE WORKER
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="animate-in fade-in duration-500">
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
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="animate-in fade-in duration-500">
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Support CTA */}
      <Card className="border-none bg-primary text-primary-foreground shadow-2xl shadow-primary/20 rounded-3xl overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Headset className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest">Need Assistance?</h3>
              <p className="opacity-90 font-medium text-sm">Our support team and workers are ready to help with your rental Gear.</p>
            </div>
          </div>
          <Button
            className="bg-white text-primary hover:bg-zinc-100 font-black rounded-xl px-10 py-7 shadow-xl"
            onClick={() => {
              if (supportGroup) setDefaultSupportGroup(supportGroup.id)
              setShowSupportHub(true)
            }}
          >
            OPEN CHAT HUB
          </Button>
        </CardContent>
      </Card>

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
    </div >
  )
}
