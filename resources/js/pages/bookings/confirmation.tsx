import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Booking {
    id: number;
    confirmation_code: string;
    guest_name: string;
    guest_email: string;
    check_in: string;
    check_out: string;
    nights: number;
    guests: number;
    price_per_night: number;
    total_price: number;
    status: string;
    payment_status: string;
    payment_expires_at: string | null;
}

interface Hotel {
    id: number;
    name: string;
    city: string;
    country: string;
    star_rating: number;
    images: { id: number; path: string }[];
    cancellation_policy_text: string;
}

interface Room {
    name: string;
    type: string;
}

interface Props {
    booking: Booking;
    hotel: Hotel;
    room: Room;
    status_url: string;
    pay_url: string;
    cancel_url: string;
    is_cancellable: boolean;
    eligible_refund: number;
}

function formatDate(d: string) {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function BookingConfirmation({ booking: initialBooking, hotel, room, status_url, pay_url, cancel_url, is_cancellable, eligible_refund }: Props) {
    const [booking, setBooking] = useState(initialBooking);
    const [polling, setPolling] = useState(initialBooking.payment_status !== 'paid');
    const [timedOut, setTimedOut] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = () => {
        if (!confirm(`Are you sure you want to cancel this booking? \n\nYou will receive a refund of Tk ${eligible_refund.toLocaleString()}.\n\nPolicy: ${hotel.cancellation_policy_text}`)) {
            return;
        }

        setIsCancelling(true);
        router.post(cancel_url, {}, {
            onFinish: () => setIsCancelling(false),
        });
    };

    useEffect(() => {
        if (!polling) return;

        let attempts = 0;

        const poll = window.setInterval(async () => {
            attempts += 1;

            try {
                const response = await fetch(status_url, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                setBooking(payload);

                const done =
                    payload.payment_status === 'paid' ||
                    ['expired', 'cancelled'].includes(payload.status) ||
                    payload.payment_status === 'failed';

                if (done || attempts >= 20) {
                    setPolling(false);
                    if (!done) setTimedOut(true);
                    window.clearInterval(poll);
                }
            } catch {
                if (attempts >= 20) {
                    setPolling(false);
                    setTimedOut(true);
                    window.clearInterval(poll);
                }
            }
        }, 3000);

        return () => window.clearInterval(poll);
    }, [polling, status_url]);

    const isConfirmed = booking.payment_status === 'paid' && booking.status === 'confirmed';
    const isExpired = booking.status === 'expired';
    const isRefunded = booking.payment_status === 'refunded';
    const isFailed = booking.payment_status === 'failed' && !isExpired;

    const statusPill = isConfirmed ? 'ok' : (isExpired || isRefunded || isFailed) ? 'bad' : 'pending';
    const pillLabel = isConfirmed ? 'Confirmed' : isExpired ? 'Expired' : isRefunded ? 'Refunded' : isFailed ? 'Payment failed' : 'Waiting for payment confirmation';

    const heading = isConfirmed
        ? 'Your booking is confirmed.'
        : isExpired
            ? 'This payment session expired.'
            : isRefunded
                ? 'Payment was refunded automatically.'
                : isFailed
                    ? 'Payment failed.'
                    : timedOut
                        ? 'Still waiting for Stripe confirmation.'
                        : 'We are waiting for Stripe to finish the payment update.';

    const body = isConfirmed
        ? `A confirmation has been created for ${room.name} at ${hotel.name}.`
        : isExpired
            ? 'The temporary room hold expired before payment completed, so the room is available for others again.'
            : isRefunded
                ? 'A payment succeeded after the room could no longer be safely confirmed, so the system refunded it to prevent a double booking.'
                : isFailed
                    ? 'Your card was declined or the payment could not be completed. You can return to the payment page and try again.'
                    : timedOut
                        ? 'The webhook has not arrived yet. If you completed payment, it will update shortly. You can refresh this page.'
                        : 'This page checks the server for the webhook result automatically for about a minute.';

    return (
        <>
            <Head title={`Booking ${booking.confirmation_code}`}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800" rel="stylesheet" />
                <style>{`
                    * { box-sizing: border-box; }
                    body { margin: 0; font-family: 'Instrument Sans', sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%); color: #0f172a; }
                    .page { max-width: 980px; margin: 0 auto; padding: 36px 24px 60px; }
                    .hero { background: white; border: 1px solid rgba(148,163,184,0.2); border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15,23,42,0.08); }
                    .hero-image { width: 100%; height: 240px; object-fit: cover; display: block; }
                    .hero-body { padding: 28px; }
                    .pill { display: inline-flex; padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
                    .pill.ok { background: #dcfce7; color: #166534; }
                    .pill.pending { background: #fef3c7; color: #92400e; }
                    .pill.bad { background: #fee2e2; color: #991b1b; }
                    h1 { margin: 14px 0 10px; font-size: clamp(32px, 5vw, 46px); letter-spacing: -0.05em; line-height: 1.02; }
                    p { margin: 0; color: #475569; font-size: 15px; line-height: 1.7; }
                    .code { margin-top: 20px; display: inline-flex; padding: 12px 16px; border-radius: 999px; background: #0f172a; color: white; font-size: 13px; font-weight: 800; letter-spacing: 0.16em; }
                    .grid { margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
                    .card { padding: 16px; border-radius: 18px; background: #f8fafc; border: 1px solid #e2e8f0; }
                    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #64748b; font-weight: 700; margin-bottom: 8px; }
                    .card-value { font-size: 17px; font-weight: 800; letter-spacing: -0.03em; }
                    .actions { margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap; }
                    .action { display: inline-flex; align-items: center; justify-content: center; padding: 14px 18px; border-radius: 16px; text-decoration: none; font-weight: 800; border: none; cursor: pointer; font: inherit; }
                    .action.primary { background: #0f766e; color: white; }
                    .action.secondary { background: #e2e8f0; color: #334155; }
                    .action.destructive { background: #fee2e2; color: #991b1b; }
                    .action.destructive:hover { background: #fecaca; }
                `}</style>
            </Head>

            <div className="page">
                <div className="hero">
                    {hotel.images[0]?.path && <img src={hotel.images[0].path} alt={hotel.name} className="hero-image" />}

                    <div className="hero-body">
                        <div className={`pill ${statusPill}`}>
                            {pillLabel}
                        </div>

                        <h1>{heading}</h1>

                        <p>{body}</p>

                        <div className="code">{booking.confirmation_code}</div>

                        <div className="grid">
                            <div className="card">
                                <div className="card-label">Guest</div>
                                <div className="card-value">{booking.guest_name}</div>
                            </div>
                            <div className="card">
                                <div className="card-label">Stay</div>
                                <div className="card-value">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</div>
                            </div>
                            <div className="card">
                                <div className="card-label">Check-in</div>
                                <div className="card-value">{formatDate(booking.check_in)}</div>
                            </div>
                            <div className="card">
                                <div className="card-label">Check-out</div>
                                <div className="card-value">{formatDate(booking.check_out)}</div>
                            </div>
                            <div className="card">
                                <div className="card-label">Room</div>
                                <div className="card-value">{room.name}</div>
                            </div>
                            <div className="card">
                                <div className="card-label">Amount</div>
                                <div className="card-value">Tk {booking.total_price.toLocaleString()}</div>
                            </div>
                            <div className="card" style={{ gridColumn: '1 / -1' }}>
                                <div className="card-label">Cancellation Policy</div>
                                <div className="card-value" style={{ fontSize: '15px' }}>{hotel.cancellation_policy_text}</div>
                            </div>
                        </div>

                        <div className="actions">
                            {!isConfirmed && (booking.status === 'pending' || isFailed) && (
                                <Link href={pay_url} className="action primary">Return to payment</Link>
                            )}
                            {timedOut && (
                                <button className="action secondary" onClick={() => window.location.reload()}>Refresh page</button>
                            )}
                            {is_cancellable && (
                                <button
                                    className="action destructive"
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                                </button>
                            )}
                            <Link href="/" className="action secondary">Back to home</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
