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
import { staticRooms, staticHotels } from '@/data/admin-static';
import type { AdminRoom } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const PAGE_SIZE = 5;
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Hotel Management', href: '/admin/hotels' },
    { title: 'Rooms', href: '/admin/rooms' },
];

export default function AdminRoomsIndex() {
    const [rooms, setRooms] = useState<AdminRoom[]>(() => [...staticRooms]);
    const [hotels] = useState(() => [...staticHotels]);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminRoom | null>(null);
    const [editing, setEditing] = useState<AdminRoom | null>(null);
    const [form, setForm] = useState({
        hotelId: '',
        name: '',
        type: 'Standard',
        capacity: 2,
        pricePerNight: 0,
        status: 'available' as AdminRoom['status'],
    });

    const filtered = useMemo(() => {
        const q = appliedSearch.toLowerCase().trim();
        if (!q) return rooms;
        return rooms.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.hotelName.toLowerCase().includes(q) ||
                r.type.toLowerCase().includes(q)
        );
    }, [rooms, appliedSearch]);

    const totalCount = filtered.length;
    const paginated = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            hotelId: hotels[0]?.id ?? '',
            name: '',
            type: 'Standard',
            capacity: 2,
            pricePerNight: 0,
            status: 'available',
        });
        setModalOpen(true);
    };

    const openEdit = (room: AdminRoom) => {
        setEditing(room);
        setForm({
            hotelId: room.hotelId,
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            pricePerNight: room.pricePerNight,
            status: room.status,
        });
        setModalOpen(true);
    };

    const handleSave = () => {
        const hotel = hotels.find((h) => h.id === form.hotelId);
        if (editing) {
            setRooms((prev) =>
                prev.map((r) =>
                    r.id === editing.id
                        ? {
                              ...r,
                              ...form,
                              hotelName: hotel?.name ?? r.hotelName,
                              id: r.id,
                              createdAt: r.createdAt,
                          }
                        : r
                )
            );
        } else {
            setRooms((prev) => [
                ...prev,
                {
                    id: String(prev.length + 1),
                    hotelId: form.hotelId,
                    hotelName: hotel?.name ?? '',
                    name: form.name,
                    type: form.type,
                    capacity: form.capacity,
                    pricePerNight: form.pricePerNight,
                    status: form.status,
                    createdAt: new Date().toISOString().slice(0, 10),
                },
            ]);
        }
        setModalOpen(false);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Rooms
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage room types and availability
                    </p>
                </div>

                <DataTable<AdminRoom>
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
                    searchPlaceholder="Search by room name, hotel, type…"
                    keyExtractor={(r) => r.id}
                    actions={
                        <Button onClick={openCreate} size="sm" className="shrink-0">
                            <PlusIcon className="size-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Add Room</span>
                        </Button>
                    }
                    columns={[
                        { key: 'name', label: 'Room' },
                        { key: 'hotelName', label: 'Hotel' },
                        { key: 'type', label: 'Type' },
                        { key: 'capacity', label: 'Capacity' },
                        {
                            key: 'pricePerNight',
                            label: 'Price/night',
                            render: (r) => `$${r.pricePerNight}`,
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (r) => (
                                <Badge
                                    variant={
                                        r.status === 'available'
                                            ? 'default'
                                            : r.status === 'occupied'
                                              ? 'secondary'
                                              : 'outline'
                                    }
                                >
                                    {r.status}
                                </Badge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (r) => (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => openEdit(r)}
                                    >
                                        <PencilIcon className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteTarget(r)}
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
                                {editing ? 'Edit Room' : 'Add Room'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="hotelId">Hotel</Label>
                                <Select
                                    value={form.hotelId}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, hotelId: v }))
                                    }
                                >
                                    <SelectTrigger id="hotelId">
                                        <SelectValue placeholder="Select hotel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hotels.map((h) => (
                                            <SelectItem key={h.id} value={h.id}>
                                                {h.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Room name</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    placeholder="e.g. Deluxe King"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, type: v }))
                                    }
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Deluxe">Deluxe</SelectItem>
                                        <SelectItem value="Suite">Suite</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min={1}
                                        value={form.capacity}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                capacity: Number(e.target.value) || 1,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pricePerNight">Price/night ($)</Label>
                                    <Input
                                        id="pricePerNight"
                                        type="number"
                                        min={0}
                                        value={form.pricePerNight || ''}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                pricePerNight: Number(e.target.value) || 0,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(v: AdminRoom['status']) =>
                                        setForm((f) => ({ ...f, status: v }))
                                    }
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="occupied">Occupied</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
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
                    title="Delete room"
                    description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={confirmDelete}
                />
            </div>
        </AdminLayout>
    );
}
