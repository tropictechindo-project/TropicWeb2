'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Home,
  LogOut,
  Bell,
  Package,
  TrendingUp,
  ClipboardCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DirectMessagesList } from '@/components/chat/DirectMessagesList'
import { MessageSquare, Users, MessageCircle } from 'lucide-react'
import { RealtimePoller } from '@/lib/realtime'
import { GroupChatDialog } from '@/components/chat/GroupChatDialog'
import { AiDashboardPanel } from '@/components/ai/AiDashboardPanel'
import { BotMessageSquare } from 'lucide-react'

export default function WorkerDashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  // State for deliveries
  const [myDeliveries, setMyDeliveries] = useState<any[]>([])
  const [poolDeliveries, setPoolDeliveries] = useState<any[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // State for attendance
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])

  // State for notifications
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // State for dialogs
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false)
  const [showDMList, setShowDMList] = useState(false)

  // State for Group Chats
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string } | null>(null)
  const [workerGroups, setWorkerGroups] = useState<any[]>([])

  // State for claiming delivery
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [selectedPoolDelivery, setSelectedPoolDelivery] = useState<any>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  // State for completing delivery
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedDeliveryToComplete, setSelectedDeliveryToComplete] = useState<any>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [photoProof, setPhotoProof] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for editing recent logs (12h window)
  const [editLogOpen, setEditLogOpen] = useState(false)
  const [selectedLogToEdit, setSelectedLogToEdit] = useState<any>(null)
  const [editLogNotes, setEditLogNotes] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      fetchData()
      fetchWorkerGroups()

      // Set up real-time polling every 15 seconds
      const poller = new RealtimePoller({
        interval: 15000,
        onUpdate: (data) => {
          if (data.notifications) {
            setNotifications(data.notifications.notifications)
            setUnreadCount(data.notifications.unreadCount)
          }
          // Silent refetch for deliveries
          fetchData(true)
        }
      })

      const token = localStorage.getItem('token')
      if (token) {
        poller.pollWorkerData(token)
      }

      return () => poller.stop()
    }
  }, [user])

  const fetchWorkerGroups = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setWorkerGroups(data.groups || [])
      }
    } catch (e) {
      console.error('Failed to fetch worker groups')
    }
  }

  const openGroupChat = (group: any) => {
    setSelectedGroup({ id: group.id, name: group.name })
    setIsGroupChatOpen(true)
  }

  const pendingJobs = myDeliveries.length + poolDeliveries.length
  const ongoingJobs = myDeliveries.filter(s => s.status === 'OUT_FOR_DELIVERY' || s.status === 'CLAIMED').length
  const completedJobs = myDeliveries.filter(s => s.status === 'COMPLETED').length
  const attendanceRate = attendanceHistory.length > 0
    ? Math.round((attendanceHistory.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length / attendanceHistory.length) * 100)
    : 0

  const fetchData = async (silent = false) => {
    // Call fetchWorkerGroups here as well to ensure it's loaded
    if (!silent) fetchWorkerGroups()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Fetch all data in parallel
      const [myDelivRes, poolDelivRes, vehiclesRes, attendanceRes, notificationsRes] = await Promise.all([
        fetch('/api/worker/deliveries?view=my_claims', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/worker/deliveries?view=pool', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/worker/vehicles', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/worker/attendance', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/worker/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (myDelivRes.ok) {
        const data = await myDelivRes.json()
        setMyDeliveries(data.deliveries)
      }
      if (poolDelivRes.ok) {
        const data = await poolDelivRes.json()
        setPoolDeliveries(data.deliveries)
      }
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json()
        setAvailableVehicles(data.vehicles)
      }

      if (attendanceRes.ok) {
        const data = await attendanceRes.json()
        setAttendanceHistory(data.attendance || [])

        // Check if checked in today
        const today = new Date().toISOString().split('T')[0]
        const todayRecord = data.attendance?.find((a: any) =>
          a.date.split('T')[0] === today
        )
        setTodayAttendance(todayRecord)
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch worker data:', error)
      if (!silent) toast.error('Failed to load dashboard data')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleCheckInOut = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/worker/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: '' })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.action === 'checkin') {
          toast.success('Checked in successfully!')
        } else {
          toast.success('Checked out successfully!')
        }
        setTodayAttendance(data.attendance)
        fetchData()
      } else {
        toast.error('Failed to record attendance')
      }
    } catch (error) {
      toast.error('Failed to record attendance')
    }
  }

  const handleClaim = async () => {
    if (!selectedPoolDelivery || !selectedVehicleId) return toast.error("Select a vehicle")
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/worker/deliveries/${selectedPoolDelivery.id}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vehicleId: selectedVehicleId })
      })

      if (res.ok) {
        toast.success(`Claimed Successfully`)
        setClaimDialogOpen(false)
        setSelectedPoolDelivery(null)
        fetchData(true)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to claim delivery')
      }
    } catch (error) {
      toast.error('Failed to claim delivery')
    }
  }

  const updateDeliveryStatus = async (id: string, status: string, notes?: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/worker/deliveries/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      })

      if (res.ok) {
        toast.success(`Delivery updated to ${status}`)
        fetchData(true)
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleCompleteDelivery = async () => {
    if (!selectedDeliveryToComplete) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/worker/deliveries/${selectedDeliveryToComplete.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: completionNotes || "Completed successfully",
          photoProof: photoProof || null
        })
      })

      if (res.ok) {
        toast.success(`Delivery completed & recorded cleanly!`)
        setCompleteDialogOpen(false)
        setSelectedDeliveryToComplete(null)
        setCompletionNotes('')
        setPhotoProof('')
        fetchData(true)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to complete')
      }
    } catch (error) {
      toast.error('Failed to complete')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditLog = async () => {
    if (!selectedLogToEdit) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      // This assumes an endpoint exists or we use the delivery update endpoint with a specific action
      const res = await fetch(`/api/worker/deliveries/${selectedLogToEdit.deliveryId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'EDIT_LOG',
          logId: selectedLogToEdit.id,
          notes: editLogNotes
        })
      })

      if (res.ok) {
        toast.success(`Log updated successfully`)
        setEditLogOpen(false)
        fetchData(true)
      } else {
        toast.error('Failed to edit log. Window might be closed.')
      }
    } catch (error) {
      toast.error('Failed to edit log')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const teamGroup = workerGroups.find(g => g.name === 'Tropic Tech Daily' || g.type === 'WORKER_GROUP')
  const supportGroups = workerGroups.filter(g => g.type === 'USER_SUPPORT')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4 mt-16">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">Worker Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.fullName}</p>
            </div>
            <div className="flex flex-row flex-wrap gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowNotificationsDialog(true)}
              >
                <Bell className="w-4 h-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-1">{unreadCount}</Badge>
                )}
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => router.push('/')}
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
              <Button variant="outline" onClick={logout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {/* ... (stats cards remain same) */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column: Attendance & Chats */}
            <div className="space-y-8">
              {/* Attendance Check-in */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    Daily Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAttendance ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today's Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={todayAttendance.status === 'PRESENT' ? 'default' : 'secondary'}>
                            {todayAttendance.status}
                          </Badge>
                          <span className="text-sm">
                            {new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {!todayAttendance.checkOutTime && (
                        <Button onClick={handleCheckInOut} size="sm">
                          Check Out
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-muted-foreground text-sm">Not checked in</p>
                      <Button onClick={handleCheckInOut} size="sm">
                        Check In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Chat Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Users className="w-5 h-5" />
                    Team Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamGroup ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Tropic Tech Daily</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {teamGroup.messages && teamGroup.messages[0]
                            ? teamGroup.messages[0].content
                            : 'No messages yet'}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => openGroupChat(teamGroup)}>Open Chat</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Team group not found.</p>
                  )}
                </CardContent>
              </Card>

              {/* Support Tickets / User Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Support Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {supportGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active support tickets.</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {supportGroups.map(group => (
                        <div key={group.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg border">
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{group.name.replace('Support - ', '')}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {group.messages && group.messages[0]
                                ? group.messages[0].content
                                : 'No messages'}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => openGroupChat(group)}>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Master Panel */}
              <AiDashboardPanel
                title="AI Master Controls"
                agentName="AI Master"
                welcomeMessage="Sup Bro! I am the Master AI. Need me to check any invoices, deliveries, or stats for you?"
                apiRoute="/api/ai/master"
                icon={<BotMessageSquare className="w-5 h-5" />}
              />
            </div>

            {/* Right Column: Deliveries */}
            <div className="lg:col-span-2 space-y-8">

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50/50">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <MapPin className="w-5 h-5" />
                    Available Pool
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {poolDeliveries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No open deliveries in queue</p>
                  ) : (
                    <div className="space-y-4">
                      {poolDeliveries.map((delivery) => (
                        <Card key={delivery.id} className="border-l-4 border-l-blue-500 shadow-sm">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-lg">INV: {delivery.invoice?.invoiceNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Customer: {delivery.invoice?.order?.user?.fullName}
                                </p>
                                <p className="text-sm text-muted-foreground font-mono mt-1">
                                  Items: {delivery.items?.length || 0}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-blue-50">AVAILABLE</Badge>
                            </div>

                            <Dialog open={claimDialogOpen && selectedPoolDelivery?.id === delivery.id} onOpenChange={(open) => {
                              setClaimDialogOpen(open)
                              if (!open) setSelectedPoolDelivery(null)
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="w-full sm:w-auto" onClick={() => setSelectedPoolDelivery(delivery)}>
                                  Claim Delivery
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Claim Delivery #{delivery.invoice?.invoiceNumber}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Select Vehicle for this delivery</Label>
                                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a vehicle..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableVehicles.map(v => (
                                          <SelectItem key={v.id} value={v.id}>{v.name} ({v.type})</SelectItem>
                                        ))}
                                        {availableVehicles.length === 0 && (
                                          <SelectItem value="none" disabled>No available vehicles</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button className="w-full" onClick={handleClaim} disabled={!selectedVehicleId || selectedVehicleId === 'none'}>
                                    Confirm Claim & Lock Vehicle
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    My Active Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myDeliveries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">You haven't claimed any deliveries</p>
                  ) : (
                    <div className="space-y-4">
                      {myDeliveries.map((delivery) => (
                        <Card key={delivery.id} className={cn("border-l-4", delivery.status === 'COMPLETED' ? "border-l-green-500 opacity-70" : "border-l-primary shadow-md")}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-lg">INV: {delivery.invoice?.invoiceNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Customer: {delivery.invoice?.order?.user?.fullName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Claimed: {new Date(delivery.updatedAt).toLocaleTimeString()}
                                </p>
                              </div>
                              <Badge variant={
                                delivery.status === 'COMPLETED' ? 'default' :
                                  delivery.status === 'OUT_FOR_DELIVERY' ? 'secondary' :
                                    'outline'
                              }>
                                {delivery.status}
                              </Badge>
                            </div>

                            {delivery.vehicle && (
                              <div className="bg-muted p-2 rounded-md mb-4 text-xs font-mono">
                                Using: {delivery.vehicle.name}
                              </div>
                            )}

                            {delivery.status !== 'COMPLETED' && delivery.status !== 'CANCELED' && (
                              <div className="flex gap-2 flex-wrap">
                                {delivery.status === 'CLAIMED' && (
                                  <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, 'OUT_FOR_DELIVERY')}>
                                    Start Route
                                  </Button>
                                )}
                                {delivery.status === 'OUT_FOR_DELIVERY' && (
                                  <>
                                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200" onClick={() => {
                                      setSelectedDeliveryToComplete(delivery)
                                      setCompleteDialogOpen(true)
                                    }}>
                                      Complete Delivery
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => updateDeliveryStatus(delivery.id, 'DELAYED')}>
                                      Mark Delayed
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Recent Logs / Edit Window */}
                            {delivery.logs && delivery.logs.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-dashed">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent Timeline</p>
                                <div className="space-y-2">
                                  {delivery.logs.slice(0, 2).map((log: any) => {
                                    const canEdit = (new Date().getTime() - new Date(log.createdAt).getTime()) < 12 * 60 * 60 * 1000;
                                    return (
                                      <div key={log.id} className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                          {log.eventType}: {log.newValue?.notes || 'No notes'}
                                        </span>
                                        {canEdit && log.createdByUserId === user?.id && (
                                          <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px] text-blue-600" onClick={() => {
                                            setSelectedLogToEdit(log)
                                            setEditLogNotes(log.newValue?.notes || '')
                                            setEditLogOpen(true)
                                          }}>
                                            Edit
                                          </Button>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Notifications Dialog */}
      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No notifications</p>
            ) : (
              notifications.map((notif) => (
                <Card key={notif.id} className={cn(!notif.isRead && 'border-primary')}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notif.isRead && <Badge>New</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GroupChatDialog
        open={isGroupChatOpen}
        onOpenChange={setIsGroupChatOpen}
        groupId={selectedGroup?.id || ''}
        groupName={selectedGroup?.name || 'Group Chat'}
      />

      {/* Floating Chat Button - Direct Messages */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300"
        onClick={() => setShowDMList(true)}
      >
        <MessageSquare className="h-6 w-6 text-primary-foreground" />
      </Button>

      <DirectMessagesList
        open={showDMList}
        onOpenChange={setShowDMList}
      />

      {/* Complete Delivery Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes / Delivery Proof Message</Label>
              <Textarea
                placeholder="e.g. Left with security, Handed to customer..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Photo URL (Optional)</Label>
              <Input
                placeholder="Upload URL or Link"
                value={photoProof}
                onChange={(e) => setPhotoProof(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic">Tip: Take a photo for evidence.</p>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
              onClick={handleCompleteDelivery}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Finish Delivery"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Log Dialog */}
      <Dialog open={editLogOpen} onOpenChange={setEditLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Log Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editLogNotes}
                onChange={(e) => setEditLogNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEditLog}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Log"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
