import { Head } from '@inertiajs/react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import { staticUsers } from '@/data/admin-static';
import type { AdminUser, UserRole } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const PAGE_SIZE = 5;
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'User Management', href: '/admin/users' },
];

const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'partner', label: 'Partner' },
    { value: 'customer', label: 'Customer' },
];

export default function AdminUsersIndex() {
    const [users, setUsers] = useState<AdminUser[]>(() => [...staticUsers]);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        role: 'customer' as UserRole,
        phone: '',
        status: 'active' as 'active' | 'inactive' | 'pending',
    });

    const filtered = useMemo(() => {
        const q = appliedSearch.toLowerCase().trim();
        if (!q) return users;
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q)
        );
    }, [users, appliedSearch]);

    const totalCount = filtered.length;
    const paginated = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            name: '',
            email: '',
            role: 'customer',
            phone: '',
            status: 'active',
        });
        setModalOpen(true);
    };

    const openEdit = (user: AdminUser) => {
        setEditing(user);
        setForm({
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            status: user.status,
        });
        setModalOpen(true);
    };

    const handleSave = () => {
        if (editing) {
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === editing.id
                        ? {
                              ...u,
                              ...form,
                              id: u.id,
                              createdAt: u.createdAt,
                          }
                        : u
                )
            );
        } else {
            setUsers((prev) => [
                ...prev,
                {
                    id: String(prev.length + 1),
                    ...form,
                    createdAt: new Date().toISOString().slice(0, 10),
                },
            ]);
        }
        setModalOpen(false);
    };

    const handleDelete = (user: AdminUser) => setDeleteTarget(user);
    const confirmDelete = () => {
        if (deleteTarget) {
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        User Management
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage admins, partners, and customers
                    </p>
                </div>

                <DataTable<AdminUser>
                    data={paginated}
                    totalCount={totalCount}
                    page={page}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    onSearchApply={() => {
                        setAppliedSearch(searchInput);
                        setPage(1);
                    }}
                    searchPlaceholder="Search by name, email, role…"
                    keyExtractor={(u) => u.id}
                    actions={
                        <Button onClick={openCreate} size="sm" className="shrink-0">
                            <PlusIcon className="size-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Add User</span>
                        </Button>
                    }
                    columns={[
                        { key: 'name', label: 'Name' },
                        { key: 'email', label: 'Email' },
                        {
                            key: 'role',
                            label: 'Role',
                            render: (u) => (
                                <Badge variant="secondary" className="capitalize">
                                    {u.role}
                                </Badge>
                            ),
                        },
                        { key: 'phone', label: 'Phone' },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (u) => (
                                <Badge
                                    variant={
                                        u.status === 'active'
                                            ? 'default'
                                            : u.status === 'pending'
                                              ? 'secondary'
                                              : 'outline'
                                    }
                                >
                                    {u.status}
                                </Badge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (u) => (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => openEdit(u)}
                                    >
                                        <PencilIcon className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(u)}
                                    >
                                        <Trash2Icon className="size-4" />
                                    </Button>
                                </div>
                            ),
                        },
                    ]}
                />

                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? 'Edit User' : 'Add User'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, email: e.target.value }))
                                    }
                                    placeholder="email@example.com"
                                    disabled={!!editing}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={form.role}
                                    onValueChange={(v: UserRole) =>
                                        setForm((f) => ({ ...f, role: v }))
                                    }
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, phone: e.target.value }))
                                    }
                                    placeholder="+1 555-0000"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(v: 'active' | 'inactive' | 'pending') =>
                                        setForm((f) => ({ ...f, status: v }))
                                    }
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                {editing ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Delete user"
                    description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={confirmDelete}
                />
            </div>
        </AdminLayout>
    );
}
