import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { AdminRoomForm, type RoomFormData } from '@/components/admin/admin-room-form';
import AdminLayout from '@/layouts/admin-layout';
import type { PartnerHotel } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Room Management', href: '/admin/rooms' },
    { title: 'Add Room', href: '/admin/rooms/create' },
];

type PageProps = {
    hotels: Pick<PartnerHotel, 'id' | 'name'>[];
    selectedHotelId: number | null;
};

export default function AdminRoomsCreate() {
    const { hotels, selectedHotelId } = usePage<PageProps>().props;

    const form = useForm<RoomFormData>({
        hotel_id: selectedHotelId ? String(selectedHotelId) : '',
        name: '',
        type: 'Standard',
        capacity: '2',
        price_per_night: '',
        status: 'available',
        images: [],
        delete_images: [],
        price_rules: [],
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/admin/rooms', {
            forceFormData: true,
            onSuccess: () => toast.success('Room created successfully.'),
            onError: () => toast.error('Failed to create room. Please check the form.'),
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Room - Admin" />
            <AdminRoomForm
                title="Add Room"
                description="Create a new room and define any seasonal pricing rules up front."
                hotels={hotels}
                form={form}
                onSubmit={handleSubmit}
                submitLabel="Add Room"
                backHref="/admin/rooms"
            />
        </AdminLayout>
    );
}
