import { Head, usePage } from '@inertiajs/react';
import { Bed, Building2, CalendarCheck, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PartnerLayout from '@/layouts/partner-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Partner', href: '/partner' },
    { title: 'Dashboard', href: '/partner' },
];

type PageProps = {
    hotelCount: number;
    roomCount: number;
};

export default function PartnerDashboard() {
    const { hotelCount, roomCount } = usePage<PageProps>().props;

    const stats = [
        { title: 'My Hotels', value: hotelCount, icon: Building2 },
        { title: 'Total Rooms', value: roomCount, icon: Bed },
        { title: 'Active Bookings', value: 0, icon: CalendarCheck },
        { title: 'Revenue This Month', value: '৳0', icon: DollarSign },
    ];

    return (
        <PartnerLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Partner" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Overview of your hotels and rooms
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card
                            key={stat.title}
                            className="border-border/80 shadow-sm transition-shadow hover:shadow"
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <stat.icon className="size-4" />
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight">
                                    {stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </PartnerLayout>
    );
}
