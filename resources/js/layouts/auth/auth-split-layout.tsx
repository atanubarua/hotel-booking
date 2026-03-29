import { Link } from '@inertiajs/react';
import { Home } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left panel — hotel image */}
            <div className="relative hidden lg:block">
                <img
                    src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=85"
                    alt="Luxury hotel resort"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                {/* Home button */}
                <Link
                    href={home()}
                    className="absolute top-8 left-8 flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors duration-200 border border-white/30"
                    title="Go to Home"
                >
                    <Home className="h-5 w-5" />
                </Link>
            </div>

            {/* Right panel — form */}
            <div className="flex flex-col items-center justify-center bg-background px-6 py-12 sm:px-10">
                {/* Mobile logo */}
                <Link href={home()} className="mb-8 flex items-center gap-2 font-semibold text-lg lg:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                        <path d="m12 5.432 8.159 8.159c.03.03.058.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                    </svg>
                    StayEase
                </Link>

                <div className="w-full max-w-sm">
                    <div className="mb-8 space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
