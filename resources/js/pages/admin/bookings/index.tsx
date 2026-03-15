import { Head } from '@inertiajs/react';
import { PencilIcon, Trash2Icon } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import { staticBookings } from '@/data/admin-static';
import type { AdminBooking, BookingStatus } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const PAGE_SIZE = 5;
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Bookings', href: '/admin/bookings' },
];

const statusOptions: { value: BookingStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'checked_out', label: 'Checked Out' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminBookingsIndex() {
    const [bookings, setBookings] = useState<AdminBooking[]>(() => [
        ...staticBookings,
    ]);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminBooking | null>(null);
    const [editing, setEditing] = useState<AdminBooking | null>(null);
    const [status, setStatus] = useState<BookingStatus>('confirmed');

    const filtered = useMemo(() => {
        const q = appliedSearch.toLowerCase().trim();
        if (!q) return bookings;
        return bookings.filter(
            (b) =>
                b.guestName.toLowerCase().includes(q) ||
                b.guestEmail.toLowerCase().includes(q) ||
                b.hotelName.toLowerCase().includes(q) ||
                b.status.toLowerCase().includes(q)
        );
    }, [bookings, appliedSearch]);

    const totalCount = filtered.length;
    const paginated = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const openEdit = (booking: AdminBooking) => {
        setEditing(booking);
        setStatus(booking.status);
        setModalOpen(true);
    };

    const handleSave = () => {
        if (editing) {
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === editing.id ? { ...b, status } : b
                )
            );
        }
        setModalOpen(false);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    const statusVariant = (s: BookingStatus) => {
        switch (s) {
            case 'confirmed':
            case 'checked_in':
            case 'checked_out':
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Bookings - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Bookings
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        View and manage all reservations
                    </p>
                </div>

                <DataTable<AdminBooking>
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
                    searchPlaceholder="Search by guest, hotel, status…"
                    keyExtractor={(b) => b.id}
                    columns={[
                        { key: 'guestName', label: 'Guest' },
                        { key: 'guestEmail', label: 'Email' },
                        { key: 'hotelName', label: 'Hotel' },
                        { key: 'roomName', label: 'Room' },
                        {
                            key: 'checkIn',
                            label: 'Check-in',
                            render: (b) =>
                                new Date(b.checkIn).toLocaleDateString(),
                        },
                        {
                            key: 'checkOut',
                            label: 'Check-out',
                            render: (b) =>
                                new Date(b.checkOut).toLocaleDateString(),
                        },
                        {
                            key: 'totalAmount',
                            label: 'Amount',
                            render: (b) => `$${b.totalAmount}`,
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (b) => (
                                <Badge variant={statusVariant(b.status)}>
                                    {b.status.replace('_', ' ')}
                                </Badge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (b) => (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => openEdit(b)}
                                    >
                                        <PencilIcon className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteTarget(b)}
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
                            <DialogTitle>Update booking status</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {editing && (
                                <p className="text-muted-foreground text-sm">
                                    Booking #{editing.id} – {editing.guestName} at{' '}
                                    {editing.hotelName}
                                </p>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(v: BookingStatus) =>
                                        setStatus(v)
                                    }
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>Update</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Cancel booking"
                    description={`Are you sure you want to cancel booking #${deleteTarget?.id} for ${deleteTarget?.guestName}? This action cannot be undone.`}
                    confirmLabel="Cancel booking"
                    variant="destructive"
                    onConfirm={confirmDelete}
                />
            </div>
        </AdminLayout>
    );
}
