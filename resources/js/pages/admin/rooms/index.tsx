import { Head, Link, router, usePage } from '@inertiajs/react';
import { ImageIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import AdminLayout from '@/layouts/admin-layout';
import type { PaginatedAdminRooms, PartnerHotel, PartnerRoom } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Room Management', href: '/admin/rooms' },
];

type RoomWithHotel = PartnerRoom & { hotel_name: string };

type PageProps = {
    rooms: PaginatedAdminRooms;
    hotels: PartnerHotel[];
    filters: { search: string; status: string; hotel: string };
};

export default function AdminRoomsIndex() {
    const { rooms, hotels, filters } = usePage<PageProps>().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<RoomWithHotel | null>(null);

    function applySearch() {
        router.get('/admin/rooms', { search: searchInput, status: filters.status, hotel: filters.hotel, page: 1 }, { preserveScroll: true });
    }

    function handleStatusChange(value: string) {
        router.get('/admin/rooms', { search: filters.search, status: value, hotel: filters.hotel, page: 1 }, { preserveScroll: true });
    }

    function handleHotelFilter(value: string) {
        router.get('/admin/rooms', { search: filters.search, status: filters.status, hotel: value, page: 1 }, { preserveScroll: true });
    }

    function handlePageChange(page: number) {
        router.get('/admin/rooms', { search: filters.search, status: filters.status, hotel: filters.hotel, page }, { preserveScroll: true });
    }

    function confirmDelete() {
        if (!deleteTarget) return;

        router.delete(`/admin/rooms/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success('Room deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete room.');
            },
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
                    <p className="text-muted-foreground text-sm">Manage room details and seasonal pricing.</p>
                </div>

                <DataTable<RoomWithHotel>
                    data={rooms.data}
                    totalCount={rooms.total}
                    page={rooms.current_page}
                    pageSize={rooms.per_page}
                    onPageChange={handlePageChange}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    onSearchApply={applySearch}
                    searchPlaceholder="Search by room name, hotel, type..."
                    keyExtractor={(room) => String(room.id)}
                    actions={(
                        <div className="flex items-center gap-2">
                            <SearchableSelect
                                value={filters.hotel || 'all'}
                                onValueChange={handleHotelFilter}
                                options={[
                                    { value: 'all', label: 'All hotels' },
                                    ...hotels.map((hotel) => ({ value: String(hotel.id), label: hotel.name })),
                                ]}
                                placeholder="Filter by hotel..."
                                className="w-72"
                            />
                            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-9 w-36">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="occupied">Occupied</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button asChild size="sm" className="shrink-0">
                                <Link href={filters.hotel && filters.hotel !== 'all' ? `/admin/rooms/create?hotel=${filters.hotel}` : '/admin/rooms/create'}>
                                    <PlusIcon className="size-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Add Room</span>
                                </Link>
                            </Button>
                        </div>
                    )}
                    columns={[
                        {
                            key: 'serial',
                            label: '#',
                            render: (room) => room.serial,
                        },
                        {
                            key: 'images',
                            label: 'Image',
                            render: (room) => {
                                const firstImage = room.images?.[0];

                                return firstImage ? (
                                    <img
                                        src={firstImage.path.startsWith('http') ? firstImage.path : `/storage/${firstImage.path}`}
                                        alt={`${room.name} image`}
                                        className="h-12 w-12 rounded-lg border object-cover"
                                    />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed bg-muted text-xs text-muted-foreground">
                                        No image
                                    </div>
                                );
                            },
                        },
                        { key: 'name', label: 'Room' },
                        { key: 'hotel_name', label: 'Hotel', render: (room) => room.hotel_name },
                        { key: 'type', label: 'Type' },
                        { key: 'capacity', label: 'Capacity' },
                        {
                            key: 'price_per_night',
                            label: 'Base Price',
                            render: (room) => `${Number(room.price_per_night).toFixed(0)} Tk`,
                        },
                        {
                            key: 'effective_price',
                            label: 'Current Price',
                            render: (room) => (
                                <div>
                                    <div>{`${Number(room.effective_price ?? room.price_per_night).toFixed(0)} Tk`}</div>
                                    {room.active_price_rule && (
                                        <div className="text-xs text-muted-foreground">{room.active_price_rule}</div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (room) => (
                                <Badge
                                    variant={
                                        room.status === 'available'
                                            ? 'default'
                                            : room.status === 'occupied'
                                              ? 'secondary'
                                              : 'outline'
                                    }
                                >
                                    {room.status}
                                </Badge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (room) => (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="size-8" title="Manage images" asChild>
                                        <Link href={`/admin/rooms/${room.id}/images`}>
                                            <ImageIcon className="size-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8" title="Edit room" asChild>
                                        <Link href={`/admin/rooms/${room.id}/edit`}>
                                            <PencilIcon className="size-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        title="Delete room"
                                        onClick={() => setDeleteTarget(room)}
                                    >
                                        <Trash2Icon className="size-4" />
                                    </Button>
                                </div>
                            ),
                        },
                    ]}
                />

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
