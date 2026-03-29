import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bed, ImageIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PartnerLayout from '@/layouts/partner-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Hotel Management', href: '/partner/hotels' },
];

type HotelImage = { id: number; path: string; order: number };
type Hotel = {
    id: number; name: string; address: string; city: string; country: string;
    star_rating: number; phone: string; email: string; description: string;
    status: string; rooms_count: number; serial: number; images: HotelImage[];
};
type PageProps = {
    hotels: { data: Hotel[]; total: number; current_page: number; per_page: number };
    filters: { search: string; status: string };
};

export default function PartnerHotelsIndex() {
    const { hotels, filters } = usePage<PageProps>().props;
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    function applySearch() {
        router.get('/partner/hotels', { search: searchInput, status: filters.status, page: 1 }, { preserveScroll: true });
    }

    function handleStatusChange(value: string) {
        router.get('/partner/hotels', { search: filters.search, status: value, page: 1 }, { preserveScroll: true });
    }

    function handlePageChange(page: number) {
        router.get('/partner/hotels', { search: filters.search, status: filters.status, page }, { preserveScroll: true });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/partner/hotels/${deleteTarget.id}`, { preserveScroll: true, onFinish: () => setDeleteTarget(null) });
    }

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Hotels - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Hotels</h1>
                    <p className="text-muted-foreground text-sm">Manage your hotel properties</p>
                </div>

                <DataTable<Hotel>
                    data={hotels.data}
                    totalCount={hotels.total}
                    page={hotels.current_page}
                    pageSize={hotels.per_page}
                    onPageChange={handlePageChange}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    onSearchApply={applySearch}
                    searchPlaceholder="Search by name, city, country…"
                    keyExtractor={(h) => String(h.id)}
                    actions={
                        <div className="flex items-center gap-2">
                            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" className="shrink-0" asChild>
                                <Link href="/partner/hotels/create">
                                    <PlusIcon className="size-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Add Hotel</span>
                                </Link>
                            </Button>
                        </div>
                    }
                    columns={[
                        { key: 'serial', label: '#', render: (h) => h.serial },
                        {
                            key: 'image', label: 'Image',
                            render: (h) => h.images?.length > 0 ? (
                                <button onClick={() => setPreviewImage(h.images[0].path)} className="cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                    <img src={h.images[0].path} alt={h.name} className="h-12 w-12 rounded-lg object-cover border hover:opacity-80 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </button>
                            ) : (
                                <div className="h-12 w-12 rounded-lg border border-dashed bg-muted flex items-center justify-center">
                                    <span className="text-muted-foreground text-xs">No img</span>
                                </div>
                            ),
                        },
                        { key: 'name', label: 'Name' },
                        { key: 'city', label: 'City' },
                        { key: 'star_rating', label: 'Stars', render: (h) => `${h.star_rating} ★` },
                        { key: 'rooms_count', label: 'Rooms' },
                        {
                            key: 'status', label: 'Status',
                            render: (h) => (
                                <Badge variant={h.status === 'active' ? 'default' : h.status === 'pending' ? 'secondary' : 'outline'}>
                                    {h.status}
                                </Badge>
                            ),
                        },
                        {
                            key: 'actions', label: 'Actions',
                            render: (h) => (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="size-8" title="Manage images" asChild>
                                        <Link href={`/partner/hotels/${h.id}/images`}><ImageIcon className="size-4" /></Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8" title="Edit hotel" asChild>
                                        <Link href={`/partner/hotels/${h.id}/edit`}><PencilIcon className="size-4" /></Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8" title="View rooms" asChild>
                                        <Link href={`/partner/rooms?hotel=${h.id}`}><Bed className="size-4" /></Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Delete hotel" onClick={() => setDeleteTarget(h)}>
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
                    title="Delete hotel"
                    description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={confirmDelete}
                />

                <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none">
                        <div className="relative">
                            <button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"><XIcon className="size-5" /></button>
                            {previewImage && <img src={previewImage} alt="Hotel preview" className="max-w-full max-h-[85vh] rounded-lg object-contain" />}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PartnerLayout>
    );
}
