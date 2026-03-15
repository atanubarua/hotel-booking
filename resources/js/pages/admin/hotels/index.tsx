import { Head, Link } from '@inertiajs/react';
import { Bed, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
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
import { staticHotels } from '@/data/admin-static';
import type { AdminHotel } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const PAGE_SIZE = 5;
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Hotel Management', href: '/admin/hotels' },
    { title: 'Hotels', href: '/admin/hotels' },
];

export default function AdminHotelsIndex() {
    const [hotels, setHotels] = useState<AdminHotel[]>(() => [...staticHotels]);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminHotel | null>(null);
    const [editing, setEditing] = useState<AdminHotel | null>(null);
    const [form, setForm] = useState({
        name: '',
        address: '',
        city: '',
        country: 'USA',
        starRating: 4,
        partnerName: '',
        roomCount: 0,
        status: 'active' as AdminHotel['status'],
    });

    const filtered = useMemo(() => {
        const q = appliedSearch.toLowerCase().trim();
        if (!q) return hotels;
        return hotels.filter(
            (h) =>
                h.name.toLowerCase().includes(q) ||
                h.city.toLowerCase().includes(q) ||
                h.partnerName.toLowerCase().includes(q)
        );
    }, [hotels, appliedSearch]);

    const totalCount = filtered.length;
    const paginated = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            name: '',
            address: '',
            city: '',
            country: 'USA',
            starRating: 4,
            partnerName: '',
            roomCount: 0,
            status: 'active',
        });
        setModalOpen(true);
    };

    const openEdit = (hotel: AdminHotel) => {
        setEditing(hotel);
        setForm({
            name: hotel.name,
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            starRating: hotel.starRating,
            partnerName: hotel.partnerName,
            roomCount: hotel.roomCount,
            status: hotel.status,
        });
        setModalOpen(true);
    };

    const handleSave = () => {
        if (editing) {
            setHotels((prev) =>
                prev.map((h) =>
                    h.id === editing.id
                        ? { ...h, ...form, id: h.id, createdAt: h.createdAt }
                        : h
                )
            );
        } else {
            setHotels((prev) => [
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

    const confirmDelete = () => {
        if (deleteTarget) {
            setHotels((prev) => prev.filter((h) => h.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Hotels - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Hotels
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage hotel properties and partners
                    </p>
                </div>

                <DataTable<AdminHotel>
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
                    searchPlaceholder="Search by name, city, partner…"
                    keyExtractor={(h) => h.id}
                    actions={
                        <Button onClick={openCreate} size="sm" className="shrink-0">
                            <PlusIcon className="size-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Add Hotel</span>
                        </Button>
                    }
                    columns={[
                        { key: 'name', label: 'Name' },
                        { key: 'city', label: 'City' },
                        { key: 'country', label: 'Country' },
                        {
                            key: 'starRating',
                            label: 'Stars',
                            render: (h) => `${h.starRating} ★`,
                        },
                        { key: 'partnerName', label: 'Partner' },
                        { key: 'roomCount', label: 'Rooms' },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (h) => (
                                <Badge
                                    variant={
                                        h.status === 'active'
                                            ? 'default'
                                            : h.status === 'pending'
                                              ? 'secondary'
                                              : 'outline'
                                    }
                                >
                                    {h.status}
                                </Badge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (h) => (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => openEdit(h)}
                                    >
                                        <PencilIcon className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        title="View rooms"
                                        asChild
                                    >
                                        <Link href={`/admin/rooms?hotel=${h.id}`}>
                                            <Bed className="size-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteTarget(h)}
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
                                {editing ? 'Edit Hotel' : 'Add Hotel'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    placeholder="Hotel name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, address: e.target.value }))
                                    }
                                    placeholder="Street address"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={form.city}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, city: e.target.value }))
                                        }
                                        placeholder="City"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={form.country}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, country: e.target.value }))
                                        }
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="starRating">Star rating</Label>
                                <Select
                                    value={String(form.starRating)}
                                    onValueChange={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            starRating: Number(v),
                                        }))
                                    }
                                >
                                    <SelectTrigger id="starRating">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <SelectItem key={n} value={String(n)}>
                                                {n} ★
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="partnerName">Partner name</Label>
                                <Input
                                    id="partnerName"
                                    value={form.partnerName}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            partnerName: e.target.value,
                                        }))
                                    }
                                    placeholder="Owner / partner name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="roomCount">Room count</Label>
                                <Input
                                    id="roomCount"
                                    type="number"
                                    min={0}
                                    value={form.roomCount || ''}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            roomCount: Number(e.target.value) || 0,
                                        }))
                                    }
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(v: AdminHotel['status']) =>
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
                    title="Delete hotel"
                    description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={confirmDelete}
                />
            </div>
        </AdminLayout>
    );
}
