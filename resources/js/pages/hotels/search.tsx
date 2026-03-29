import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { login, register, dashboard } from '@/routes';

interface HotelImage { id: number; path: string; order: number; }
interface Room { id: number; name: string; type: string; capacity: number; price_per_night: number; status: string; }
interface Hotel {
    id: number; name: string; address: string; city: string; country: string;
    star_rating: number; description: string; status: string;
    images: HotelImage[]; rooms: Room[];
    rooms_min_price_per_night: number | null;
    rooms_max_price_per_night: number | null;
}
interface Filters {
    location?: string; checkin?: string; checkout?: string; guests?: string;
    stars?: string[]; min_price?: string; max_price?: string;
    room_type?: string[]; sort?: string;
}
interface Props { hotels: Hotel[]; filters: Filters; priceMin: number; priceMax: number; }

function StarDisplay({ rating }: { rating: number }) {
    return (
        <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                    fill={i < rating ? '#F59E0B' : '#D1D5DB'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </span>
    );
}

const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'stars_desc', label: 'Star Rating' },
];

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite'];
const STAR_OPTIONS = [5, 4, 3, 2, 1];

const getToday = () => new Date().toISOString().split('T')[0];
const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

export default function HotelSearch({ hotels, filters, priceMin, priceMax }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string } | null } }>().props;

    // Search bar state
    const [location, setLocation] = useState(filters.location ?? '');
    const [checkin, setCheckin] = useState(filters.checkin || getToday());
    const [checkout, setCheckout] = useState(filters.checkout || getTomorrow());
    const [guests, setGuests] = useState(filters.guests ?? '1');

    // Filter state
    const [selectedStars, setSelectedStars] = useState<number[]>(
        (filters.stars ?? []).map(Number)
    );
    const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(
        filters.room_type ?? []
    );
    const [minPrice, setMinPrice] = useState<number>(
        filters.min_price ? +filters.min_price : priceMin
    );
    const [maxPrice, setMaxPrice] = useState<number>(
        filters.max_price ? +filters.max_price : priceMax
    );
    const [sort, setSort] = useState(filters.sort ?? 'recommended');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    const buildParams = useCallback(() => ({
        location, checkin, checkout, guests,
        stars: selectedStars.map(String),
        min_price: String(minPrice),
        max_price: String(maxPrice),
        room_type: selectedRoomTypes,
        sort,
    }), [location, checkin, checkout, guests, selectedStars, minPrice, maxPrice, selectedRoomTypes, sort]);

    // Debounced filter apply
    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/hotels/search', buildParams(), { preserveState: true, replace: true });
        }, 400);
        return () => clearTimeout(t);
    }, [selectedStars, selectedRoomTypes, minPrice, maxPrice, sort]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/hotels/search', buildParams(), { preserveState: true });
    };

    const toggleStar = (s: number) =>
        setSelectedStars(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const toggleRoomType = (t: string) =>
        setSelectedRoomTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    const resetFilters = () => {
        setSelectedStars([]);
        setSelectedRoomTypes([]);
        setMinPrice(priceMin);
        setMaxPrice(priceMax);
        setSort('recommended');
    };

    const activeFilterCount = selectedStars.length + selectedRoomTypes.length
        + (minPrice > priceMin ? 1 : 0) + (maxPrice < priceMax ? 1 : 0)
        + (sort !== 'recommended' ? 1 : 0);

    return (
        <>
            <Head title={`Hotels${filters.location ? ` in ${filters.location}` : ''} — HotelBD`} >
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>{`
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{font-family:'Inter',sans-serif;background:#F1F5F9;color:#1E293B}
                    :root{
                        --primary:#003580;--primary-light:#0057B8;
                        --accent:#FF9900;--accent-hover:#E68A00;
                        --text-muted:#64748B;--border:#E2E8F0;
                        --card-shadow:0 2px 10px rgba(0,0,0,0.07);
                        --card-shadow-hover:0 8px 28px rgba(0,0,0,0.14);
                        --sidebar-w:280px;
                    }

                    /* ===== NAVBAR ===== */
                    .navbar{background:var(--primary);padding:0 24px;position:sticky;top:0;z-index:200;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
                    .navbar-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
                    .navbar-logo{font-size:22px;font-weight:800;color:#fff;text-decoration:none;letter-spacing:-.5px;flex-shrink:0}
                    .navbar-logo span{color:var(--accent)}

                    /* Inline search bar in nav */
                    .nav-search-form{display:flex;gap:8px;align-items:stretch;flex:1;max-width:700px}
                    .nav-search-form input{
                        flex:1;border:1.5px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.12);
                        color:#fff;border-radius:8px;padding:8px 12px;font-size:14px;
                        font-family:'Inter',sans-serif;outline:none;transition:.2s;min-width:0;
                    }
                    .nav-search-form input::placeholder{color:rgba(255,255,255,0.55)}
                    .nav-search-form input:focus{border-color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.2)}
                    .nav-search-form input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.7}
                    .btn-nav-search{
                        background:var(--accent);color:#1E293B;border:none;border-radius:8px;
                        padding:8px 18px;font-size:14px;font-weight:700;cursor:pointer;
                        font-family:'Inter',sans-serif;transition:.2s;white-space:nowrap;flex-shrink:0;
                    }
                    .btn-nav-search:hover{background:var(--accent-hover);transform:translateY(-1px)}
                    .navbar-links{display:flex;gap:8px;flex-shrink:0}
                    .btn-ghost{color:#fff;background:transparent;border:1.5px solid rgba(255,255,255,0.4);padding:7px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;transition:.2s}
                    .btn-ghost:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.7)}
                    .btn-accent{background:var(--accent);color:#1E293B;border:none;padding:7px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:.2s;display:inline-block}
                    .btn-accent:hover{background:var(--accent-hover);transform:translateY(-1px)}

                    /* ===== RESULTS BAR ===== */
                    .results-bar{background:#fff;border-bottom:1px solid var(--border);padding:10px 24px}
                    .results-bar-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
                    .results-summary{font-size:15px;font-weight:600;color:#1E293B}
                    .results-summary span{color:var(--text-muted);font-weight:400}
                    .results-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
                    .sort-label{font-size:13px;color:var(--text-muted);font-weight:500}
                    .sort-select{
                        border:1.5px solid var(--border);border-radius:8px;padding:7px 12px;
                        font-size:13px;font-family:'Inter',sans-serif;color:#1E293B;
                        background:#fff;cursor:pointer;outline:none;transition:.2s;
                    }
                    .sort-select:focus{border-color:var(--primary-light)}
                    .mobile-filter-btn{
                        display:none;background:var(--primary);color:#fff;border:none;
                        border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;
                        cursor:pointer;font-family:'Inter',sans-serif;align-items:center;gap:6px;
                    }
                    @media(max-width:900px){.mobile-filter-btn{display:flex}}

                    /* ===== LAYOUT ===== */
                    .page-layout{max-width:1280px;margin:0 auto;padding:20px 24px;display:flex;gap:20px;align-items:flex-start}

                    /* ===== SIDEBAR ===== */
                    .sidebar{
                        width:var(--sidebar-w);flex-shrink:0;
                        background:#fff;border-radius:14px;border:1px solid var(--border);
                        overflow:hidden;position:sticky;top:76px;max-height:calc(100vh - 96px);overflow-y:auto;
                    }
                    @media(max-width:900px){
                        .sidebar{
                            position:fixed;top:0;left:0;height:100vh;max-height:100vh;
                            z-index:300;width:300px;border-radius:0;transform:translateX(-110%);
                            transition:transform .3s ease;box-shadow:4px 0 30px rgba(0,0,0,0.15);
                        }
                        .sidebar.open{transform:translateX(0)}
                    }
                    .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:299}
                    @media(max-width:900px){.sidebar-overlay.open{display:block}}
                    .sidebar-header{padding:16px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
                    .sidebar-title{font-size:15px;font-weight:700;color:#1E293B;display:flex;align-items:center;gap:8px}
                    .filter-count-badge{background:var(--primary);color:#fff;font-size:10px;font-weight:700;border-radius:99px;padding:2px 7px}
                    .reset-btn{background:none;border:none;color:var(--primary-light);font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:.2s}
                    .reset-btn:hover{text-decoration:underline}
                    .close-btn{background:none;border:none;font-size:20px;cursor:pointer;color:#64748B;display:none}
                    @media(max-width:900px){.close-btn{display:block}}

                    .filter-section{padding:16px 18px;border-bottom:1px solid var(--border)}
                    .filter-section:last-child{border-bottom:none}
                    .filter-section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:12px}

                    /* Checkbox items */
                    .filter-item{display:flex;align-items:center;gap:10px;padding:5px 0;cursor:pointer}
                    .filter-item input[type=checkbox]{
                        width:16px;height:16px;accent-color:var(--primary);cursor:pointer;flex-shrink:0;
                    }
                    .filter-item label{font-size:14px;color:#374151;cursor:pointer;flex:1;display:flex;align-items:center;gap:6px}

                    /* Price range */
                    .price-range-display{display:flex;justify-content:space-between;margin-bottom:12px}
                    .price-val{font-size:13px;font-weight:600;color:var(--primary)}
                    .price-slider{width:100%;position:relative;height:28px;display:flex;align-items:center}
                    .price-slider input[type=range]{
                        -webkit-appearance:none;width:100%;height:4px;background:var(--border);
                        border-radius:2px;outline:none;cursor:pointer;position:absolute;
                    }
                    .price-slider input[type=range]::-webkit-slider-thumb{
                        -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
                        background:var(--primary);cursor:pointer;border:2px solid #fff;
                        box-shadow:0 2px 6px rgba(0,0,0,0.2);
                    }
                    .price-slider input[type=range]::-webkit-slider-runnable-track{
                        background:linear-gradient(to right, var(--border) 0%, var(--primary) var(--val), var(--border) var(--val));
                    }

                    /* ===== MAIN CONTENT ===== */
                    .main-content{flex:1;min-width:0}
                    .hotel-list{display:flex;flex-direction:column;gap:16px}

                    /* ===== HOTEL CARD (horizontal) ===== */
                    .hotel-card{
                        background:#fff;border-radius:14px;border:1px solid var(--border);
                        overflow:hidden;display:flex;transition:.25s;cursor:pointer;
                        box-shadow:var(--card-shadow);
                    }
                    .hotel-card:hover{box-shadow:var(--card-shadow-hover);transform:translateY(-2px)}
                    .hotel-card-img{width:240px;flex-shrink:0;position:relative;overflow:hidden}
                    .hotel-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
                    .hotel-card:hover .hotel-card-img img{transform:scale(1.06)}
                    .hotel-card-img-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#003580,#0056a6);display:flex;align-items:center;justify-content:center;font-size:48px}
                    .img-badge{position:absolute;top:10px;left:10px;background:rgba(0,53,128,.9);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:5px}
                    .img-badge-deal{position:absolute;top:10px;right:10px;background:#16A34A;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:5px}

                    .hotel-card-body{padding:18px 20px;flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
                    .hotel-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
                    .hotel-name{font-size:18px;font-weight:700;color:#1E293B;line-height:1.3}
                    .hotel-price-block{text-align:right;flex-shrink:0}
                    .price-from-label{font-size:11px;color:var(--text-muted);margin-bottom:2px}
                    .price-big{font-size:24px;font-weight:800;color:var(--primary);line-height:1}
                    .price-night{font-size:12px;color:var(--text-muted);font-weight:500}

                    .hotel-meta-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
                    .hotel-location{color:var(--text-muted);font-size:13px;display:flex;align-items:center;gap:4px}
                    .room-type-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
                    .room-tag{background:#EFF6FF;color:var(--primary);border:1px solid #BFDBFE;border-radius:5px;font-size:11px;font-weight:600;padding:2px 8px}

                    .hotel-desc{color:#475569;font-size:13px;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
                    .hotel-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:12px;border-top:1px solid var(--border);flex-wrap:wrap;gap:8px}
                    .room-count{font-size:12px;color:var(--text-muted)}
                    .btn-view{
                        background:var(--primary);color:#fff;border:none;border-radius:8px;
                        padding:9px 22px;font-size:13px;font-weight:600;cursor:pointer;
                        text-decoration:none;transition:.2s;font-family:'Inter',sans-serif;display:inline-block;
                    }
                    .btn-view:hover{background:var(--primary-light);transform:translateY(-1px)}

                    @media(max-width:600px){
                        .hotel-card{flex-direction:column}
                        .hotel-card-img{width:100%;height:180px}
                    }

                    /* Empty state */
                    .empty-state{text-align:center;padding:80px 24px;background:#fff;border-radius:14px;border:1px solid var(--border)}
                    .empty-icon{font-size:60px;margin-bottom:14px}
                    .empty-state h3{font-size:20px;font-weight:700;color:#374151;margin-bottom:8px}
                    .empty-state p{font-size:14px;color:var(--text-muted)}
                `}</style>
            </Head>

            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-inner">
                    <Link href="/" className="navbar-logo">Hotel<span>BD</span></Link>

                    <form className="nav-search-form" onSubmit={handleSearch}>
                        <input id="s-location" type="text" placeholder="📍 City or Hotel Name" value={location}
                            onChange={e => setLocation(e.target.value)} />
                        <input id="s-checkin" type="date" value={checkin}
                            onChange={e => setCheckin(e.target.value)}
                            min={new Date().toISOString().split('T')[0]} />
                        <input id="s-checkout" type="date" value={checkout}
                            onChange={e => setCheckout(e.target.value)}
                            min={checkin || new Date().toISOString().split('T')[0]} />
                        <input id="s-guests" type="number" placeholder="Guests" min="1" max="20"
                            value={guests} onChange={e => setGuests(e.target.value)}
                            style={{ width: 70 }} />
                        <button type="submit" className="btn-nav-search">Search</button>
                    </form>

                    <div className="navbar-links">
                        {auth.user ? (
                            <Link href={dashboard()} className="btn-accent">Dashboard</Link>
                        ) : (
                            <>
                                <Link href={login()} className="btn-ghost">Login</Link>
                                <Link href={register()} className="btn-accent">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Results bar */}
            <div className="results-bar">
                <div className="results-bar-inner">
                    <div className="results-summary">
                        {hotels.length} propert{hotels.length === 1 ? 'y' : 'ies'} found
                        {filters.location && <span> in <strong>"{filters.location}"</strong></span>}
                        {(filters.checkin && filters.checkout) && (
                            <span style={{ marginLeft: 8, fontSize: 13, color: '#64748B' }}>
                                · {filters.checkin} → {filters.checkout}
                            </span>
                        )}
                    </div>
                    <div className="results-controls">
                        <button
                            className="mobile-filter-btn"
                            onClick={() => setMobileFilterOpen(true)}
                        >
                            🔧 Filters
                            {activeFilterCount > 0 && (
                                <span style={{ background: 'var(--accent)', color: '#1E293B', borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: 700 }}>
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <span className="sort-label">Sort:</span>
                        <select
                            className="sort-select"
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="page-layout">
                {/* Mobile overlay */}
                <div
                    className={`sidebar-overlay ${mobileFilterOpen ? 'open' : ''}`}
                    onClick={() => setMobileFilterOpen(false)}
                />

                {/* ===== SIDEBAR FILTERS ===== */}
                <aside className={`sidebar ${mobileFilterOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <div className="sidebar-title">
                            🔧 Filters
                            {activeFilterCount > 0 && (
                                <span className="filter-count-badge">{activeFilterCount}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {activeFilterCount > 0 && (
                                <button className="reset-btn" onClick={resetFilters}>Reset all</button>
                            )}
                            <button className="close-btn" onClick={() => setMobileFilterOpen(false)}>✕</button>
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div className="filter-section">
                        <div className="filter-section-title">Star Rating</div>
                        {STAR_OPTIONS.map(s => (
                            <div key={s} className="filter-item" onClick={() => toggleStar(s)}>
                                <input type="checkbox" id={`star-${s}`}
                                    checked={selectedStars.includes(s)} onChange={() => {}} />
                                <label htmlFor={`star-${s}`}>
                                    {Array.from({ length: s }).map((_, i) => (
                                        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    ))}
                                    <span style={{ color: '#475569', marginLeft: 2 }}>& up</span>
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Price Range */}
                    <div className="filter-section">
                        <div className="filter-section-title">Price per Night</div>
                        <div className="price-range-display">
                            <span className="price-val">৳{minPrice.toLocaleString()}</span>
                            <span className="price-val">৳{maxPrice.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 5 }}>Min price</div>
                                <input
                                    type="range"
                                    min={priceMin} max={priceMax} step={100}
                                    value={minPrice}
                                    onChange={e => setMinPrice(Math.min(+e.target.value, maxPrice - 100))}
                                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 5 }}>Max price</div>
                                <input
                                    type="range"
                                    min={priceMin} max={priceMax} step={100}
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(Math.max(+e.target.value, minPrice + 100))}
                                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Room Type */}
                    <div className="filter-section">
                        <div className="filter-section-title">Room Type</div>
                        {ROOM_TYPES.map(t => (
                            <div key={t} className="filter-item" onClick={() => toggleRoomType(t)}>
                                <input type="checkbox" id={`rt-${t}`}
                                    checked={selectedRoomTypes.includes(t)} onChange={() => {}} />
                                <label htmlFor={`rt-${t}`}>{t}</label>
                            </div>
                        ))}
                    </div>

                    {/* Amenities (Static UI) */}
                    <div className="filter-section">
                        <div className="filter-section-title">Amenities</div>
                        {['Free Wi-Fi', 'Swimming Pool', 'Parking', 'Restaurant', 'Gym', 'Spa'].map(a => (
                            <div key={a} className="filter-item">
                                <input type="checkbox" id={`am-${a}`} />
                                <label htmlFor={`am-${a}`}>{a}</label>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ===== MAIN RESULTS ===== */}
                <main className="main-content">
                    {hotels.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <h3>No hotels found</h3>
                            <p>Try adjusting your filters or search for a different destination.</p>
                            <button
                                onClick={resetFilters}
                                style={{ marginTop: 16, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="hotel-list">
                            {hotels.map(hotel => {
                                const imgSrc = hotel.images?.[0]?.path;
                                const minP = hotel.rooms_min_price_per_night;
                                const roomTypes = [...new Set(hotel.rooms?.map(r => r.type) ?? [])];
                                return (
                                    <div key={hotel.id} className="hotel-card">
                                        <div className="hotel-card-img" style={{ height: 200 }}>
                                            {imgSrc
                                                ? <img src={imgSrc} alt={hotel.name} loading="lazy" />
                                                : <div className="hotel-card-img-placeholder">🏨</div>
                                            }
                                            <div className="img-badge">{hotel.star_rating} Star</div>
                                            {hotel.star_rating >= 4 && <div className="img-badge-deal">✓ Top Rated</div>}
                                        </div>

                                        <div className="hotel-card-body">
                                            <div className="hotel-card-top">
                                                <div>
                                                    <StarDisplay rating={hotel.star_rating} />
                                                    <div className="hotel-name" style={{ marginTop: 4 }}>{hotel.name}</div>
                                                    <div className="hotel-location" style={{ marginTop: 5 }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                                        </svg>
                                                        {hotel.address}, {hotel.city}
                                                    </div>
                                                </div>
                                                <div className="hotel-price-block">
                                                    <div className="price-from-label">Starting from</div>
                                                    <div className="price-big">৳{minP?.toLocaleString() ?? '—'}</div>
                                                    <div className="price-night">/night</div>
                                                </div>
                                            </div>

                                            <div className="room-type-tags">
                                                {roomTypes.map(t => (
                                                    <span key={t} className="room-tag">{t}</span>
                                                ))}
                                            </div>

                                            <div className="hotel-desc">{hotel.description}</div>

                                            <div className="hotel-card-footer">
                                                <div className="room-count">
                                                    {hotel.rooms?.length ?? 0} room type{hotel.rooms?.length !== 1 ? 's' : ''} available
                                                </div>
                                                <Link href={`/hotels/${hotel.id}?checkin=${checkin}&checkout=${checkout}&guests=${filters.guests ?? '1'}`} className="btn-view">View Details →</Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
