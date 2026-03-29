import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { login, register, dashboard } from '@/routes';

interface Image { id: number; path: string; order: number; }
interface NightBreakdown { date: string; price: number; rule_name: string | null; season_type: string | null; }
interface Room {
    id: number;
    name: string;
    type: string;
    capacity: number;
    price_per_night: number;
    effective_price: number;
    total_price: number;
    nights: number;
    price_rule_name?: string | null;
    price_rule_season_type?: string | null;
    breakdown: NightBreakdown[];
    status: string;
    images: Image[];
}
interface Hotel { id: number; name: string; address: string; city: string; country: string; star_rating: number; description: string; status: string; images: Image[]; }
interface Filters { checkin?: string; checkout?: string; guests?: string; }
interface Props { hotel: Hotel; rooms: Room[]; filters: Filters; }

function StarDisplay({ rating }: { rating: number }) {
    return (
        <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? '#F59E0B' : '#D1D5DB'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </span>
    );
}

export default function HotelShow({ hotel, rooms, filters }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string } | null } }>().props;

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [modalImages, setModalImages] = useState<string[]>([]);
    const [modalIndex, setModalIndex] = useState(0);

    const openModal = (images: string[], index = 0) => {
        setModalImages(images);
        setModalIndex(index);
        setSelectedImage(images[index]);
    };
    const closeModal = () => { setSelectedImage(null); setModalImages([]); };
    const modalPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        const i = (modalIndex - 1 + modalImages.length) % modalImages.length;
        setModalIndex(i);
        setSelectedImage(modalImages[i]);
    };
    const modalNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const i = (modalIndex + 1) % modalImages.length;
        setModalIndex(i);
        setSelectedImage(modalImages[i]);
    };

    const checkinDate = filters.checkin ? new Date(filters.checkin) : null;
    const checkoutDate = filters.checkout ? new Date(filters.checkout) : null;
    let nights = 1;
    if (checkinDate && checkoutDate && !isNaN(checkinDate.getTime()) && !isNaN(checkoutDate.getTime())) {
        const diff = Math.ceil(Math.abs(checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) nights = diff;
    }

    const startBooking = (roomId: number) => {
        router.visit('/bookings/create', {
            method: 'get',
            data: {
                room_id:   roomId,
                check_in:  filters.checkin  ?? '',
                check_out: filters.checkout ?? '',
                guests:    filters.guests   ?? '1',
            },
        });
    };

    const seasonBadge: Record<string, { label: string; color: string }> = {
        festival:   { label: '🎉 Festival',    color: '#7C3AED' },
        peak:       { label: '📈 Peak Season', color: '#DC2626' },
        off_season: { label: '📉 Off Season',  color: '#0369A1' },
        weekend:    { label: '📅 Weekend',     color: '#0891B2' },
        holiday:    { label: '🏖️ Holiday',     color: '#059669' },
        custom:     { label: '⚙️ Custom',      color: '#64748B' },
    };

    const renderGallery = () => {
        const imgs = hotel.images;
        const count = imgs.length;
        if (count === 0) return null;
        const allPaths = imgs.map(img => img.path);
        if (count === 1) return (
            <div className="gallery gallery-1">
                <div className="gallery-img-wrapper" onClick={() => openModal(allPaths, 0)}>
                    <img src={imgs[0].path} className="gallery-img" alt="Main" />
                </div>
            </div>
        );
        if (count === 2) return (
            <div className="gallery gallery-2">
                {imgs.slice(0, 2).map((img, i) => (
                    <div key={i} className="gallery-img-wrapper" onClick={() => openModal(allPaths, i)}>
                        <img src={img.path} className="gallery-img" alt={`View ${i + 1}`} />
                    </div>
                ))}
            </div>
        );
        if (count === 3) return (
            <div className="gallery gallery-3">
                <div className="gallery-main gallery-img-wrapper" onClick={() => openModal(allPaths, 0)}>
                    <img src={imgs[0].path} className="gallery-img" alt="Main" />
                </div>
                <div className="gallery-sub-2">
                    {imgs.slice(1, 3).map((img, i) => (
                        <div key={i} className="gallery-img-wrapper" onClick={() => openModal(allPaths, i + 1)}>
                            <img src={img.path} className="gallery-img" alt={`View ${i + 2}`} />
                        </div>
                    ))}
                </div>
            </div>
        );
        return (
            <div className="gallery gallery-5">
                <div className="gallery-main gallery-img-wrapper" onClick={() => openModal(allPaths, 0)}>
                    <img src={imgs[0].path} className="gallery-img" alt="Main" />
                </div>
                <div className="gallery-sub-4">
                    {imgs.slice(1, 5).map((img, i) => (
                        <div key={i} className="gallery-img-wrapper" onClick={() => openModal(allPaths, i + 1)}>
                            <img src={img.path} className="gallery-img" alt={`View ${i + 2}`} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title={`${hotel.name} — HotelBD`} >
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>{`
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{font-family:'Inter',sans-serif;background:#F8FAFC;color:#1E293B}
                    :root{
                        --primary:#003580;--primary-light:#0057B8;
                        --accent:#FF9900;--accent-hover:#E68A00;
                        --text-muted:#64748B;--border:#E2E8F0;
                        --card-shadow:0 2px 10px rgba(0,0,0,0.07);
                        --card-shadow-hover:0 8px 28px rgba(0,0,0,0.14);
                    }
                    .navbar{background:var(--primary);padding:0 24px;position:sticky;top:0;z-index:200;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
                    .navbar-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
                    .navbar-logo{font-size:22px;font-weight:800;color:#fff;text-decoration:none;letter-spacing:-.5px;flex-shrink:0}
                    .navbar-logo span{color:var(--accent)}
                    .navbar-links{display:flex;gap:12px;flex-shrink:0;align-items:center}
                    .btn-ghost{color:#fff;background:transparent;border:1.5px solid rgba(255,255,255,0.4);padding:7px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;transition:.2s}
                    .btn-ghost:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.7)}
                    .btn-accent{background:var(--accent);color:#1E293B;border:none;padding:7px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:.2s;display:inline-block}
                    .btn-accent:hover{background:var(--accent-hover);transform:translateY(-1px)}

                    .container{max-width:1200px;margin:0 auto;padding:24px}
                    .hotel-header{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px;margin-bottom:20px}
                    .hotel-title h1{font-size:26px;font-weight:800;color:#0F172A;margin-bottom:6px;letter-spacing:-0.5px}
                    .badge-rating{background:#2563EB;color:#fff;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;display:inline-block;margin-right:8px}
                    .hotel-address{display:flex;align-items:center;gap:6px;font-size:14px;color:#475569;margin-top:6px}
                    .price-highlight{background:#E0F2FE;border:1px solid #BAE6FD;border-radius:12px;padding:16px 24px;text-align:right}
                    .price-highlight .label{font-size:12px;color:#0369A1;font-weight:600;text-transform:uppercase;margin-bottom:4px}
                    .price-highlight .price{font-size:28px;font-weight:800;color:var(--primary);line-height:1}
                    .price-highlight .sub{font-size:12px;color:#475569;margin-top:4px}

                    .gallery{display:grid;gap:8px;border-radius:16px;overflow:hidden;margin-bottom:32px}
                    .gallery-1{grid-template-columns:1fr;grid-template-rows:440px}
                    .gallery-2{grid-template-columns:1fr 1fr;grid-template-rows:440px}
                    .gallery-3{grid-template-columns:2fr 1fr;grid-template-rows:220px 220px}
                    .gallery-5{grid-template-columns:2fr 1fr;grid-template-rows:220px 220px}
                    .gallery-main{grid-row:span 2}
                    .gallery-img{width:100%;height:100%;object-fit:cover;transition:transform .4s;cursor:pointer}
                    .gallery-img-wrapper{overflow:hidden;position:relative}
                    .gallery-img-wrapper:hover .gallery-img{transform:scale(1.05)}
                    .gallery-sub-2{display:grid;grid-template-columns:1fr;grid-template-rows:1fr 1fr;gap:8px}
                    .gallery-sub-4{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px}
                    @media(max-width:768px){
                        .gallery{grid-template-columns:1fr!important;grid-template-rows:300px!important}
                        .gallery-main{grid-row:unset}
                        .gallery-sub-2,.gallery-sub-4{display:flex;overflow-x:auto;padding-bottom:10px;margin-top:8px}
                        .gallery-sub-2 .gallery-img-wrapper,.gallery-sub-4 .gallery-img-wrapper{flex:0 0 140px;height:100px}
                    }

                    .grid-layout{display:grid;grid-template-columns:2fr 1fr;gap:32px;margin-bottom:48px}
                    @media(max-width:960px){.grid-layout{grid-template-columns:1fr}}
                    .description-block{background:#fff;border-radius:16px;border:1px solid var(--border);padding:24px;box-shadow:var(--card-shadow)}
                    .description-block h2{font-size:18px;font-weight:800;color:#1E293B;margin-bottom:12px}
                    .description-block p{font-size:15px;color:#475569;line-height:1.7;white-space:pre-line}
                    .facilities{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:24px;padding-top:24px;border-top:1px solid var(--border)}
                    .facility{display:flex;align-items:center;gap:10px;font-size:14px;color:#334155;font-weight:500}
                    .fac-icon{color:#10B981;font-size:18px}

                    .booking-block{background:#EFF6FF;border:2px solid #BFDBFE;border-radius:16px;padding:24px;position:sticky;top:84px}
                    .booking-title{font-size:16px;font-weight:800;color:#1E3A8A;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #DBEAFE}
                    .summary-row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;font-weight:500;color:#1E40AF}
                    .summary-val{color:#1E293B;font-weight:700}
                    .btn-scroll{width:100%;text-align:center;display:block;background:var(--primary);color:#fff;border:none;border-radius:8px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:20px;transition:.2s;text-decoration:none}
                    .btn-scroll:hover{background:var(--primary-light)}

                    .rooms-section{background:#fff;border-radius:16px;border:1px solid var(--border);padding:24px;box-shadow:var(--card-shadow)}
                    .rooms-section h2{font-size:22px;font-weight:800;color:#1E293B;margin-bottom:20px}
                    .rooms-empty{text-align:center;padding:40px;background:#F8FAFC;border-radius:12px;color:#64748B}
                    .room-card{display:flex;gap:20px;padding:20px;border:1px solid var(--border);border-radius:12px;margin-bottom:16px;transition:.2s}
                    .room-card:hover{border-color:#94A3B8;box-shadow:var(--card-shadow)}
                    @media(max-width:640px){.room-card{flex-direction:column}}
                    .room-img{width:220px;height:160px;border-radius:8px;object-fit:cover;flex-shrink:0;cursor:zoom-in}
                    @media(max-width:640px){.room-img{width:100%;height:200px}}
                    .room-info{flex:1;display:flex;flex-direction:column}
                    .room-name{font-size:18px;font-weight:800;color:#0F172A;margin-bottom:6px}
                    .room-guests{display:flex;align-items:center;gap:6px;font-size:13px;color:#64748B;background:#F1F5F9;padding:4px 10px;border-radius:99px;display:inline-flex;font-weight:600;margin-bottom:12px}
                    .room-amenities{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
                    .r-am{font-size:12px;color:#475569;display:flex;align-items:center;gap:4px}
                    .room-footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:16px;border-top:1px dashed var(--border)}
                    .room-price-info{text-align:left}
                    .room-price{font-size:24px;font-weight:800;color:var(--primary);line-height:1;margin-bottom:4px}
                    .room-p-sub{font-size:12px;color:#64748B}
                    .btn-book{background:var(--accent);color:#1E293B;border:none;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:700;cursor:pointer;transition:.2s;display:flex;align-items:center;gap:8px}
                    .btn-book:hover{background:var(--accent-hover);transform:translateY(-2px);box-shadow:0 4px 12px rgba(255,153,0,0.3)}
                `}</style>
            </Head>

            <nav className="navbar">
                <div className="navbar-inner">
                    <Link href="/" className="navbar-logo">Hotel<span>BD</span></Link>
                    <div className="navbar-links">
                        {auth.user ? (
                            <Link href={dashboard()} className="btn-accent">Dashboard</Link>
                        ) : (
                            <>
                                <Link href={login()} className="btn-ghost">Log in</Link>
                                <Link href={register()} className="btn-accent">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <div className="container">
                <div className="hotel-header">
                    <div className="hotel-title">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <span className="badge-rating">{hotel.star_rating}.0</span>
                            <StarDisplay rating={hotel.star_rating} />
                        </div>
                        <h1>{hotel.name}</h1>
                        <div className="hotel-address">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {hotel.address}, {hotel.city}, {hotel.country}
                        </div>
                    </div>
                    {rooms.length > 0 && (
                        <div className="price-highlight">
                            <div className="label">Reserve from</div>
                            <div className="price">Tk {Math.min(...rooms.map(r => r.total_price)).toLocaleString()}</div>
                            <div className="sub">{rooms[0].nights > 1 ? `total for ${rooms[0].nights} nights` : 'per night'}</div>
                        </div>
                    )}
                </div>

                {renderGallery()}

                <div className="grid-layout">
                    <div className="description-block">
                        <h2>Experience true comfort at {hotel.name}</h2>
                        <p>{hotel.description || 'Welcome to our wonderful hotel! Enjoy top-notch amenities, exceptionally comfortable rooms, and a prime location for all your travel needs. We look forward to hosting you soon.'}</p>
                        <div className="facilities">
                            <div className="facility"><span className="fac-icon">✓</span> Free High-Speed WiFi</div>
                            <div className="facility"><span className="fac-icon">✓</span> Free Parking</div>
                            <div className="facility"><span className="fac-icon">✓</span> 24-hour Front Desk</div>
                            <div className="facility"><span className="fac-icon">✓</span> Air Conditioning</div>
                            <div className="facility"><span className="fac-icon">✓</span> Room Service</div>
                            <div className="facility"><span className="fac-icon">✓</span> Non-smoking rooms</div>
                        </div>
                    </div>
                    <div>
                        <div className="booking-block">
                            <div className="booking-title">Your Booking Details</div>
                            <div className="summary-row">
                                <span>Check-in:</span>
                                <span className="summary-val">{filters.checkin || 'Not Selected'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Check-out:</span>
                                <span className="summary-val">{filters.checkout || 'Not Selected'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Total Length of Stay:</span>
                                <span className="summary-val">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Guests:</span>
                                <span className="summary-val">{filters.guests || 1} Person(s)</span>
                            </div>
                            <a href="#available-rooms" className="btn-scroll">
                                See Available Rooms ↓
                            </a>
                        </div>
                    </div>
                </div>

                <div id="available-rooms" className="rooms-section">
                    <h2>Available Rooms</h2>
                    {rooms.length === 0 ? (
                        <div className="rooms-empty">
                            <div style={{ fontSize: 32, marginBottom: 12 }}>😔</div>
                            <div style={{ fontWeight: 600, color: '#334155', fontSize: 16 }}>No rooms match your criteria.</div>
                            <div style={{ fontSize: 14, marginTop: 4 }}>Try adjusting your dates or the number of guests to see more availability.</div>
                        </div>
                    ) : (
                        <div>
                            {rooms.map(room => (
                                <div key={room.id} className="room-card">
                                    {room.images && room.images.length > 0 ? (
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <img
                                                src={room.images[0].path}
                                                className="room-img"
                                                alt={room.name}
                                                onClick={() => openModal(room.images.map(img => img.path), 0)}
                                            />
                                            {room.images.length > 1 && (
                                                <div onClick={() => openModal(room.images.map(img => img.path), 0)} style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, cursor: 'zoom-in', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                                                    {room.images.length} photos
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="room-img" style={{ background: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: 24 }}>🛏️</span>
                                        </div>
                                    )}
                                    <div className="room-info">
                                        <div className="room-name">{room.name} <span style={{ fontSize: 12, fontWeight: 600, color: '#0369A1', background: '#E0F2FE', padding: '2px 8px', borderRadius: 6, marginLeft: 8, verticalAlign: 'middle' }}>{room.type}</span></div>
                                        <div className="room-guests">👥 Fits up to {room.capacity} {room.capacity === 1 ? 'Person' : 'People'}</div>
                                        <div className="room-amenities">
                                            <div className="r-am">📺 Flat-screen TV</div>
                                            <div className="r-am">❄️ Air Conditioning</div>
                                            <div className="r-am">🚿 Private Bathroom</div>
                                            <div className="r-am">🌐 Free WiFi</div>
                                        </div>
                                        <div className="room-footer">
                                            <div className="room-price-info">
                                                {room.nights > 1 ? (
                                                    <>
                                                        <div className="room-price">Tk {room.total_price.toLocaleString()}</div>
                                                        <div className="room-p-sub">Tk {room.effective_price.toLocaleString()} avg/night · {room.nights} nights</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="room-price">Tk {room.effective_price.toLocaleString()}</div>
                                                        <div className="room-p-sub">per night</div>
                                                    </>
                                                )}
                                                <div className="room-p-sub" style={{ marginTop: 4 }}>
                                                    {room.price_rule_season_type && seasonBadge[room.price_rule_season_type] ? (
                                                        <span style={{ display: 'inline-block', background: seasonBadge[room.price_rule_season_type].color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, marginRight: 6 }}>
                                                            {seasonBadge[room.price_rule_season_type].label}
                                                        </span>
                                                    ) : null}
                                                    {room.price_rule_name ? `${room.price_rule_name} applied` : 'Includes taxes and charges'}
                                                </div>
                                            </div>
                                            <button className="btn-book" onClick={() => startBooking(room.id)}>
                                                Reserve Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedImage && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={closeModal}
                >
                    <button style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 36, cursor: 'pointer', lineHeight: 1 }} onClick={closeModal}>✕</button>
                    {modalImages.length > 1 && (
                        <>
                            <button onClick={modalPrev} style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 28, borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                            <button onClick={modalNext} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 28, borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                            <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{modalIndex + 1} / {modalImages.length}</div>
                        </>
                    )}
                    <img src={selectedImage} alt="Fullscreen view" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: 8, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }} />
                </div>
            )}
        </>
    );
}
