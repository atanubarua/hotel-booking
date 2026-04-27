import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    MapPin,
    BedDouble,
    Users,
    BadgeCheck,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BookingItem {
    id: number;
    confirmation_code: string;
    hotel_name: string;
    hotel_city: string;
    hotel_image: string | null;
    room_name: string;
    check_in: string;
    check_out: string;
    nights: number;
    guests: number;
    total_price: number;
    status: string;
    payment_status: string;
    refund_amount: number;
    is_cancellable: boolean;
    eligible_refund: number;
    cancellation_policy: string;
    cancelled_at: string | null;
    created_at: string;
}

interface Pagination {
    data: BookingItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    bookings: Pagination;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof BadgeCheck }> = {
    confirmed:   { label: 'Confirmed',   color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: BadgeCheck },
    pending:     { label: 'Pending',     color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',         icon: Clock },
    cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',                 icon: XCircle },
    expired:     { label: 'Expired',     color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',                icon: XCircle },
    checked_in:  { label: 'Checked In',  color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',     icon: BadgeCheck },
    checked_out: { label: 'Checked Out', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',             icon: BadgeCheck },
    completed:   { label: 'Completed',   color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',             icon: BadgeCheck },
    no_show:     { label: 'No Show',     color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',     icon: AlertTriangle },
};

function formatDate(d: string) {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

export default function MyBookings({ bookings }: Props) {
    const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const handleConfirmCancel = () => {
        if (!cancelTarget) return;
        setCancelling(true);
        router.post(
            `/my-bookings/${cancelTarget.id}/cancel`,
            {},
            {
                onSuccess: () => {
                    toast.success('Booking cancelled successfully.');
                    setCancelTarget(null);
                },
                onError: () => {
                    toast.error('Failed to cancel booking. Please try again.');
                },
                onFinish: () => setCancelling(false),
            }
        );
    };

    const handlePageChange = (url: string | null) => {
        if (url) router.visit(url, { preserveScroll: true });
    };

    return (
        <>
            <Head title="My Bookings" />
            <Toaster richColors position="top-right" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                {/* Header */}
                <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-10">
                    <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronLeft className="size-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight">My Reservations</h1>
                                <p className="text-xs text-muted-foreground">{bookings.total} booking{bookings.total !== 1 ? 's' : ''} found</p>
                            </div>
                        </div>
                        <Link href="/" className="text-sm text-primary hover:underline font-medium">
                            Book another room →
                        </Link>
                    </div>
                </div>

                <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
                    {bookings.data.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                            <div className="rounded-full bg-muted p-6">
                                <BedDouble className="size-10 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">No bookings yet</h2>
                                <p className="text-muted-foreground mt-1">Your upcoming and past reservations will appear here.</p>
                            </div>
                            <Link href="/">
                                <Button className="mt-2">Find a hotel</Button>
                            </Link>
                        </div>
                    ) : (
                        bookings.data.map((booking) => {
                            const cfg = statusConfig[booking.status] ?? statusConfig['pending'];
                            const StatusIcon = cfg.icon;
                            const isRefunded = booking.payment_status === 'refunded';

                            return (
                                <div
                                    key={booking.id}
                                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                >
                                    <div className="flex flex-col sm:flex-row">
                                        {/* Hotel Thumbnail */}
                                        <div className="sm:w-48 sm:shrink-0">
                                            {booking.hotel_image ? (
                                                <img
                                                    src={`/storage/${booking.hotel_image}`}
                                                    alt={booking.hotel_name}
                                                    className="h-40 sm:h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-40 sm:h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                                                    <BedDouble className="size-10 text-slate-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <div>
                                                    <h2 className="text-base font-semibold">{booking.hotel_name}</h2>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <MapPin className="size-3.5 shrink-0" />
                                                        {booking.hotel_city}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                                                    <StatusIcon className="size-3.5" />
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Room</span>
                                                    <span className="text-sm font-medium flex items-center gap-1">
                                                        <BedDouble className="size-3.5 text-muted-foreground" />
                                                        {booking.room_name}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Check-in</span>
                                                    <span className="text-sm font-medium flex items-center gap-1">
                                                        <CalendarDays className="size-3.5 text-muted-foreground" />
                                                        {formatDate(booking.check_in)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Check-out</span>
                                                    <span className="text-sm font-medium flex items-center gap-1">
                                                        <CalendarDays className="size-3.5 text-muted-foreground" />
                                                        {formatDate(booking.check_out)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Guests</span>
                                                    <span className="text-sm font-medium flex items-center gap-1">
                                                        <Users className="size-3.5 text-muted-foreground" />
                                                        {booking.guests}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs text-muted-foreground">
                                                        {booking.nights} night{booking.nights !== 1 ? 's' : ''} · {booking.cancellation_policy}
                                                    </span>
                                                    {isRefunded && booking.refund_amount > 0 && (
                                                        <span className="text-xs text-emerald-600 font-medium">
                                                            ✓ Refunded Tk {booking.refund_amount.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-base font-bold">Tk {booking.total_price.toLocaleString()}</span>
                                                    {booking.is_cancellable && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive"
                                                            onClick={() => setCancelTarget(booking)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Confirmation code */}
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                #{booking.confirmation_code}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Pagination */}
                    {bookings.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={bookings.current_page === 1}
                                onClick={() => handlePageChange(bookings.links[0]?.url ?? null)}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground px-2">
                                Page {bookings.current_page} of {bookings.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={bookings.current_page === bookings.last_page}
                                onClick={() => handlePageChange(bookings.links[bookings.links.length - 1]?.url ?? null)}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancellation Confirmation Dialog */}
            <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-destructive" />
                            Cancel Booking
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-3 pt-1">
                                {cancelTarget && (
                                    <>
                                        <p className="text-sm text-muted-foreground">
                                            You are about to cancel your stay at <strong>{cancelTarget.hotel_name}</strong> ({formatDate(cancelTarget.check_in)} → {formatDate(cancelTarget.check_out)}).
                                        </p>

                                        {/* Refund info box */}
                                        <div className={`rounded-lg border p-3 text-sm ${cancelTarget.eligible_refund > 0 ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'}`}>
                                            {cancelTarget.eligible_refund > 0 ? (
                                                <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                                                    ✓ You will receive a refund of <strong>Tk {cancelTarget.eligible_refund.toLocaleString()}</strong> to your original payment method within 5–10 business days.
                                                </p>
                                            ) : (
                                                <p className="text-amber-800 dark:text-amber-300 font-medium">
                                                    ⚠ No refund applicable — the cancellation deadline has passed per the hotel's policy.
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Policy: {cancelTarget.cancellation_policy}
                                        </p>
                                    </>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                            Keep Booking
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmCancel} disabled={cancelling}>
                            {cancelling ? 'Cancelling…' : 'Yes, Cancel Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
