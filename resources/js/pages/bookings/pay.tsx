import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Hotel { id: number; name: string; city: string; star_rating: number; images: { id: number; path: string }[]; }
interface Room  { id: number; name: string; type: string; }
interface Booking {
    id: number; confirmation_code: string; guest_name: string; guest_email: string;
    check_in: string; check_out: string; nights: number; guests: number;
    price_per_night: number; total_price: number;
    status: string; payment_status: string;
}
interface Props { booking: Booking; hotel: Hotel; room: Room; stripe_key: string | null; }

function Star({ filled }: { filled: boolean }) {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : '#D1D5DB'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Fake card input components (Stripe Elements placeholders) ──────────────
function FakeCardNumber({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
        const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
        onChange(formatted);
    };
    return (
        <input
            className="stripe-input"
            type="text"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            value={value}
            onChange={handleChange}
            maxLength={19}
            autoComplete="cc-number"
        />
    );
}

function FakeCardExpiry({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
        const formatted = raw.length > 2 ? raw.slice(0, 2) + ' / ' + raw.slice(2) : raw;
        onChange(formatted);
    };
    return (
        <input
            className="stripe-input"
            type="text"
            inputMode="numeric"
            placeholder="MM / YY"
            value={value}
            onChange={handleChange}
            maxLength={7}
            autoComplete="cc-exp"
        />
    );
}

export default function BookingPay({ booking, hotel, room, stripe_key }: Props) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry]         = useState('');
    const [cvc, setCvc]               = useState('');
    const [cardName, setCardName]     = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardFocused, setCardFocused]   = useState<string | null>(null);

    const isCardComplete = cardNumber.replace(/\s/g, '').length === 16 && expiry.length >= 5 && cvc.length >= 3 && cardName.trim().length > 0;

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCardComplete) return;
        setIsProcessing(true);
        // Stripe payment processing will be implemented in Phase 2
        // For now, simulate processing state
        setTimeout(() => setIsProcessing(false), 2000);
    };

    const heroImage = hotel.images[0]?.path ?? null;

    return (
        <>
            <Head title={`Secure Payment — ${hotel.name}`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>{`
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{font-family:'Inter',sans-serif;background:#F1F5F9;color:#1E293B}
                    :root{
                        --primary:#003580;--primary-light:#0057B8;
                        --accent:#FF6B35;--accent-hover:#E55A26;
                        --stripe-blue:#635BFF;--border:#E2E8F0;
                        --card-shadow:0 2px 12px rgba(0,0,0,0.08);
                    }

                    /* NAV */
                    .nav{background:var(--primary);padding:0 24px;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
                    .nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:58px}
                    .nav-logo{font-size:20px;font-weight:800;color:#fff;text-decoration:none}
                    .nav-logo span{color:#FF9900}
                    .secure-badge{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.75);font-weight:500}

                    /* PROGRESS */
                    .steps{background:#fff;border-bottom:1px solid var(--border)}
                    .steps-inner{max-width:1100px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:0}
                    .step{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#94A3B8}
                    .step.done{color:#10B981}
                    .step.active{color:var(--primary)}
                    .step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;background:#E2E8F0;color:#64748B;flex-shrink:0}
                    .step.active .step-num{background:var(--primary);color:#fff}
                    .step.done .step-num{background:#10B981;color:#fff;font-size:13px}
                    .step-divider{flex:1;height:2px;background:#E2E8F0;margin:0 12px;max-width:80px}
                    .step-divider.done{background:#10B981}

                    /* LAYOUT */
                    .page{max-width:1100px;margin:0 auto;padding:32px 24px;display:grid;grid-template-columns:1fr 380px;gap:28px;align-items:start}
                    @media(max-width:880px){.page{grid-template-columns:1fr}}

                    /* CARDS */
                    .card{background:#fff;border-radius:16px;border:1px solid var(--border);box-shadow:var(--card-shadow)}
                    .card-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
                    .card-title{font-size:16px;font-weight:800;color:#0F172A}
                    .card-sub{font-size:12px;color:#64748B;margin-top:1px}
                    .card-body{padding:22px}

                    /* CARD VISUAL */
                    .card-preview{background:linear-gradient(135deg,#1A1F71,#2563EB);border-radius:16px;padding:22px 24px;margin-bottom:22px;position:relative;overflow:hidden;min-height:160px}
                    .card-preview::before{content:'';position:absolute;top:-30px;right:-30px;width:180px;height:180px;background:rgba(255,255,255,0.05);border-radius:50%}
                    .card-preview::after{content:'';position:absolute;bottom:-40px;left:-20px;width:150px;height:150px;background:rgba(255,255,255,0.04);border-radius:50%}
                    .card-chip{width:36px;height:27px;background:linear-gradient(135deg,#F0C040,#C8922A);border-radius:5px;margin-bottom:18px}
                    .card-number-display{font-size:17px;letter-spacing:3px;color:#fff;font-weight:600;margin-bottom:16px;font-family:'Courier New',monospace;opacity:.9}
                    .card-bottom{display:flex;justify-content:space-between;align-items:flex-end}
                    .card-holder{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.65);margin-bottom:2px}
                    .card-holder-name{font-size:14px;color:#fff;font-weight:600;letter-spacing:1px;text-transform:uppercase;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                    .card-expiry-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.55);text-align:right}
                    .card-expiry-val{font-size:14px;color:#fff;font-weight:600;text-align:right}
                    .card-network{position:absolute;top:18px;right:22px;display:flex;gap:-8px}

                    /* STRIPE INPUTS */
                    .stripe-wrapper{background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:13px 14px;transition:.2s;display:flex;align-items:center;gap:10px}
                    .stripe-wrapper:focus-within{border-color:var(--stripe-blue);box-shadow:0 0 0 3px rgba(99,91,255,0.12)}
                    .stripe-wrapper.focused{border-color:var(--stripe-blue)}
                    .stripe-input{border:none;outline:none;font-size:15px;color:#1E293B;font-family:'Inter',sans-serif;width:100%;background:transparent;font-weight:500}
                    .stripe-input::placeholder{color:#CBD5E1;font-weight:400}
                    .stripe-icon{color:#94A3B8;flex-shrink:0}

                    .input-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
                    .input-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#64748B;margin-bottom:6px}

                    /* PAY BUTTON */
                    .btn-pay{width:100%;background:linear-gradient(135deg,var(--stripe-blue),#4F46E5);color:#fff;border:none;border-radius:12px;padding:18px;font-size:17px;font-weight:800;cursor:pointer;margin-top:20px;transition:.2s;display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:.3px;position:relative;overflow:hidden}
                    .btn-pay::before{content:'';position:absolute;inset:0;background:linear-gradient(to right,rgba(255,255,255,0.1),transparent);pointer-events:none}
                    .btn-pay:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,91,255,0.4)}
                    .btn-pay:disabled{opacity:.55;cursor:not-allowed;transform:none}

                    /* TEST HINT */
                    .test-hint{background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px 14px;margin-top:16px}
                    .test-hint-title{font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px;display:flex;align-items:center;gap:6px}
                    .test-hint-card{font-family:'Courier New',monospace;font-size:13px;color:#78350F;background:#FEF9C3;padding:6px 10px;border-radius:6px;margin-top:4px;letter-spacing:1px}

                    /* ORDER SUMMARY */
                    .booking-code{background:linear-gradient(135deg,#003580,#0057B8);color:#fff;border-radius:12px;padding:16px 18px;margin-bottom:18px;display:flex;align-items:center;gap:12px}
                    .booking-code-icon{font-size:22px}
                    .booking-code-label{font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
                    .booking-code-val{font-size:18px;font-weight:800;color:#fff;letter-spacing:2px}

                    .summary-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed var(--border)}
                    .summary-row:last-of-type{border-bottom:none}
                    .summary-label{font-size:13px;color:#64748B;font-weight:500}
                    .summary-val{font-size:13px;font-weight:700;color:#1E293B}
                    .total-box{background:#003580;border-radius:12px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;margin-top:14px}
                    .total-label{font-size:13px;font-weight:700;color:rgba(255,255,255,0.8)}
                    .total-val{font-size:22px;font-weight:800;color:#fff}

                    /* TRUST */
                    .trust-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}
                    .trust-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#94A3B8;font-weight:500}

                    @keyframes spin{to{transform:rotate(360deg)}}
                    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
                `}</style>
            </Head>

            {/* NAV */}
            <nav className="nav">
                <div className="nav-inner">
                    <Link href="/" className="nav-logo">Hotel<span>BD</span></Link>
                    <div className="secure-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Secure Checkout
                    </div>
                </div>
            </nav>

            {/* PROGRESS */}
            <div className="steps">
                <div className="steps-inner">
                    <div className="step done">
                        <div className="step-num">✓</div>
                        Your Details
                    </div>
                    <div className="step-divider done" />
                    <div className="step active">
                        <div className="step-num">2</div>
                        Payment
                    </div>
                    <div className="step-divider" />
                    <div className="step">
                        <div className="step-num">3</div>
                        Confirmation
                    </div>
                </div>
            </div>

            <div className="page">
                {/* LEFT — PAYMENT FORM */}
                <div>
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-head">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#635BFF" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <div>
                                <div className="card-title">Secure Card Payment</div>
                                <div className="card-sub">Powered by Stripe — PCI DSS Level 1 compliant</div>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" style={{ height: 18, objectFit: 'contain' }} />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" style={{ height: 18, objectFit: 'contain' }} />
                            </div>
                        </div>
                        <div className="card-body">
                            {/* Card Preview */}
                            <div className="card-preview">
                                <div style={{ position: 'absolute', top: 18, right: 22, display: 'flex', gap: 4 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', marginLeft: -12 }} />
                                </div>
                                <div className="card-chip" />
                                <div className="card-number-display">
                                    {cardNumber
                                        ? cardNumber.padEnd(19, '·').replace(/(.{4})/g, '$1 ').trim()
                                        : '···· ···· ···· ····'}
                                </div>
                                <div className="card-bottom">
                                    <div>
                                        <div className="card-holder">Cardholder Name</div>
                                        <div className="card-holder-name">{cardName || 'YOUR NAME'}</div>
                                    </div>
                                    <div>
                                        <div className="card-expiry-label">Expires</div>
                                        <div className="card-expiry-val">{expiry || 'MM / YY'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Name */}
                            <form onSubmit={handlePay}>
                                <div style={{ marginBottom: 12 }}>
                                    <div className="input-label">Name on Card</div>
                                    <div className={`stripe-wrapper${cardFocused === 'name' ? ' focused' : ''}`}>
                                        <svg className="stripe-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        <input
                                            className="stripe-input"
                                            type="text"
                                            placeholder="As it appears on your card"
                                            value={cardName}
                                            onChange={e => setCardName(e.target.value)}
                                            onFocus={() => setCardFocused('name')}
                                            onBlur={() => setCardFocused(null)}
                                            autoComplete="cc-name"
                                        />
                                    </div>
                                </div>

                                {/* Card Number */}
                                <div style={{ marginBottom: 12 }}>
                                    <div className="input-label">Card Number</div>
                                    <div className={`stripe-wrapper${cardFocused === 'number' ? ' focused' : ''}`}>
                                        <svg className="stripe-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                        <FakeCardNumber
                                            value={cardNumber}
                                            onChange={setCardNumber}
                                        />
                                        {cardNumber.replace(/\s/g,'').startsWith('4') && (
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" style={{ height: 16, objectFit: 'contain', flexShrink: 0 }} />
                                        )}
                                        {cardNumber.replace(/\s/g,'').startsWith('5') && (
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="MC" style={{ height: 16, objectFit: 'contain', flexShrink: 0 }} />
                                        )}
                                    </div>
                                </div>

                                <div className="input-grid">
                                    <div>
                                        <div className="input-label">Expiry Date</div>
                                        <div className={`stripe-wrapper${cardFocused === 'expiry' ? ' focused' : ''}`}>
                                            <svg className="stripe-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                            <FakeCardExpiry value={expiry} onChange={setExpiry} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="input-label">CVC / CVV</div>
                                        <div className={`stripe-wrapper${cardFocused === 'cvc' ? ' focused' : ''}`}>
                                            <svg className="stripe-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                            <input
                                                className="stripe-input"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="•••"
                                                value={cvc}
                                                maxLength={4}
                                                onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                onFocus={() => setCardFocused('cvc')}
                                                onBlur={() => setCardFocused(null)}
                                                autoComplete="cc-csc"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-pay"
                                    disabled={!isCardComplete || isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                            Pay Now — Tk {booking.total_price.toLocaleString()}
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Test card hint */}
                            <div className="test-hint">
                                <div className="test-hint-title">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    Test Mode — Use these test card details:
                                </div>
                                <div className="test-hint-card">4242 4242 4242 4242</div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                    <div className="test-hint-card">12 / 29</div>
                                    <div className="test-hint-card">123</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="trust-row">
                        <div className="trust-item">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            256-bit SSL Encryption
                        </div>
                        <div className="trust-item">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            PCI DSS Compliant
                        </div>
                        <div className="trust-item">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            No card data stored
                        </div>
                    </div>
                </div>

                {/* RIGHT — ORDER SUMMARY */}
                <div>
                    <div className="card">
                        <div className="card-head">
                            <div className="card-title">Order Summary</div>
                        </div>
                        <div className="card-body">
                            {/* Confirmation Code */}
                            <div className="booking-code">
                                <span className="booking-code-icon">🎫</span>
                                <div>
                                    <div className="booking-code-label">Booking Reference</div>
                                    <div className="booking-code-val">{booking.confirmation_code}</div>
                                </div>
                            </div>

                            {/* Hotel */}
                            {heroImage && (
                                <img src={heroImage} alt={hotel.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} />
                            )}
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>{hotel.name}</div>
                            <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                                {Array.from({ length: 5 }).map((_, i) => <Star key={i} filled={i < hotel.star_rating} />)}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>{hotel.city}</div>

                            {/* Room */}
                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A' }}>{room.name}</span>
                                <span style={{ fontSize: 11, background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{room.type}</span>
                            </div>

                            {/* Stay Details */}
                            <div className="summary-row">
                                <span className="summary-label">Check-in</span>
                                <span className="summary-val">{formatDate(booking.check_in)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Check-out</span>
                                <span className="summary-val">{formatDate(booking.check_out)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Duration</span>
                                <span className="summary-val">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Guests</span>
                                <span className="summary-val">{booking.guests} {booking.guests === 1 ? 'person' : 'people'}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Guest</span>
                                <span className="summary-val">{booking.guest_name}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Avg/night</span>
                                <span className="summary-val">Tk {booking.price_per_night.toLocaleString()}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Taxes & fees</span>
                                <span className="summary-val" style={{ color: '#10B981' }}>Included</span>
                            </div>

                            <div className="total-box">
                                <div>
                                    <div className="total-label">Total to Pay</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>All taxes included</div>
                                </div>
                                <div className="total-val">Tk {booking.total_price.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Need help */}
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginTop: 14, boxShadow: 'var(--card-shadow)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>💬</span> Need help?
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
                            Our support team is available 24/7. Contact us at <strong>support@hotelbd.com</strong> or call <strong>+880 1700 000000</strong>.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
