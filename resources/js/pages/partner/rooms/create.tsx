import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { AdminRoomForm, type RoomFormData } from '@/components/admin/admin-room-form';
import PartnerLayout from '@/layouts/partner-layout';
import type { PartnerHotel } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Rooms', href: '/partner/rooms' },
    { title: 'Add Room', href: '/partner/rooms/create' },
];

export default function PartnerRoomsCreate() {
    const { hotels } = usePage<{ hotels: PartnerHotel[] }>().props;

    const form = useForm<RoomFormData>({
        hotel_id: '',
        name: '',
        type: 'Standard',
        capacity: '2',
        price_per_night: '',
        status: 'available',
        images: [],
        delete_images: [],
        price_rules: [],
    });

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
            <AdminRoomForm
                title="Add Room"
                description="Add a new room to one of your hotels and define seasonal pricing rules."
                hotels={hotels}
                form={form}
                onSubmit={handleSubmit}
                submitLabel="Add Room"
                backHref="/partner/rooms"
            />
        </PartnerLayout>
    );
}
