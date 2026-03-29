import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/image-uploader';
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
import type { PartnerHotel } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Rooms', href: '/partner/rooms' },
    { title: 'Add Room', href: '/partner/rooms/create' },
];

type RoomForm = {
    hotel_id: string;
    name: string;
    type: string;
    capacity: string;
    price_per_night: string;
    status: string;
    images: File[];
    [key: string]: unknown;
};

export default function PartnerRoomsCreate() {
    const { hotels } = usePage<{ hotels: PartnerHotel[] }>().props;

    const form = useForm<RoomForm>({
        hotel_id: '',
        name: '',
        type: '',
        capacity: '',
        price_per_night: '',
        status: 'available',
        images: [],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/partner/rooms', {
            forceFormData: true,
            onSuccess: () => toast.success('Room created successfully.'),
            onError: () => toast.error('Failed to create room. Please check the form.'),
        });
    }

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Room - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/partner/rooms">
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Add Room</h1>
                        <p className="text-muted-foreground text-sm">Add a new room to one of your hotels</p>
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
                                <Label htmlFor="price_per_night">Price per Night ($)</Label>
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
                                    onFilesChange={(files) => form.setData('images', files)}
                                    maxFiles={10}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Add Room'}
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
