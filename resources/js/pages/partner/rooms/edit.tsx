import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminRoomForm, type PriceRuleForm, type RoomFormData } from '@/components/admin/admin-room-form';
import type { ExistingImage } from '@/components/image-uploader';
import PartnerLayout from '@/layouts/partner-layout';
import type { PartnerHotel, PartnerRoom } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Rooms', href: '/partner/rooms' },
    { title: 'Edit Room', href: '#' },
];

type EditableRoom = PartnerRoom & {
    effective_price?: number;
    active_price_rule?: string | null;
    price_rules?: PriceRuleForm[];
};

export default function PartnerRoomsEdit() {
    const { room, hotels } = usePage<{ room: EditableRoom; hotels: PartnerHotel[] }>().props;
    const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);

    const form = useForm<RoomFormData>({
        hotel_id: String(room.hotel_id),
        name: room.name,
        type: room.type,
        capacity: String(room.capacity),
        price_per_night: String(room.price_per_night),
        status: room.status,
        images: [],
        delete_images: [],
        price_rules: room.price_rules ?? [],
    });

    function handleDeleteImage(id: number) {
        const ids = [...deletingImageIds, id];
        setDeletingImageIds(ids);
        form.setData('delete_images', ids);
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
            <AdminRoomForm
                title="Edit Room"
                description="Update room details, images, and seasonal pricing rules."
                hotels={hotels}
                form={form}
                existingImages={existingImages}
                onDeleteExisting={handleDeleteImage}
                onSubmit={handleSubmit}
                submitLabel="Save Changes"
                backHref="/partner/rooms"
                currentEffectivePrice={room.effective_price ?? null}
                activePriceRule={room.active_price_rule ?? null}
            />
        </PartnerLayout>
    );
}
