import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useFlash } from '@/hooks/use-flash';
import type { AppLayoutProps } from '@/types';
import { Toaster } from 'sonner';

export default function AdminLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    useFlash();
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
            <Toaster richColors position="top-right" />
        </AppShell>
    );
}

