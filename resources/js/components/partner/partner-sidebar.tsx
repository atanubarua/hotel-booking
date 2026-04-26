import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    ChevronDownIcon,
    LayoutGrid,
    CalendarDays,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AppLogo from '@/components/app-logo';
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

type NavItem =
    | { title: string; href: string; icon: React.ElementType; items?: never }
    | { title: string; icon: React.ElementType; items: { title: string; href: string }[]; href?: never };

const partnerNav: NavItem[] = [
    { title: 'Dashboard', href: '/partner', icon: LayoutGrid },
    { title: 'Bookings', href: '/partner/bookings', icon: CalendarDays },
    {
        title: 'Hotel Management',
        icon: Building2,
        items: [
            { title: 'Hotels', href: '/partner/hotels' },
            { title: 'Rooms', href: '/partner/rooms' },
        ],
    },
];

export function PartnerSidebar() {
    const path = (usePage().url as string) || '';
    const isOnHotelsOrRooms =
        path.startsWith('/partner/hotels') || path.startsWith('/partner/rooms');
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
                            <Link href="/partner" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="px-2 py-0">
                    {partnerNav.map((item) => {
                        if (item.items !== undefined) {
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
