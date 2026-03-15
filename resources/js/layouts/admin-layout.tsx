import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AdminLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AdminSidebar />
            <AppContent
                variant="sidebar"
                className="min-h-svh overflow-x-hidden bg-muted/30"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="min-h-0 flex-1">{children}</div>
            </AppContent>
        </AppShell>
    );
}
