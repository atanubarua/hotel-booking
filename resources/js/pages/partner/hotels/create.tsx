import { Head, Link, useForm } from '@inertiajs/react';
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
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Hotels', href: '/partner/hotels' },
    { title: 'Add Hotel', href: '/partner/hotels/create' },
];

type HotelForm = {
    name: string;
    address: string;
    city: string;
    country: string;
    star_rating: string;
    phone: string;
    email: string;
    description: string;
    status: string;
    images: File[];
    [key: string]: unknown;
};

export default function PartnerHotelsCreate() {
    const form = useForm<HotelForm>({
        name: '',
        address: '',
        city: '',
        country: '',
        star_rating: '',
        phone: '',
        email: '',
        description: '',
        status: 'pending',
        images: [],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/partner/hotels', {
            forceFormData: true,
            onSuccess: () => toast.success('Hotel created successfully.'),
            onError: () => toast.error('Failed to create hotel. Please check the form.'),
        });
    }

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Hotel - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/partner/hotels">
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Add Hotel</h1>
                        <p className="text-muted-foreground text-sm">Register your hotel property</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-medium">Hotel Information</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Hotel name" />
                                {form.errors.name && <p className="text-destructive text-sm">{form.errors.name}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="star_rating">Star Rating</Label>
                                <Select value={form.data.star_rating} onValueChange={(v) => form.setData('star_rating', v)}>
                                    <SelectTrigger id="star_rating"><SelectValue placeholder="Select rating" /></SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.star_rating && <p className="text-destructive text-sm">{form.errors.star_rating}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} placeholder="Street address" />
                                {form.errors.address && <p className="text-destructive text-sm">{form.errors.address}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} placeholder="City" />
                                {form.errors.city && <p className="text-destructive text-sm">{form.errors.city}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" value={form.data.country} onChange={(e) => form.setData('country', e.target.value)} placeholder="Country" />
                                {form.errors.country && <p className="text-destructive text-sm">{form.errors.country}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" type="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} placeholder="+1 234 567 8900" />
                                {form.errors.phone && <p className="text-destructive text-sm">{form.errors.phone}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} placeholder="hotel@example.com" />
                                {form.errors.email && <p className="text-destructive text-sm">{form.errors.email}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.errors.status && <p className="text-destructive text-sm">{form.errors.status}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="description">
                                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <textarea
                                    id="description"
                                    value={form.data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => form.setData('description', e.target.value)}
                                    placeholder="Brief description of the hotel…"
                                    rows={4}
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {form.errors.description && <p className="text-destructive text-sm">{form.errors.description}</p>}
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
                            {form.processing ? 'Saving…' : 'Add Hotel'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/partner/hotels">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </PartnerLayout>
    );
}
