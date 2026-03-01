'use client'

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    UserCircle,
    Package,
    Plus,
    Trash2,
    Shield,
    Lock,
    ShieldCheck,
    Loader2,
    ToggleLeft,
    ToggleRight,
    MessageSquare,
    MoreHorizontal,
    FileText,
    Camera,
    Eye,
    EyeOff,
    IdCard,
    Search,
    Edit
} from "lucide-react"
import { ChatDialog } from "@/components/chat/ChatDialog"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface UsersClientProps {
    users: any[]
}

export function UsersClient({ users }: UsersClientProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isRentalsOpen, setIsRentalsOpen] = useState(false)
    const [isMessageOpen, setIsMessageOpen] = useState(false)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [isEditUserOpen, setIsEditUserOpen] = useState(false)
    const [isDocsOpen, setIsDocsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<string>>(new Set())

    const togglePasswordVisibility = (userId: string) => {
        const newSet = new Set(visiblePasswordIds)
        if (newSet.has(userId)) {
            newSet.delete(userId)
        } else {
            newSet.add(userId)
        }
        setVisiblePasswordIds(newSet)
    }

    useEffect(() => {
        setMounted(true)
    }, [])
    const [newUserData, setNewUserData] = useState({
        username: "",
        email: "",
        password: "",
        fullName: "",
        whatsapp: "",
        role: "USER"
    })

    const [editUserData, setEditUserData] = useState({
        id: "",
        username: "",
        email: "",
        fullName: "",
        whatsapp: "",
        role: "USER",
        password: "" // Optional for updating
    })

    const filteredUsers = users.filter(user =>
        (user.fullName?.toLowerCase() || user.username.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.whatsapp.includes(searchTerm)
    )

    const getUserStatus = (user: any) => {
        const hasActiveOrder = user.orders.some((o: any) => o.status === 'ACTIVE')
        return hasActiveOrder ? 'Active Rent' : 'Not Renting'
    }

    const handleViewRentals = (user: any) => {
        setSelectedUser(user)
        setIsRentalsOpen(true)
    }

    const handleSendMessage = (user: any) => {
        setSelectedUser(user)
        setIsMessageOpen(true)
    }

    const handleViewDocs = (user: any) => {
        setSelectedUser(user)
        setIsDocsOpen(true)
    }

    const handleEditUser = (user: any) => {
        setSelectedUser(user)
        setEditUserData({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName || "",
            whatsapp: user.whatsapp || "",
            role: user.role,
            password: ""
        })
        setIsEditUserOpen(true)
    }

    if (!mounted) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
        )
    }

    const handleToggleStatus = async (user: any) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !user.isActive })
            })
            if (!res.ok) throw new Error("Failed")
            toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`)
            router.refresh()
        } catch {
            toast.error("Failed to update status")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure? Users with active rentals cannot be deleted.")) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed")
            }
            toast.success("User deleted")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const onAddUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserData)
            })
            if (!res.ok) throw new Error("Failed to create user")
            toast.success("User created successfully")
            setIsAddUserOpen(false)
            setNewUserData({ username: "", email: "", password: "", fullName: "", whatsapp: "", role: "USER" })
            router.refresh()
        } catch {
            toast.error("Failed to create user")
        } finally {
            setIsLoading(false)
        }
    }

    const onEditUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin/users/${editUserData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editUserData)
            })
            if (!res.ok) throw new Error("Failed to update user")
            toast.success("User updated successfully")
            setIsEditUserOpen(false)
            router.refresh()
        } catch {
            toast.error("Failed to update user")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 py-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsAddUserOpen(true)} className="font-black gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> ADD SYSTEM USER
                </Button>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[250px]">User</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Auth Password</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-muted">
                                                {user.profileImage && <AvatarImage src={user.profileImage} className="object-cover" />}
                                                <AvatarFallback className="font-black bg-primary/10 text-primary">{(user.fullName || user.username).charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm tracking-tight">{user.fullName || user.username}</span>
                                                    {user.role === 'ADMIN' && <Shield className="h-3 w-3 text-primary fill-primary/10" />}
                                                    {!user.isActive && <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase font-black">Disabled</Badge>}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-mono">ID: {user.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs space-y-1">
                                            <span className="flex items-center gap-1.5"><UserCircle className="h-3 w-3 opacity-50" /> {user.email}</span>
                                            <span className="flex items-center gap-1.5 font-medium text-emerald-600"><MessageSquare className="h-3 w-3" /> {user.whatsapp}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-muted p-1.5 rounded-lg border flex items-center gap-2 min-w-[140px]">
                                                {visiblePasswordIds.has(user.id) ? (
                                                    <span className="text-[10px] font-mono font-bold text-primary">
                                                        {user.plainPassword || '••••••••'}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] items-center flex gap-1 text-muted-foreground opacity-50">
                                                        <Lock className="h-2.5 w-2.5" /> HIDDEN
                                                    </span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 ml-auto hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => togglePasswordVisibility(user.id)}
                                                >
                                                    {visiblePasswordIds.has(user.id) ? (
                                                        <EyeOff className="h-3 w-3" />
                                                    ) : (
                                                        <Eye className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={user.isActive}
                                                onCheckedChange={() => handleToggleStatus(user)}
                                                disabled={isLoading}
                                            />
                                            <Badge
                                                variant={getUserStatus(user) === 'Active Rent' ? 'default' : 'outline'}
                                                className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 h-5",
                                                    getUserStatus(user) === 'Active Rent' ? "bg-green-600 hover:bg-green-700" : ""
                                                )}
                                            >
                                                {getUserStatus(user)}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={cn(
                                                    "h-8 gap-2 border-zinc-200 font-bold text-[10px]",
                                                    user.identityFile ? "border-primary text-primary bg-primary/5" : ""
                                                )}
                                                onClick={() => handleViewDocs(user)}
                                            >
                                                <IdCard className="h-3.5 w-3.5" />
                                                FILES
                                                {user.identityFile && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-2 border-zinc-200 font-bold text-[10px]"
                                                onClick={() => handleViewRentals(user)}
                                            >
                                                <Package className="h-3.5 w-3.5" />
                                                RENTALS
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="font-bold gap-2"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <Edit className="h-4 w-4" /> Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive font-bold gap-2"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Rentals Dialog */}
            <Dialog open={isRentalsOpen} onOpenChange={setIsRentalsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Rented Items: {selectedUser?.fullName || selectedUser?.username}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedUser?.orders.length === 0 ? (
                            <p className="text-center text-muted-foreground py-10">This user hasn't rented anything yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedUser?.orders.map((order: any) => (
                                    <div key={order.id} className="p-4 border rounded-xl space-y-3 bg-muted/20">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-primary">Order {order.orderNumber}</span>
                                            <Badge variant="outline">{order.status}</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {order.rentalItems?.map((item: any) => (
                                                <div key={item.id} className="flex justify-between text-sm items-center">
                                                    <span className="font-medium text-foreground">
                                                        {item.product?.name || item.rentalPackage?.name}
                                                        <span className="text-muted-foreground ml-2">x {item.quantity}</span>
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Until {new Date(order.endDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Message Dialog - Using shared ChatDialog */}
            {selectedUser && (
                <ChatDialog
                    open={isMessageOpen}
                    onOpenChange={setIsMessageOpen}
                    otherUserId={selectedUser.id}
                    otherUserName={selectedUser.fullName || selectedUser.username}
                    otherUserImage={selectedUser.profileImage}
                />
            )}

            {/* Add User Dialog */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" /> Create New System User
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={onAddUserSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={newUserData.username}
                                    onChange={e => setNewUserData({ ...newUserData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newUserData.password}
                                    onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUserData.email}
                                onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={newUserData.fullName}
                                onChange={e => setNewUserData({ ...newUserData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp</Label>
                                <Input
                                    id="whatsapp"
                                    value={newUserData.whatsapp}
                                    onChange={e => setNewUserData({ ...newUserData, whatsapp: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">System Role</Label>
                                <Select
                                    value={newUserData.role}
                                    onValueChange={v => setNewUserData({ ...newUserData, role: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">Standard User</SelectItem>
                                        <SelectItem value="WORKER">Worker / Staff</SelectItem>
                                        <SelectItem value="ADMIN">System Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" className="w-full font-black mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "CREATE USER ACCOUNT"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-primary" /> Update System User
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={onEditUserSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-username">Username</Label>
                                <Input
                                    id="edit-username"
                                    value={editUserData.username}
                                    onChange={e => setEditUserData({ ...editUserData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-password">New Password (Optional)</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    placeholder="Leave blank to keep same"
                                    value={editUserData.password}
                                    onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                                />
                                {selectedUser?.plainPassword && (
                                    <p className="text-[10px] text-primary font-mono bg-primary/5 p-1 rounded border border-primary/20">
                                        Current: <span className="font-bold">{selectedUser.plainPassword}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email Address</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editUserData.email}
                                onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-fullName">Full Name</Label>
                            <Input
                                id="edit-fullName"
                                value={editUserData.fullName}
                                onChange={e => setEditUserData({ ...editUserData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                                <Input
                                    id="edit-whatsapp"
                                    value={editUserData.whatsapp}
                                    onChange={e => setEditUserData({ ...editUserData, whatsapp: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">System Role</Label>
                                <Select
                                    value={editUserData.role}
                                    onValueChange={v => setEditUserData({ ...editUserData, role: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">Standard User</SelectItem>
                                        <SelectItem value="WORKER">Worker / Staff</SelectItem>
                                        <SelectItem value="ADMIN">System Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" className="w-full font-black mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "UPDATE USER ACCOUNT"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Documents Dialog */}
            <Dialog open={isDocsOpen} onOpenChange={setIsDocsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-widest">
                            <FileText className="h-5 w-5 text-primary" />
                            USER DOCUMENT VERIFICATION
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6 py-6 border-t mt-4">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Photo</h4>
                            <div className="aspect-square rounded-3xl bg-muted overflow-hidden border-4 border-muted shadow-inner flex items-center justify-center">
                                {selectedUser?.profileImage ? (
                                    <img src={selectedUser.profileImage} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <UserCircle className="h-20 w-20 text-muted-foreground opacity-10" />
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity File (Passport/ID)</h4>
                            <div className="aspect-[3/4] rounded-3xl bg-zinc-900 overflow-hidden border-4 border-zinc-800 shadow-xl flex flex-col items-center justify-center relative group">
                                {selectedUser?.identityFile ? (
                                    <>
                                        <img src={selectedUser.identityFile} alt="Identity" className="h-full w-full object-contain" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="outline"
                                                className="bg-white text-black font-bold h-12 px-6 rounded-2xl gap-2"
                                                onClick={() => window.open(selectedUser.identityFile, '_blank')}
                                            >
                                                <Eye className="h-4 w-4" /> FULL VIEW
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center opacity-20">
                                        <IdCard className="h-20 w-20 text-white mb-2" />
                                        <p className="text-[10px] font-black text-white uppercase tracking-tighter">NO DOCUMENT UPLOADED</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-3">
                        <Button variant="outline" className="font-bold px-8 rounded-xl" onClick={() => setIsDocsOpen(false)}>CLOSE VIEW</Button>
                        <Button className="font-black px-8 rounded-xl shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700">VERIFY IDENTITY</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
