import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ImageIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTable } from '@/components/admin/data-table';
import { ImageUploader } from '@/components/image-uploader';
import type { ExistingImage } from '@/components/image-uploader';
import { Badge } from '@/components/ui/badge';
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

type RoomForm = {
    hotel_id: string;
    name: string;
    type: string;
    capacity: string;
    price_per_night: string;
    status: string;
    images: File[];
    delete_images: number[];
    [key: string]: string | File[] | number[];
};

export default function AdminRoomsIndex() {
    const { rooms, hotels, filters } = usePage<PageProps>().props;

    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<RoomWithHotel | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RoomWithHotel | null>(null);
    const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);

    const form = useForm<RoomForm>({
        hotel_id: '',
        name: '',
        type: 'Standard',
        capacity: '2',
        price_per_night: '',
        status: 'available',
        images: [],
        delete_images: [],
    });

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

    function openCreate() {
        setEditing(null);
        setDeletingImageIds([]);
        form.reset();
        form.setData('hotel_id', hotels[0] ? String(hotels[0].id) : '');
        setModalOpen(true);
    }

    function openEdit(room: RoomWithHotel) {
        setEditing(room);
        setDeletingImageIds([]);
        form.setData({
            hotel_id: String(room.hotel_id),
            name: room.name,
            type: room.type,
            capacity: String(room.capacity),
            price_per_night: String(room.price_per_night),
            status: room.status,
            images: [],
            delete_images: [],
        });
        setModalOpen(true);
    }

    function handleDeleteImage(id: number) {
        const ids = [...deletingImageIds, id];
        setDeletingImageIds(ids);
        form.setData('delete_images', ids);
    }

    function handleSave() {
        if (editing) {
            form.post(`/admin/rooms/${editing.id}`, {
                forceFormData: true,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
                onSuccess: () => {
                    setModalOpen(false);
                    toast.success('Room updated successfully.');
                },
                onError: () => {
                    toast.error('Failed to update room. Please check the form.');
                },
            });
        } else {
            form.post('/admin/rooms', {
                forceFormData: true,
                onSuccess: () => {
                    setModalOpen(false);
                    toast.success('Room created successfully.');
                },
                onError: () => {
                    toast.error('Failed to create room. Please check the form.');
                },
            });
        }
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

    const existingImages: ExistingImage[] = editing
        ? (editing.images ?? []).filter((img) => !deletingImageIds.includes(img.id))
        : [];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
                    <p className="text-muted-foreground text-sm">Manage all hotel rooms</p>
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
                    searchPlaceholder="Search by room name, hotel, type…"
                    keyExtractor={(r) => String(r.id)}
                    actions={
                        <div className="flex items-center gap-2">
                            <Select value={filters.hotel || 'all'} onValueChange={handleHotelFilter}>
                                <SelectTrigger className="h-9 w-40">
                                    <SelectValue placeholder="All hotels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All hotels</SelectItem>
                                    {hotels.map((h) => (
                                        <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <Button onClick={openCreate} size="sm" className="shrink-0">
                                <PlusIcon className="size-4 sm:mr-1.5" />
                                <span className="hidden sm:inline">Add Room</span>
                            </Button>
                        </div>
                    }
                    columns={[
                        {
                            key: 'serial',
                            label: '#',
                            render: (r) => r.serial,
                        },
                        {
                            key: 'images',
                            label: 'Images',
                            render: (r) => {
                                const images = r.images ?? [];
                                const hasImages = images.length > 0;
                                const maxVisibleThumbnails = 3;

                                return (
                                    <div className="flex items-center gap-1">
                                        {hasImages ? (
                                            <>
                                                {images.slice(0, maxVisibleThumbnails).map((image, index) => (
                                                    <a
                                                        key={image.id}
                                                        href={image.path.startsWith('http') ? image.path : `/storage/${image.path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative"
                                                        title={`Image ${index + 1} of ${images.length}`}
                                                    >
                                                        <img
                                                            src={image.path.startsWith('http') ? image.path : `/storage/${image.path}`}
                                                            alt={`${r.name} image ${index + 1}`}
                                                            className="h-12 w-12 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                        {index === maxVisibleThumbnails - 1 && images.length > maxVisibleThumbnails && (
                                                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white text-xs font-medium">
                                                                +{images.length - maxVisibleThumbnails}
                                                            </div>
                                                        )}
                                                    </a>
                                                ))}
                                                {images.length > maxVisibleThumbnails && (
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        +{images.length - maxVisibleThumbnails} more
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg border border-dashed bg-muted flex items-center justify-center">
                                                <span className="text-muted-foreground text-xs">No images</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            },
                        },
                        { key: 'name', label: 'Room' },
                        {
                            key: 'hotel_name',
                            label: 'Hotel',
                            render: (r) => r.hotel_name ?? r.hotel?.name ?? '—',
                        },
                        { key: 'type', label: 'Type' },
                        { key: 'capacity', label: 'Capacity' },
                        {
                            key: 'price_per_night',
                            label: 'Price/Night',
                            render: (r) => `$${Number(r.price_per_night).toFixed(2)}`,
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
                                        title="Manage images"
                                        asChild
                                    >
                                        <Link href={`/admin/rooms/${r.id}/images`}>
                                            <ImageIcon className="size-4" />
                                        </Link>
                                    </Button>
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

                {/* Create / Edit Modal */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Room' : 'Add Room'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="hotel_id">Hotel</Label>
                                <Select
                                    value={form.data.hotel_id}
                                    onValueChange={(v) => form.setData('hotel_id', v)}
                                >
                                    <SelectTrigger id="hotel_id">
                                        <SelectValue placeholder="Select hotel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hotels.map((h) => (
                                            <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.hotel_id && <p className="text-destructive text-sm">{form.errors.hotel_id}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="room_name">Room Name</Label>
                                <Input
                                    id="room_name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Deluxe King"
                                />
                                {form.errors.name && <p className="text-destructive text-sm">{form.errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="room_type">Type</Label>
                                    <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                        <SelectTrigger id="room_type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="Deluxe">Deluxe</SelectItem>
                                            <SelectItem value="Suite">Suite</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="room_status">Status</Label>
                                    <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                        <SelectTrigger id="room_status"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="occupied">Occupied</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="room_capacity">Capacity</Label>
                                    <Input
                                        id="room_capacity"
                                        type="number"
                                        min={1}
                                        value={form.data.capacity}
                                        onChange={(e) => form.setData('capacity', e.target.value)}
                                    />
                                    {form.errors.capacity && <p className="text-destructive text-sm">{form.errors.capacity}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="room_price">Price/Night ($)</Label>
                                    <Input
                                        id="room_price"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={form.data.price_per_night}
                                        onChange={(e) => form.setData('price_per_night', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {form.errors.price_per_night && <p className="text-destructive text-sm">{form.errors.price_per_night}</p>}
                                </div>
                            </div>

                            <ImageUploader
                                existingImages={existingImages}
                                onDeleteExisting={editing ? handleDeleteImage : undefined}
                                onFilesChange={(files) => form.setData('images', files)}
                                maxFiles={10}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={form.processing}>
                                {form.processing ? 'Saving…' : editing ? 'Update' : 'Create'}
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
