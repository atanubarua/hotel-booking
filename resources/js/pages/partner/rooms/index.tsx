import { Head, Link, router, usePage } from '@inertiajs/react';
import { ImageIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PartnerLayout from '@/layouts/partner-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Room Management', href: '/partner/rooms' },
];

type RoomImage = { id: number; path: string; order: number };
type Hotel = { id: number; name: string };
type Room = {
    id: number; hotel_id: number; hotel_name: string; name: string; type: string;
    capacity: number; price_per_night: number; effective_price: number;
    active_price_rule: string | null; status: string; serial: number; images: RoomImage[];
};
type PageProps = {
    rooms: { data: Room[]; total: number; current_page: number; per_page: number };
    hotels: Hotel[];
    filters: { search: string; status: string; hotel: string };
};

export default function PartnerRoomsIndex() {
    const { rooms, hotels, filters } = usePage<PageProps>().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

    function applySearch() {
        router.get('/partner/rooms', { search: searchInput, status: filters.status, hotel: filters.hotel, page: 1 }, { preserveScroll: true });
    }

    function handleStatusChange(value: string) {
        router.get('/partner/rooms', { search: filters.search, status: value, hotel: filters.hotel, page: 1 }, { preserveScroll: true });
    }

    function handleHotelFilter(value: string) {
        router.get('/partner/rooms', { search: filters.search, status: filters.status, hotel: value, page: 1 }, { preserveScroll: true });
    }

    function handlePageChange(page: number) {
        router.get('/partner/rooms', { search: filters.search, status: filters.status, hotel: filters.hotel, page }, { preserveScroll: true });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/partner/rooms/${deleteTarget.id}`, { preserveScroll: true, onFinish: () => setDeleteTarget(null) });
    }

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
                    <p className="text-muted-foreground text-sm">Manage your hotel rooms and seasonal pricing.</p>
                </div>

                <DataTable<Room>
                    data={rooms.data}
                    totalCount={rooms.total}
                    page={rooms.current_page}
                    pageSize={rooms.per_page}
                    onPageChange={handlePageChange}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    onSearchApply={applySearch}
                    searchPlaceholder="Search by room name or type…"
                    keyExtractor={(r) => String(r.id)}
                    actions={
                        <div className="flex items-center gap-2">
                            <Select value={filters.hotel || 'all'} onValueChange={handleHotelFilter}>
                                <SelectTrigger className="h-9 w-48"><SelectValue placeholder="All hotels" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All hotels</SelectItem>
                                    {hotels.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="occupied">Occupied</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" className="shrink-0" asChild>
                                <Link href="/partner/rooms/create">
                                    <PlusIcon className="size-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Add Room</span>
                                </Link>
                            </Button>
                        </div>
                    }
                    columns={[
                        { key: 'serial', label: '#', render: (r) => r.serial },
                        {
                            key: 'images', label: 'Image',
                            render: (r) => r.images?.[0] ? (
                                <img src={r.images[0].path.startsWith('http') ? r.images[0].path : `/storage/${r.images[0].path}`} alt={r.name} className="h-12 w-12 rounded-lg border object-cover" />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed bg-muted text-xs text-muted-foreground">No img</div>
                            ),
                        },
                        { key: 'name', label: 'Room' },
                        { key: 'hotel_name', label: 'Hotel', render: (r) => r.hotel_name },
                        { key: 'type', label: 'Type' },
                        { key: 'capacity', label: 'Capacity' },
                        { key: 'price_per_night', label: 'Base Price', render: (r) => `${Number(r.price_per_night).toFixed(0)} Tk` },
                        {
                            key: 'effective_price', label: 'Current Price',
                            render: (r) => (
                                <div>
                                    <div>{`${Number(r.effective_price ?? r.price_per_night).toFixed(0)} Tk`}</div>
                                    {r.active_price_rule && <div className="text-xs text-muted-foreground">{r.active_price_rule}</div>}
                                </div>
                            ),
                        },
                        {
                            key: 'status', label: 'Status',
                            render: (r) => (
                                <Badge variant={r.status === 'available' ? 'default' : r.status === 'occupied' ? 'secondary' : 'outline'}>{r.status}</Badge>
                            ),
                        },
                        {
                            key: 'actions', label: 'Actions',
                            render: (r) => (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="size-8" title="Manage images" asChild>
                                        <Link href={`/partner/rooms/${r.id}/images`}><ImageIcon className="size-4" /></Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8" title="Edit room" asChild>
                                        <Link href={`/partner/rooms/${r.id}/edit`}><PencilIcon className="size-4" /></Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Delete room" onClick={() => setDeleteTarget(r)}>
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
        </PartnerLayout>
    );
}
