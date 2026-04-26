import { Head, router } from '@inertiajs/react';
import { PencilIcon, Trash2Icon, CalendarIcon, UserIcon, BuildingIcon } from 'lucide-react';
import { useState } from 'react';
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
import PartnerLayout from '@/layouts/partner-layout';
import type { AdminBooking, BookingStatus } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Bookings', href: '/partner/bookings' },
];

// Only statuses staff can manually set — system statuses (pending, confirmed, expired) are excluded
const statusOptions: { value: BookingStatus; label: string; color: string }[] = [
    { value: 'checked_in',  label: 'Checked In',  color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
    { value: 'checked_out', label: 'Checked Out', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
    { value: 'completed',   label: 'Completed',   color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    { value: 'cancelled',   label: 'Cancelled',   color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
    { value: 'no_show',     label: 'No Show',     color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
];

interface Props {
    bookings: AdminBooking[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search: string | null;
    };
}

export default function PartnerBookingsIndex({ bookings, pagination, filters }: Props) {
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminBooking | null>(null);
    const [editing, setEditing] = useState<AdminBooking | null>(null);
    const [status, setStatus] = useState<BookingStatus>('confirmed');

    const handlePageChange = (newPage: number) => {
        router.get(
            '/partner/bookings',
            { page: newPage, search: filters.search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearchApply = () => {
        router.get(
            '/partner/bookings',
            { search: searchInput, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const openEdit = (booking: AdminBooking) => {
        setEditing(booking);
        setStatus(booking.status);
        setModalOpen(true);
    };

    const handleSave = () => {
        if (editing) {
            router.put(`/partner/bookings/${editing.id}`, { status }, {
                preserveScroll: true,
                onSuccess: () => setModalOpen(false)
            });
        }
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            router.delete(`/partner/bookings/${deleteTarget.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteTarget(null)
            });
        }
    };

    const statusVariant = (s: BookingStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (s) {
            case 'confirmed':  return 'secondary';
            case 'checked_in':
            case 'checked_out':
            case 'completed':  return 'default';
            case 'pending':    return 'outline';
            case 'cancelled':
            case 'no_show':
            case 'expired':    return 'destructive';
            default:           return 'outline';
        }
    };

    const statusLabel = (s: BookingStatus): string => {
        const map: Record<BookingStatus, string> = {
            pending:     'Pending',
            confirmed:   'Confirmed',
            checked_in:  'Checked In',
            checked_out: 'Checked Out',
            completed:   'Completed',
            cancelled:   'Cancelled',
            no_show:     'No Show',
            expired:     'Expired',
        };
        return map[s] ?? s;
    };

    const statusBadgeClass = (s: BookingStatus): string => {
        const map: Record<BookingStatus, string> = {
            pending:     'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
            confirmed:   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            checked_in:  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
            checked_out: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
            completed:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            cancelled:   'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            no_show:     'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
            expired:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        };
        return map[s] ?? 'bg-gray-100 text-gray-600';
    };

    const selectedStatusOption = statusOptions.find((o) => o.value === status);

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Bookings - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Bookings
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        View and manage all reservations for your hotels
                    </p>
                </div>

                <DataTable<AdminBooking>
                    data={bookings}
                    totalCount={pagination.total}
                    page={pagination.current_page}
                    pageSize={pagination.per_page}
                    onPageChange={handlePageChange}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    onSearchApply={handleSearchApply}
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
                            render: (b) => `${b.totalAmount} Tk`,
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (b) => (
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(b.status)}`}>
                                    {statusLabel(b.status)}
                                </span>
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
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">Update Booking Status</DialogTitle>
                        </DialogHeader>

                        {editing && (
                            <div className="bg-muted/50 rounded-lg border p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <UserIcon className="size-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{editing.guestName}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">{editing.guestEmail}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <BuildingIcon className="size-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{editing.hotelName}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">{editing.roomName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">
                                        {new Date(editing.checkIn).toLocaleDateString()} → {new Date(editing.checkOut).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs text-muted-foreground">Current status:</span>
                                    <Badge variant={statusVariant(editing.status)}>
                                        {editing.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="status" className="font-medium">New Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v: BookingStatus) => setStatus(v)}
                            >
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    {statusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedStatusOption && (
                                <p className="text-xs text-muted-foreground">
                                    Will change to: <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${selectedStatusOption.color}`}>{selectedStatusOption.label}</span>
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Cancel booking"
                    description={`Are you sure you want to cancel booking #${deleteTarget?.id} for ${deleteTarget?.guestName}?`}
                    confirmLabel="Cancel booking"
                    variant="destructive"
                    onConfirm={confirmDelete}
                />
            </div>
        </PartnerLayout>
    );
}
