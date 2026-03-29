import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeftIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/image-uploader';
import type { ExistingImage } from '@/components/image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PartnerLayout from '@/layouts/partner-layout';
import type { PartnerHotel, PartnerRoom } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Rooms', href: '/partner/rooms' },
    { title: 'Edit Room', href: '#' },
];

type RoomForm = {
    hotel_id: string;
    name: string;
    type: string;
    capacity: string;
    price_per_night: string;
    status: string;
    images: File[];
    delete_images: number[];
    [key: string]: unknown;
};

export default function PartnerRoomsEdit() {
    const { room, hotels } = usePage<{ room: PartnerRoom; hotels: PartnerHotel[] }>().props;
    const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);

    const form = useForm<RoomForm>({
        hotel_id: String(room.hotel_id),
        name: room.name,
        type: room.type,
        capacity: String(room.capacity),
        price_per_night: String(room.price_per_night),
        status: room.status,
        images: [],
        delete_images: [],
    });

    function handleDeleteImage(id: number) {
        const ids = [...deletingImageIds, id];
        setDeletingImageIds(ids);
        form.setData('delete_images', ids);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/partner/rooms/${room.id}`, {
            forceFormData: true,
            headers: { 'X-HTTP-Method-Override': 'PUT' },
            onSuccess: () => toast.success('Room updated successfully.'),
            onError: () => toast.error('Failed to update room. Please check the form.'),
        });
    }

    const existingImages: ExistingImage[] = (room.images ?? []).filter(
        (img) => !deletingImageIds.includes(img.id),
    );

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Room - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/partner/rooms">
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Edit Room</h1>
                        <p className="text-muted-foreground text-sm">Update room details</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-medium">Room Information</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="hotel_id">Hotel</Label>
                                <Select value={form.data.hotel_id} onValueChange={(v) => form.setData('hotel_id', v)}>
                                    <SelectTrigger id="hotel_id"><SelectValue placeholder="Select hotel" /></SelectTrigger>
                                    <SelectContent>
                                        {hotels.map((hotel) => (
                                            <SelectItem key={hotel.id} value={String(hotel.id)}>{hotel.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.hotel_id && <p className="text-destructive text-sm">{form.errors.hotel_id}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Room Name</Label>
                                <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Room name" />
                                {form.errors.name && <p className="text-destructive text-sm">{form.errors.name}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="type">Type</Label>
                                <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                    <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Deluxe">Deluxe</SelectItem>
                                        <SelectItem value="Suite">Suite</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.errors.type && <p className="text-destructive text-sm">{form.errors.type}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="capacity">Capacity</Label>
                                <Input id="capacity" type="number" min={1} value={form.data.capacity} onChange={(e) => form.setData('capacity', e.target.value)} placeholder="Number of guests" />
                                {form.errors.capacity && <p className="text-destructive text-sm">{form.errors.capacity}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="price_per_night">Price per Night</Label>
                                <Input id="price_per_night" type="number" min={0} step={0.01} value={form.data.price_per_night} onChange={(e) => form.setData('price_per_night', e.target.value)} placeholder="0.00" />
                                {form.errors.price_per_night && <p className="text-destructive text-sm">{form.errors.price_per_night}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="occupied">Occupied</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.errors.status && <p className="text-destructive text-sm">{form.errors.status}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <ImageUploader
                                    existingImages={existingImages}
                                    onDeleteExisting={handleDeleteImage}
                                    onFilesChange={(files) => form.setData('images', files)}
                                    maxFiles={10}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/partner/rooms">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </PartnerLayout>
    );
}
