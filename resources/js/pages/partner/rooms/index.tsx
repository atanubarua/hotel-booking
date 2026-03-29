import { Head, Link, router, usePage } from '@inertiajs/react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PartnerLayout from '@/layouts/partner-layout';
import type { PartnerRoom, PaginatedRooms } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Hotel Management', href: '/partner/rooms' },
    { title: 'Rooms', href: '/partner/rooms' },
];

type PageProps = {
    rooms: PaginatedRooms;
    filters: { search: string };
};

export default function PartnerRoomsIndex() {
    const { rooms, filters } = usePage<PageProps>().props;

    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<PartnerRoom | null>(null);

    function applySearch() {
        router.get(
            '/partner/rooms',
            { search: searchInput, page: 1 },
            { preserveScroll: true },
        );
    }

    function handlePageChange(page: number) {
        router.get(
            '/partner/rooms',
            { search: filters.search, page },
            { preserveScroll: true },
        );
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/partner/rooms/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your hotel rooms
                    </p>
                </div>

                <DataTable<PartnerRoom>
                    data={rooms.data}
                    totalCount={rooms.total}
                    page={rooms.current_page}
                    pageSize={rooms.per_page}
                    onPageChange={handlePageChange}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    onSearchApply={applySearch}
                    searchPlaceholder="Search by room name…"
                    keyExtractor={(r) => String(r.id)}
                    actions={
                        <Button size="sm" className="shrink-0" asChild>
                            <Link href="/partner/rooms/create">
                                <PlusIcon className="size-4 sm:mr-1.5" />
                                <span className="hidden sm:inline">Add Room</span>
                            </Link>
                        </Button>
                    }
                    columns={[
                        { key: 'name', label: 'Name' },
                        {
                            key: 'hotel_id',
                            label: 'Hotel',
                            render: (r) => r.hotel?.name ?? String(r.hotel_id),
                        },
                        { key: 'type', label: 'Type' },
                        { key: 'capacity', label: 'Capacity' },
                        {
                            key: 'price_per_night',
                            label: 'Price/Night',
                            render: (r) =>
                                `$${Number(r.price_per_night).toFixed(2)}`,
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
                                        title="Edit room"
                                        asChild
                                    >
                                        <Link href={`/partner/rooms/${r.id}/edit`}>
                                            <PencilIcon className="size-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        title="Delete room"
                                        onClick={() => setDeleteTarget(r)}
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
        </PartnerLayout>
    );
}
