import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarCheck,
    ChevronDownIcon,
    LayoutGrid,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type SubItem = { title: string; href: string };

type NavLeaf = {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: SubItem[];
};

type NavItem = NavLeaf | NavGroup;

function isNavGroup(item: NavItem): item is NavGroup {
    return 'items' in item && Array.isArray((item as NavGroup).items);
}

const adminNav: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutGrid },
    { title: 'User Management', href: '/admin/users', icon: Users },
    {
        title: 'Hotel Management',
        icon: Building2,
        items: [
            { title: 'Hotels', href: '/admin/hotels' },
            { title: 'Rooms', href: '/admin/rooms' },
        ],
    },
    { title: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
];

export function AdminSidebar() {
    const path = (usePage().url as string) || '';
    const isOnHotelsOrRooms =
        path.startsWith('/admin/hotels') || path.startsWith('/admin/rooms');
    const [hotelOpen, setHotelOpen] = useState(false);

    useEffect(() => {
        if (isOnHotelsOrRooms) setHotelOpen(true);
    }, [isOnHotelsOrRooms]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="px-2 py-0">
                    {adminNav.map((item) => {
                        if (isNavGroup(item)) {
                            const isActive = item.items.some((sub) =>
                                path.startsWith(sub.href)
                            );
                            return (
                                <Collapsible
                                    key={item.title}
                                    open={hotelOpen}
                                    onOpenChange={setHotelOpen}
                                    asChild
                                >
                                    <SidebarMenuItem className="group/collapse">
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={{ children: item.title }}
                                                isActive={isActive}
                                                className="data-[state=open]:bg-sidebar-accent"
                                            >
                                                <item.icon className="size-4" />
                                                <span>{item.title}</span>
                                                <ChevronDownIcon className="ml-auto size-4 transition-transform group-data-[state=open]/collapse:rotate-180" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items.map((sub) => (
                                                    <SidebarMenuSubItem key={sub.href}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={path === sub.href}
                                                        >
                                                            <Link href={sub.href} prefetch>
                                                                {sub.title}
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            );
                        }
                        const isActive = path === item.href;
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        <item.icon className="size-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
