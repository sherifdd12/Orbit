"use client"

import * as React from "react"
import {
    Users,
    Shield,
    Settings,
    Building2,
    Bell,
    UserPlus,
    MoreHorizontal,
    Search,
    Check} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface User {
    id: string
    email: string
    full_name: string
    role: string
    role_id: string | null
    is_active: boolean
    avatar_url: string | null
}

interface Role {
    id: string
    name: string
    description: string
    is_system: boolean
}

interface Permission {
    id: string
    code: string
    name: string
    module: string
}

export default function AdminPage() {
    const { dict } = useLanguage()
    const [users, setUsers] = React.useState<User[]>([])
    const [roles, setRoles] = React.useState<Role[]>([])
    const [permissions, setPermissions] = React.useState<Permission[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
    const [isRoleDialogOpen, setIsRoleDialogOpen] = React.useState(false)
    const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")

    const [isNewRoleOpen, setIsNewRoleOpen] = React.useState(false)
    const [newRole, setNewRole] = React.useState({ name: '', description: '' })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [usersRes, rolesRes, permsRes] = await Promise.all([
            supabase.from('profiles').select('*').order('full_name'),
            supabase.from('roles').select('*').order('name'),
            supabase.from('permissions').select('*').order('module, name')
        ])

        if (!usersRes.error) setUsers(usersRes.data || [])
        if (!rolesRes.error) setRoles(rolesRes.data || [])
        if (!permsRes.error) setPermissions(permsRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRoleId) return
        const { error } = await supabase
            .from('profiles')
            .update({ role_id: selectedRoleId })
            .eq('id', selectedUser.id)

        if (error) alert(error.message)
        else {
            setIsRoleDialogOpen(false)
            setSelectedUser(null)
            fetchData()
        }
    }

    const handleToggleUserStatus = async (user: User) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: !user.is_active })
            .eq('id', user.id)

        if (error) alert(error.message)
        else fetchData()
    }

    const handleCreateRole = async () => {
        if (!newRole.name) return alert("Role name is required")
        const { error } = await supabase.from('roles').insert([newRole])
        if (error) alert(error.message)
        else {
            setIsNewRoleOpen(false)
            setNewRole({ name: '', description: '' })
            fetchData()
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const permissionsByModule = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = []
        acc[perm.module].push(perm)
        return acc
    }, {} as Record<string, Permission[]>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.admin.title}</h2>
                    <p className="text-muted-foreground text-sm">Manage users, roles, and system permissions.</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="users" className="flex gap-2">
                        <Users className="h-4 w-4" />
                        {dict.admin.users}
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="flex gap-2">
                        <Shield className="h-4 w-4" />
                        {dict.admin.roles}
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>{dict.admin.userManagement}</CardTitle>
                                    <CardDescription>View and manage user accounts and their roles.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={dict.common.search + "..."}
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{dict.common.name}</TableHead>
                                            <TableHead>{dict.common.email}</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>{dict.common.status}</TableHead>
                                            <TableHead className="w-[100px]">{dict.common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10">{dict.common.loading}</TableCell>
                                            </TableRow>
                                        ) : filteredUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium">{user.full_name || 'Unnamed User'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                                                        {user.role || 'Employee'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.is_active !== false ? 'default' : 'destructive'} className={user.is_active !== false ? 'bg-emerald-100 text-emerald-700' : ''}>
                                                        {user.is_active !== false ? dict.common.active : dict.common.inactive}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsRoleDialogOpen(true); }}>
                                                                {dict.admin.assignRole}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                                                {user.is_active !== false ? 'Deactivate' : 'Activate'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>{dict.admin.roleManagement}</CardTitle>
                                    <CardDescription>Define roles and assign permissions.</CardDescription>
                                </div>
                                <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
                                    <DialogTrigger asChild>
                                        <Button><UserPlus className="mr-2 h-4 w-4" />{dict.admin.newRole}</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>{dict.admin.newRole}</DialogTitle></DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Role Name</Label>
                                                <Input value={newRole.name} onChange={e => setNewRole({ ...newRole, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{dict.common.description}</Label>
                                                <Input value={newRole.description} onChange={e => setNewRole({ ...newRole, description: e.target.value })} />
                                            </div>
                                        </div>
                                        <DialogFooter><Button onClick={handleCreateRole}>{dict.common.save}</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {roles.map(role => (
                                    <Card key={role.id} className="relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">{role.name}</CardTitle>
                                                {role.is_system && <Badge variant="outline" className="text-xs">System</Badge>}
                                            </div>
                                            <CardDescription className="text-xs">{role.description || 'No description'}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button variant="outline" size="sm" className="w-full">
                                                {dict.admin.editPermissions}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions Overview */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{dict.admin.permissions}</CardTitle>
                            <CardDescription>Available system permissions grouped by module.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(permissionsByModule).map(([module, perms]) => (
                                    <Card key={module} className="bg-slate-50/50">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-semibold capitalize">{module}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-1">
                                            {perms.map(perm => (
                                                <div key={perm.id} className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                    {perm.name}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    {dict.admin.companyInfo}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input defaultValue="Orbit Foundation" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tax ID / VAT Number</Label>
                                    <Input placeholder="Enter tax ID" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{dict.common.address}</Label>
                                    <Input placeholder="Company address" />
                                </div>
                                <Button className="w-full">{dict.common.save}</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    {dict.admin.notifications}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                                    </div>
                                    <Button variant="outline" size="sm">Enable</Button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Low Stock Alerts</p>
                                        <p className="text-sm text-muted-foreground">Get notified when items fall below minimum</p>
                                    </div>
                                    <Button variant="outline" size="sm">Enable</Button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Payment Reminders</p>
                                        <p className="text-sm text-muted-foreground">Automatic reminders for overdue invoices</p>
                                    </div>
                                    <Button variant="outline" size="sm">Enable</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Assign Role Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dict.admin.assignRole}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Assigning role to: <strong>{selectedUser?.full_name || selectedUser?.email}</strong>
                        </p>
                        <div className="space-y-2">
                            <Label>Select Role</Label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={selectedRoleId}
                                onChange={e => setSelectedRoleId(e.target.value)}
                            >
                                <option value="">{dict.common.select}...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>{dict.common.cancel}</Button>
                        <Button onClick={handleAssignRole}>{dict.common.save}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
