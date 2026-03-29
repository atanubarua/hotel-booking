import { Head } from '@inertiajs/react';
import { Building2, CalendarCheck, DollarSign, Users } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { staticBookings, staticHotels, staticUsers } from '@/data/admin-static';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Dashboard', href: '/admin' },
];

const stats = [
    {
        title: 'Total Users',
        value: staticUsers.length,
        icon: Users,
        description: 'Admins, partners & customers',
    },
    {
        title: 'Hotels',
        value: staticHotels.length,
        icon: Building2,
        description: 'Registered properties',
    },
    {
        title: 'Bookings',
        value: staticBookings.length,
        icon: CalendarCheck,
        description: 'All time',
    },
    {
        title: 'Revenue (sample)',
        value: '৳12,450',
        icon: DollarSign,
        description: 'This month',
    },
];

export default function AdminDashboard() {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="mb-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Overview of your hotel booking platform
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
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-border/80 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Recent activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm">
                                {staticBookings.slice(0, 5).map((b) => (
                                    <li
                                        key={b.id}
                                        className="flex justify-between border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                                    >
                                        <span className="text-foreground">
                                            {b.guestName} booked {b.roomName} at{' '}
                                            {b.hotelName}
                                        </span>
                                        <span className="text-muted-foreground shrink-0 capitalize">
                                            {b.status.replace('_', ' ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    <Card className="border-border/80 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Quick stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 text-sm">
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Partners</span>
                                <span className="font-medium">
                                    {staticUsers.filter((u) => u.role === 'partner').length}
                                </span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Customers</span>
                                <span className="font-medium">
                                    {staticUsers.filter((u) => u.role === 'customer').length}
                                </span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Active hotels</span>
                                <span className="font-medium">
                                    {staticHotels.filter((h) => h.status === 'active').length}
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
