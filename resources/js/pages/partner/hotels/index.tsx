import { Head, Link, router, usePage } from '@inertiajs/react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PartnerLayout from '@/layouts/partner-layout';
import type { PartnerHotel, PaginatedPartnerHotels } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Hotel Management', href: '/partner/hotels' },
    { title: 'Hotels', href: '/partner/hotels' },
];

type PageProps = {
    hotels: PaginatedPartnerHotels;
    filters: { search: string; status: string };
};

export default function PartnerHotelsIndex() {
    const { hotels, filters } = usePage<PageProps>().props;

    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<PartnerHotel | null>(null);

    function applySearch() {
        router.get(
            '/partner/hotels',
            { search: searchInput, status: filters.status, page: 1 },
            { preserveScroll: true },
        );
    }

    function handleStatusChange(value: string) {
        router.get(
            '/partner/hotels',
            { search: filters.search, status: value, page: 1 },
            { preserveScroll: true },
        );
    }

    function handlePageChange(page: number) {
        router.get(
            '/partner/hotels',
            { search: filters.search, status: filters.status, page },
            { preserveScroll: true },
        );
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/partner/hotels/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Hotels - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Hotels</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your hotel properties
                    </p>
                </div>

                <DataTable<PartnerHotel>
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
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger className="h-9 w-36">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
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
                        { key: 'name', label: 'Name' },
                        { key: 'city', label: 'City' },
                        { key: 'country', label: 'Country' },
                        {
                            key: 'star_rating',
                            label: 'Stars',
                            render: (h) => `${h.star_rating} ★`,
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (h) => (
                                <Badge
                                    variant={
                                        h.status === 'active'
                                            ? 'default'
                                            : h.status === 'pending'
                                              ? 'secondary'
                                              : 'outline'
                                    }
                                >
                                    {h.status}
                                </Badge>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Actions',
                            render: (h) => (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        title="Edit hotel"
                                        asChild
                                    >
                                        <Link href={`/partner/hotels/${h.id}/edit`}>
                                            <PencilIcon className="size-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        title="Delete hotel"
                                        onClick={() => setDeleteTarget(h)}
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
                    title="Delete hotel"
                    description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={confirmDelete}
                />
            </div>
        </PartnerLayout>
    );
}
