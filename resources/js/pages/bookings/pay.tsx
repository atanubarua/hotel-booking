import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Hotel {
    id: number;
    name: string;
    city: string;
    star_rating: number;
    images: { id: number; path: string }[];
}

interface Room {
    id: number;
    name: string;
    type: string;
}

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

interface Props {
    booking: Booking;
    hotel: Hotel;
    room: Room;
    stripe_key: string | null;
    payment_intent_url: string;
    status_url: string;
    confirmation_url: string;
    setup_check_url: string | null;
}

interface PaymentIntentResponse {
    client_secret: string;
    payment_intent_id: string;
    status: string | null;
    expires_at: string | null;
}

let stripeScriptPromise: Promise<void> | null = null;

function loadStripeJs(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    if (window.Stripe) {
        return Promise.resolve();
    }

    if (!stripeScriptPromise) {
        stripeScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Unable to load Stripe.js.'));
            document.head.appendChild(script);
        });
    }

    return stripeScriptPromise;
}

function formatDate(d: string) {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function countdownLabel(expiresAt: string | null) {
    if (!expiresAt) return 'Hold time unavailable';

    const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
}

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function readableStatus(status: string | null | undefined) {
    if (!status) return 'unknown';

    return status.replaceAll('_', ' ');
}

export default function BookingPay({ booking, hotel, room, stripe_key, payment_intent_url, status_url, confirmation_url, setup_check_url }: Props) {
    const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [statusNote, setStatusNote] = useState<string>('Preparing secure checkout...');
    const [debugNote, setDebugNote] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(booking.payment_expires_at);
    const [now, setNow] = useState(Date.now());
    const [holderName, setHolderName] = useState(booking.guest_name);
    const [cardReady, setCardReady] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);
    const stripeRef = useRef<any>(null);
    const cardRef = useRef<any>(null);
    const cardMountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!stripe_key) {
            setError('Stripe is not configured yet. Add your Stripe test keys to continue.');
            setStatusNote('Checkout is unavailable until Stripe keys are configured.');
            setLoading(false);
            return;
        }

        let cancelled = false;

        const initialize = async () => {
            try {
                setLoading(true);
                setError(null);
                setIntent(null);
                setCardReady(false);
                setCardComplete(false);
                setStatusNote('Connecting to Stripe and creating a test payment session...');
                setDebugNote(null);

                if (cardRef.current?.destroy) {
                    cardRef.current.destroy();
                }

                await loadStripeJs();

                if (cancelled) return;

                const stripe = window.Stripe?.(stripe_key);

                if (!stripe) {
                    throw new Error('Stripe.js did not initialize correctly.');
                }

                stripeRef.current = stripe;

                const response = await fetch(payment_intent_url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({}),
                });

                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.message ?? 'Unable to initialize payment.');
                }

                if (cancelled) return;

                setIntent(payload);
                setExpiresAt(payload.expires_at);
                setDebugNote(`PaymentIntent ${payload.payment_intent_id} initialized with status ${readableStatus(payload.status)}.`);
                setStatusNote('Loading secure card form...');

                const elements = stripe.elements();
                const card = elements.create('card', {
                    style: {
                        base: {
                            color: '#0f172a',
                            fontFamily: 'Instrument Sans, system-ui, sans-serif',
                            fontSize: '16px',
                            '::placeholder': {
                                color: '#94a3b8',
                            },
                        },
                        invalid: {
                            color: '#b91c1c',
                        },
                    },
                    hidePostalCode: false,
                });

                card.on('ready', () => {
                    setCardReady(true);
                    setStatusNote('Secure checkout is ready. Enter your test card details and continue.');
                    setDebugNote((prev) => `${prev ? `${prev} ` : ''}Stripe Card Element is ready.`);
                });

                card.on('change', (event?: Record<string, unknown>) => {
                    setCardComplete(event?.complete === true);

                    if (event?.error && typeof event.error === 'object' && event.error !== null && 'message' in event.error) {
                        const message = typeof event.error.message === 'string' ? event.error.message : 'Card details are invalid.';
                        setError(message);
                    } else {
                        setError(null);
                    }
                });

                cardRef.current = card;
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Unable to initialize payment.';
                setError(message);
                setStatusNote('Stripe checkout could not be prepared.');
                setDebugNote('Initialization failed before card entry could start.');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void initialize();

        return () => {
            cancelled = true;
            if (cardRef.current?.destroy) {
                cardRef.current.destroy();
            }
            cardRef.current = null;
        };
    }, [payment_intent_url, stripe_key]);

    // Mount the card element after loading=false renders the mount target div
    useEffect(() => {
        if (!loading && cardRef.current && cardMountRef.current) {
            cardRef.current.mount(cardMountRef.current);
        }
    }, [loading]);

    const holdExpired = useMemo(() => {
        if (!expiresAt) return false;

        return new Date(expiresAt).getTime() <= now;
    }, [expiresAt, now]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripeRef.current || !cardRef.current || !intent || holdExpired || submitting || !cardReady) {
            setError('The secure card form is not ready yet.');
            return;
        }

        setSubmitting(true);
        setError(null);
        setStatusNote('Submitting card payment to Stripe...');
        setDebugNote(`Card Element ready: ${cardReady ? 'yes' : 'no'}, complete: ${cardComplete ? 'yes' : 'no'}.`);

        try {
            const result = await stripeRef.current.confirmCardPayment(intent.client_secret, {
                payment_method: {
                    card: cardRef.current,
                    billing_details: {
                        name: holderName,
                        email: booking.guest_email,
                    },
                },
            });

            if (result.error) {
                throw new Error(result.error.message ?? 'Payment could not be completed.');
            }

            const status = result.paymentIntent?.status;
            setDebugNote(`Stripe confirmation returned PaymentIntent status: ${readableStatus(status)}.`);

            if (['succeeded', 'processing', 'requires_capture'].includes(status ?? '')) {
                setStatusNote('Payment submitted. Redirecting to confirmation...');
                window.location.replace(confirmation_url);
                return;
            }

            setStatusNote('Stripe returned an unexpected status. Opening confirmation page anyway...');
            window.location.href = confirmation_url;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Payment could not be completed.';
            setError(message);
            setStatusNote('Payment did not complete.');
            setDebugNote(`Stripe returned without redirect. Last visible message: ${message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const heroImage = hotel.images[0]?.path ?? null;
    const buttonLabel = submitting
        ? 'Processing payment...'
        : holdExpired
            ? 'Booking hold expired'
            : !intent || !cardReady
                ? 'Checkout loading...'
                : `Pay now - Tk ${booking.total_price.toLocaleString()}`;

    return (
        <>
            <Head title={`Pay for ${hotel.name}`}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800" rel="stylesheet" />
                <style>{`
                    * { box-sizing: border-box; }
                    body { margin: 0; font-family: 'Instrument Sans', sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #ecfeff 100%); color: #0f172a; }
                    .shell { min-height: 100vh; }
                    .topbar { background: #0f172a; color: white; padding: 18px 24px; }
                    .topbar-inner { max-width: 1120px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
                    .brand { color: white; text-decoration: none; font-size: 22px; font-weight: 800; letter-spacing: -0.04em; }
                    .brand span { color: #5eead4; }
                    .badge { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; padding: 8px 12px; border-radius: 999px; background: rgba(94,234,212,0.14); color: #99f6e4; }
                    .page { max-width: 1120px; margin: 0 auto; padding: 32px 24px 48px; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; }
                    @media (max-width: 960px) { .page { grid-template-columns: 1fr; } }
                    .panel { background: rgba(255,255,255,0.9); border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; box-shadow: 0 18px 50px rgba(15,23,42,0.08); backdrop-filter: blur(12px); }
                    .panel-body { padding: 28px; }
                    .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: #0f766e; font-weight: 700; margin-bottom: 10px; }
                    .title { font-size: clamp(30px, 4vw, 42px); line-height: 1.05; font-weight: 800; letter-spacing: -0.05em; margin: 0 0 12px; }
                    .copy { color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
                    .meter { display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 999px; background: #ccfbf1; color: #115e59; font-size: 13px; font-weight: 700; margin-bottom: 24px; }
                    .meter.expired { background: #fee2e2; color: #991b1b; }
                    .section { margin-top: 24px; }
                    .label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin-bottom: 8px; }
                    .input { width: 100%; border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px 16px; font: inherit; }
                    .input:focus { outline: none; border-color: #0f766e; box-shadow: 0 0 0 4px rgba(15,118,110,0.12); }
                    .payment-shell { border: 1px solid #dbeafe; border-radius: 18px; background: #ffffff; padding: 16px; min-height: 110px; }
                    .card-shell { padding: 14px 12px; border: 1px solid #cbd5e1; border-radius: 14px; background: #fff; }
                    .status-card { margin-top: 16px; padding: 14px 16px; border-radius: 16px; background: #ecfeff; border: 1px solid #a5f3fc; color: #155e75; font-size: 14px; }
                    .debug-card { margin-top: 12px; padding: 12px 14px; border-radius: 16px; background: #f8fafc; border: 1px dashed #cbd5e1; color: #334155; font-size: 13px; line-height: 1.6; }
                    .error { margin-top: 16px; padding: 14px 16px; border-radius: 16px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 14px; }
                    .btn { width: 100%; margin-top: 20px; border: 0; border-radius: 16px; background: linear-gradient(135deg, #0f766e, #0ea5a4); color: white; padding: 16px 18px; font: inherit; font-size: 16px; font-weight: 800; cursor: pointer; }
                    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
                    .subtle { margin-top: 14px; font-size: 12px; color: #64748b; line-height: 1.6; }
                    .summary-card { overflow: hidden; }
                    .summary-image { width: 100%; height: 180px; object-fit: cover; display: block; }
                    .summary-inner { padding: 24px; }
                    .summary-kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #0f766e; font-weight: 700; }
                    .summary-title { font-size: 24px; font-weight: 800; margin: 8px 0 6px; letter-spacing: -0.04em; }
                    .summary-line { color: #475569; font-size: 14px; margin-bottom: 18px; }
                    .code { display: inline-flex; padding: 10px 14px; border-radius: 999px; background: #0f172a; color: white; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; margin-bottom: 18px; }
                    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
                    .row:last-child { border-bottom: 0; }
                    .row-label { color: #64748b; font-size: 13px; }
                    .row-value { color: #0f172a; font-weight: 700; font-size: 14px; text-align: right; }
                    .total { margin-top: 18px; padding: 18px; border-radius: 18px; background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center; }
                    .total small { display: block; color: rgba(255,255,255,0.62); font-size: 11px; margin-top: 2px; }
                    .total strong { font-size: 28px; letter-spacing: -0.04em; }
                    .helper-links { margin-top: 18px; display: flex; gap: 10px; flex-wrap: wrap; }
                    .helper-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 999px; text-decoration: none; font-size: 13px; font-weight: 700; }
                    .helper-link.primary { background: #ccfbf1; color: #115e59; }
                    .helper-link.secondary { background: #e2e8f0; color: #334155; }
                    .helper-link.danger { background: #fee2e2; color: #991b1b; border: 0; cursor: pointer; font: inherit; }
                    .loading { padding: 18px; border-radius: 18px; background: #f8fafc; color: #475569; font-size: 14px; }
                `}</style>
            </Head>

            <div className="shell">
                <div className="topbar">
                    <div className="topbar-inner">
                        <Link href="/" className="brand">Hotel<span>BD</span></Link>
                        <div className="badge">Stripe sandbox checkout</div>
                    </div>
                </div>

                <div className="page">
                    <div className="panel">
                        <div className="panel-body">
                            <div className="eyebrow">Step 2 of 3</div>
                            <h1 className="title">Secure payment for your room hold</h1>
                            <p className="copy">
                                Your room is temporarily held while payment completes. The booking is confirmed only after Stripe
                                notifies the server successfully.
                            </p>

                            <div className={`meter${holdExpired ? ' expired' : ''}`}>
                                {holdExpired ? 'Hold expired' : countdownLabel(expiresAt)}
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="section">
                                    <label className="label" htmlFor="holder-name">Cardholder name</label>
                                    <input
                                        id="holder-name"
                                        className="input"
                                        value={holderName}
                                        onChange={(event) => setHolderName(event.target.value)}
                                        placeholder="Name on card"
                                        autoComplete="cc-name"
                                    />
                                </div>

                                <div className="section">
                                    <span className="label">Card details</span>
                                    {loading ? (
                                        <div className="loading">Preparing secure Stripe checkout...</div>
                                    ) : (
                                        <div className="payment-shell">
                                            <div className="card-shell">
                                                <div ref={cardMountRef} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="status-card">{statusNote}</div>
                                {debugNote && <div className="debug-card">{debugNote}</div>}
                                {error && <div className="error"><strong>Payment problem</strong><div>{error}</div></div>}

                                <button type="submit" className="btn" disabled={loading || submitting || holdExpired || !intent || !cardReady}>
                                    {buttonLabel}
                                </button>
                            </form>

                            <div className="subtle">
                                Test mode card: <strong>4242 4242 4242 4242</strong> with any future expiry, any CVC, and any postal
                                code.
                            </div>

                            <div className="helper-links">
                                <a href={status_url} className="helper-link secondary">Booking status JSON</a>
                                <a href={confirmation_url} className="helper-link primary">Confirmation page</a>
                                {setup_check_url && <a href={setup_check_url} className="helper-link secondary" target="_blank" rel="noreferrer">Stripe setup check</a>}
                                <button
                                    type="button"
                                    className="helper-link danger"
                                    onClick={() => window.location.reload()}
                                >
                                    Retry checkout
                                </button>
                            </div>
                        </div>
                    </div>

                    <aside className="panel summary-card">
                        {heroImage && <img src={heroImage} alt={hotel.name} className="summary-image" />}
                        <div className="summary-inner">
                            <div className="summary-kicker">Booking summary</div>
                            <div className="summary-title">{hotel.name}</div>
                            <div className="summary-line">{room.name} � {room.type} � {hotel.city}</div>
                            <div className="code">{booking.confirmation_code}</div>

                            <div className="row"><span className="row-label">Guest</span><span className="row-value">{booking.guest_name}</span></div>
                            <div className="row"><span className="row-label">Check-in</span><span className="row-value">{formatDate(booking.check_in)}</span></div>
                            <div className="row"><span className="row-label">Check-out</span><span className="row-value">{formatDate(booking.check_out)}</span></div>
                            <div className="row"><span className="row-label">Stay</span><span className="row-value">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</span></div>
                            <div className="row"><span className="row-label">Guests</span><span className="row-value">{booking.guests}</span></div>
                            <div className="row"><span className="row-label">Status</span><span className="row-value">{booking.status} / {booking.payment_status}</span></div>

                            <div className="total">
                                <div>
                                    Total to pay
                                    <small>Includes all taxes and fees</small>
                                </div>
                                <strong>Tk {booking.total_price.toLocaleString()}</strong>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
