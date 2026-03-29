import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface HotelImage { id: number; path: string; }
interface Hotel {
    id: number; name: string; city: string; country: string;
    address: string; star_rating: number; images: HotelImage[];
}
interface Room {
    id: number; name: string; type: string; capacity: number;
    price_per_night: number; images: HotelImage[];
}
interface NightBreakdown { date: string; price: number; rule_name: string | null; }
interface Stay {
    check_in: string; check_out: string; guests: number;
    nights: number; price_per_night: number; total_price: number;
    breakdown: NightBreakdown[]; applied_rule_name: string | null;
}
interface AuthUser { name: string; email: string; }
interface Props { hotel: Hotel; room: Room; stay: Stay; auth_user: AuthUser | null; }

function Star({ filled }: { filled: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : '#D1D5DB'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BookingCreate({ hotel, room, stay, auth_user }: Props) {
    const [showBreakdown, setShowBreakdown] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        room_id:          room.id,
        check_in:         stay.check_in,
        check_out:        stay.check_out,
        guests:           stay.guests,
        guest_name:       auth_user?.name ?? '',
        guest_email:      auth_user?.email ?? '',
        guest_phone:      '',
        special_requests: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/bookings');
    };

    const heroImage = hotel.images[0]?.path ?? room.images[0]?.path ?? null;

    return (
        <>
            <Head title={`Book ${room.name} — ${hotel.name}`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>{`
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{font-family:'Inter',sans-serif;background:#F1F5F9;color:#1E293B}
                    :root{
                        --primary:#003580;--primary-light:#0057B8;
                        --accent:#FF6B35;--accent-hover:#E55A26;
                        --success:#10B981;--border:#E2E8F0;
                        --card-shadow:0 2px 12px rgba(0,0,0,0.08);
                    }

                    /* NAV */
                    .nav{background:var(--primary);padding:0 24px;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
                    .nav-inner{max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:58px}
                    .nav-logo{font-size:20px;font-weight:800;color:#fff;text-decoration:none}
                    .nav-logo span{color:#FF9900}
                    .nav-back{display:inline-flex;align-items:center;gap:6px;color:rgba(255,255,255,0.8);font-size:13px;font-weight:500;text-decoration:none;transition:.2s}
                    .nav-back:hover{color:#fff}

                    /* PROGRESS STEPS */
                    .steps{background:#fff;border-bottom:1px solid var(--border)}
                    .steps-inner{max-width:1160px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:0}
                    .step{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#94A3B8}
                    .step.active{color:var(--primary)}
                    .step.done{color:var(--success)}
                    .step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;background:#E2E8F0;color:#64748B;flex-shrink:0}
                    .step.active .step-num{background:var(--primary);color:#fff}
                    .step.done .step-num{background:var(--success);color:#fff}
                    .step-divider{flex:1;height:2px;background:#E2E8F0;margin:0 12px;max-width:80px}
                    .step-divider.done{background:var(--success)}

                    /* LAYOUT */
                    .page{max-width:1160px;margin:0 auto;padding:32px 24px;display:grid;grid-template-columns:1fr 400px;gap:28px;align-items:start}
                    @media(max-width:900px){.page{grid-template-columns:1fr}}

                    /* CARDS */
                    .card{background:#fff;border-radius:16px;border:1px solid var(--border);box-shadow:var(--card-shadow)}
                    .card-head{padding:20px 24px;border-bottom:1px solid var(--border)}
                    .card-title{font-size:17px;font-weight:800;color:#0F172A}
                    .card-sub{font-size:13px;color:#64748B;margin-top:2px}
                    .card-body{padding:24px}

                    /* HOTEL SUMMARY CARD */
                    .hotel-hero{width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:16px}
                    .hotel-hero-placeholder{width:100%;height:160px;background:linear-gradient(135deg,#003580,#0057B8);border-radius:12px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;font-size:40px}
                    .hotel-name{font-size:18px;font-weight:800;color:#0F172A;margin-bottom:4px}
                    .hotel-loc{font-size:13px;color:#64748B;display:flex;align-items:center;gap:4px;margin-bottom:12px}
                    .stars{display:inline-flex;gap:2px;margin-bottom:12px}
                    .divider{height:1px;background:var(--border);margin:16px 0}

                    .stay-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
                    .stay-box{background:#F8FAFC;border:1px solid var(--border);border-radius:10px;padding:12px}
                    .stay-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#94A3B8;margin-bottom:4px}
                    .stay-val{font-size:14px;font-weight:700;color:#0F172A}
                    .stay-sub{font-size:11px;color:#64748B;margin-top:2px}

                    .room-tag{display:inline-flex;align-items:center;gap:6px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;margin-bottom:16px}
                    .room-tag-name{font-size:14px;font-weight:700;color:#1E3A8A}
                    .room-type-badge{font-size:11px;background:#DBEAFE;color:#1E40AF;padding:2px 8px;border-radius:4px;font-weight:600}

                    .price-breakdown-toggle{font-size:12px;color:var(--primary);font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;background:none;border:none;padding:0;margin-bottom:8px}
                    .breakdown-rows{background:#F8FAFC;border-radius:8px;padding:12px;margin-bottom:12px}
                    .breakdown-row{display:flex;justify-content:space-between;font-size:12px;color:#475569;padding:4px 0;border-bottom:1px dashed #E2E8F0}
                    .breakdown-row:last-child{border-bottom:none}

                    .price-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0}
                    .price-row-label{font-size:14px;color:#475569;font-weight:500}
                    .price-row-val{font-size:14px;font-weight:600;color:#1E293B}
                    .total-row{display:flex;justify-content:space-between;align-items:center;background:var(--primary);border-radius:10px;padding:14px 16px;margin-top:8px}
                    .total-label{font-size:14px;font-weight:700;color:rgba(255,255,255,0.85)}
                    .total-val{font-size:22px;font-weight:800;color:#fff}
                    .total-sub{font-size:11px;color:rgba(255,255,255,0.65);margin-top:1px}

                    /* FORM */
                    .form-section-title{font-size:15px;font-weight:800;color:#0F172A;margin-bottom:16px;display:flex;align-items:center;gap:8px}
                    .form-section-title svg{color:var(--primary)}
                    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
                    @media(max-width:600px){.form-grid{grid-template-columns:1fr}}
                    .form-full{grid-column:1/-1}
                    .form-group{display:flex;flex-direction:column;gap:6px}
                    .form-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px}
                    .form-input{border:1.5px solid var(--border);border-radius:8px;padding:11px 14px;font-size:14px;font-family:inherit;color:#1E293B;background:#fff;transition:.2s;outline:none}
                    .form-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(0,53,128,0.1)}
                    .form-input.error{border-color:#EF4444}
                    .form-error{font-size:12px;color:#EF4444;font-weight:500}
                    .form-textarea{resize:vertical;min-height:90px;font-family:inherit}

                    /* SECURITY BADGE */
                    .security-notice{display:flex;align-items:center;gap:10px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px 14px;margin-top:20px}
                    .security-icon{font-size:18px;flex-shrink:0}
                    .security-text{font-size:12px;color:#166534;font-weight:500;line-height:1.5}

                    /* SUBMIT BTN */
                    .btn-submit{width:100%;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:16px;font-size:16px;font-weight:800;cursor:pointer;margin-top:24px;transition:.2s;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.3px}
                    .btn-submit:hover:not(:disabled){background:var(--accent-hover);transform:translateY(-1px);box-shadow:0 6px 20px rgba(255,107,53,0.35)}
                    .btn-submit:disabled{opacity:.6;cursor:not-allowed}

                    /* TRUST BADGES */
                    .trust-badges{display:flex;gap:12px;justify-content:center;margin-top:14px;flex-wrap:wrap}
                    .trust-badge{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748B;font-weight:500}
                `}</style>
            </Head>

            {/* NAV */}
            <nav className="nav">
                <div className="nav-inner">
                    <Link href="/" className="nav-logo">Hotel<span>BD</span></Link>
                    <a onClick={() => router.visit(`/hotels/${hotel.id}`)} className="nav-back" style={{ cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back to {hotel.name}
                    </a>
                </div>
            </nav>

            {/* PROGRESS STEPS */}
            <div className="steps">
                <div className="steps-inner">
                    <div className="step active">
                        <div className="step-num">1</div>
                        Your Details
                    </div>
                    <div className="step-divider" />
                    <div className="step">
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
                {/* LEFT COLUMN — FORM */}
                <div>
                    <form onSubmit={handleSubmit}>
                        {/* GUEST DETAILS */}
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="card-head">
                                <div className="card-title">Your Details</div>
                                <div className="card-sub">We'll use these details for your booking confirmation</div>
                            </div>
                            <div className="card-body">
                                <div className="form-grid">
                                    <div className="form-group form-full">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            className={`form-input${errors.guest_name ? ' error' : ''}`}
                                            type="text"
                                            placeholder="e.g. Md. Rahim Uddin"
                                            value={data.guest_name}
                                            onChange={e => setData('guest_name', e.target.value)}
                                            autoComplete="name"
                                        />
                                        {errors.guest_name && <span className="form-error">{errors.guest_name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address *</label>
                                        <input
                                            className={`form-input${errors.guest_email ? ' error' : ''}`}
                                            type="email"
                                            placeholder="you@example.com"
                                            value={data.guest_email}
                                            onChange={e => setData('guest_email', e.target.value)}
                                            autoComplete="email"
                                        />
                                        {errors.guest_email && <span className="form-error">{errors.guest_email}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number *</label>
                                        <input
                                            className={`form-input${errors.guest_phone ? ' error' : ''}`}
                                            type="tel"
                                            placeholder="+880 1X XX XXX XXX"
                                            value={data.guest_phone}
                                            onChange={e => setData('guest_phone', e.target.value)}
                                            autoComplete="tel"
                                        />
                                        {errors.guest_phone && <span className="form-error">{errors.guest_phone}</span>}
                                    </div>
                                    <div className="form-group form-full">
                                        <label className="form-label">Special Requests <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                                        <textarea
                                            className="form-input form-textarea"
                                            placeholder="e.g. early check-in, high floor, quiet room, extra pillows..."
                                            value={data.special_requests}
                                            onChange={e => setData('special_requests', e.target.value)}
                                        />
                                        {errors.special_requests && <span className="form-error">{errors.special_requests}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PAYMENT METHOD */}
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="card-head">
                                <div className="card-title">Payment Method</div>
                                <div className="card-sub">Secure payment processed by Stripe</div>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#EFF6FF', border: '2px solid #3B82F6', borderRadius: 12, padding: '16px 18px' }}>
                                    <div style={{ width: 44, height: 44, background: '#1A56DB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E3A8A' }}>Pay with Card</div>
                                        <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>Visa, Mastercard, Amex — powered by Stripe</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" style={{ height: 20, objectFit: 'contain' }} />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" style={{ height: 20, objectFit: 'contain' }} />
                                    </div>
                                </div>

                                <div className="security-notice">
                                    <span className="security-icon">🔒</span>
                                    <div className="security-text">
                                        Your card details are never stored on our servers. All payments are processed securely through <strong>Stripe</strong>, a PCI-DSS Level 1 certified payment provider.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <button type="submit" className="btn-submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue to Payment
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </>
                            )}
                        </button>

                        <div className="trust-badges">
                            <div className="trust-badge">🔐 256-bit SSL Encrypted</div>
                            <div className="trust-badge">🛡️ Secure Checkout</div>
                            <div className="trust-badge">✅ Free Cancellation</div>
                        </div>

                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </form>
                </div>

                {/* RIGHT COLUMN — BOOKING SUMMARY */}
                <div>
                    <div className="card">
                        <div className="card-head">
                            <div className="card-title">Booking Summary</div>
                        </div>
                        <div className="card-body">
                            {/* Hotel Image */}
                            {heroImage ? (
                                <img src={heroImage} className="hotel-hero" alt={hotel.name} />
                            ) : (
                                <div className="hotel-hero-placeholder">🏨</div>
                            )}

                            {/* Hotel Info */}
                            <div className="stars">
                                {Array.from({ length: 5 }).map((_, i) => <Star key={i} filled={i < hotel.star_rating} />)}
                            </div>
                            <div className="hotel-name">{hotel.name}</div>
                            <div className="hotel-loc">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {hotel.city}, {hotel.country}
                            </div>

                            {/* Room tag */}
                            <div className="room-tag">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                                <span className="room-tag-name">{room.name}</span>
                                <span className="room-type-badge">{room.type}</span>
                            </div>

                            <div className="divider" />

                            {/* Stay Dates */}
                            <div className="stay-grid">
                                <div className="stay-box">
                                    <div className="stay-label">Check-in</div>
                                    <div className="stay-val">{formatDate(stay.check_in)}</div>
                                    <div className="stay-sub">From 2:00 PM</div>
                                </div>
                                <div className="stay-box">
                                    <div className="stay-label">Check-out</div>
                                    <div className="stay-val">{formatDate(stay.check_out)}</div>
                                    <div className="stay-sub">Until 12:00 PM</div>
                                </div>
                            </div>

                            <div style={{ display:'flex', gap:12 }}>
                                <div className="stay-box" style={{ flex:1 }}>
                                    <div className="stay-label">Guests</div>
                                    <div className="stay-val">{stay.guests} {stay.guests === 1 ? 'Person' : 'People'}</div>
                                </div>
                                <div className="stay-box" style={{ flex:1 }}>
                                    <div className="stay-label">Duration</div>
                                    <div className="stay-val">{stay.nights} {stay.nights === 1 ? 'night' : 'nights'}</div>
                                </div>
                            </div>

                            <div className="divider" />

                            {/* Price */}
                            {stay.applied_rule_name && (
                                <div style={{ background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:'#92400E', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                                    🏷️ {stay.applied_rule_name} applied
                                </div>
                            )}

                            <button
                                type="button"
                                className="price-breakdown-toggle"
                                onClick={() => setShowBreakdown(v => !v)}
                            >
                                {showBreakdown ? '▲' : '▼'} {showBreakdown ? 'Hide' : 'Show'} nightly breakdown
                            </button>

                            {showBreakdown && stay.breakdown.length > 0 && (
                                <div className="breakdown-rows">
                                    {stay.breakdown.map((b, i) => (
                                        <div key={i} className="breakdown-row">
                                            <span>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', day:'numeric', month:'short' })}{b.rule_name ? ` · ${b.rule_name}` : ''}</span>
                                            <span style={{ fontWeight:600 }}>Tk {b.price.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="price-row">
                                <span className="price-row-label">Tk {stay.price_per_night.toLocaleString()} × {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}</span>
                                <span className="price-row-val">Tk {stay.total_price.toLocaleString()}</span>
                            </div>
                            <div className="price-row" style={{ borderBottom:'1px dashed var(--border)', paddingBottom:8, marginBottom:4 }}>
                                <span className="price-row-label">Taxes & fees</span>
                                <span className="price-row-val" style={{ color:'#10B981', fontSize:13 }}>Included</span>
                            </div>

                            <div className="total-row">
                                <div>
                                    <div className="total-label">Total Amount</div>
                                    <div className="total-sub">All taxes & fees included</div>
                                </div>
                                <div className="total-val">Tk {stay.total_price.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Cancellation policy */}
                    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', marginTop:16, boxShadow:'var(--card-shadow)' }}>
                        <div style={{ fontWeight:700, fontSize:13, color:'#0F172A', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ color:'#10B981' }}>✓</span> Free Cancellation Policy
                        </div>
                        <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>
                            Cancel for free up to <strong>24 hours</strong> before check-in. Cancellations made within 24 hours of check-in may be subject to a one-night charge.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
