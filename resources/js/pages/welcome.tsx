import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, FormEvent } from 'react';
import { dashboard, login, register } from '@/routes';

interface HotelImage {
    id: number;
    path: string;
    order: number;
}

interface Room {
    id: number;
    name: string;
    type: string;
    capacity: number;
    price_per_night: number;
    status: string;
}

interface Hotel {
    id: number;
    name: string;
    address: string;
    city: string;
    country: string;
    star_rating: number;
    description: string;
    status: string;
    images: HotelImage[];
    rooms: Room[];
    rooms_min_price_per_night: number | null;
}

interface WelcomeProps {
    hotels: Hotel[];
    filters: {
        location?: string;
        checkin?: string;
        checkout?: string;
        guests?: string;
    };
    canRegister?: boolean;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <svg
                    key={i}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={i < rating ? '#F59E0B' : '#D1D5DB'}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </div>
    );
}

const destinations = [
    { city: "Cox's Bazar", label: "Cox's Bazar", emoji: '🏖️', subtitle: 'World\'s Longest Beach' },
    { city: 'Dhaka', label: 'Dhaka', emoji: '🏙️', subtitle: 'Capital City' },
    { city: 'Sylhet', label: 'Sylhet', emoji: '🌿', subtitle: 'Tea Garden Paradise' },
    { city: 'Chittagong', label: 'Chittagong', emoji: '⚓', subtitle: 'Port City' },
    { city: 'Sreemangal', label: 'Sreemangal', emoji: '🍃', subtitle: 'Tea Capital' },
    { city: 'Sundarbans', label: 'Sundarbans', emoji: '🐅', subtitle: 'Mangrove Forest' },
];

const getToday = () => new Date().toISOString().split('T')[0];
const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

export default function Welcome({ hotels = [], filters = {}, canRegister = true }: WelcomeProps) {
    const { auth } = usePage<{ auth: { user: { name: string } | null } }>().props;

    const [location, setLocation] = useState(filters.location ?? '');
    const [checkin, setCheckin] = useState(filters.checkin || getToday());
    const [checkout, setCheckout] = useState(filters.checkout || getTomorrow());
    const [guests, setGuests] = useState(filters.guests ?? '1');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/hotels/search', { location, checkin, checkout, guests });
    };

    const handleDestinationClick = (city: string) => {
        if (!checkin || !checkout) {
            alert('Please select your Check-in and Check-out dates before searching a destination.');
            return;
        }
        setLocation(city);
        router.get('/hotels/search', { location: city, checkin, checkout, guests });
    };

    return (
        <>
            <Head title="HotelBD — Find Your Perfect Stay">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>{`
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #1E293B; }
                    :root {
                        --primary: #003580;
                        --primary-light: #0057B8;
                        --accent: #FF9900;
                        --accent-hover: #E68A00;
                        --text-muted: #64748B;
                        --border: #E2E8F0;
                        --card-shadow: 0 2px 12px rgba(0,0,0,0.08);
                        --card-shadow-hover: 0 8px 32px rgba(0,0,0,0.16);
                    }

                    /* Navbar */
                    .navbar {
                        background: var(--primary);
                        padding: 0 24px;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }
                    .navbar-inner {
                        max-width: 1200px;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        height: 64px;
                    }
                    .navbar-logo {
                        font-size: 24px;
                        font-weight: 800;
                        color: #fff;
                        text-decoration: none;
                        letter-spacing: -0.5px;
                    }
                    .navbar-logo span { color: var(--accent); }
                    .navbar-links { display: flex; gap: 8px; align-items: center; }
                    .btn-ghost {
                        color: #fff;
                        background: transparent;
                        border: 1.5px solid rgba(255,255,255,0.4);
                        padding: 8px 18px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        text-decoration: none;
                        transition: all 0.2s;
                    }
                    .btn-ghost:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.7); }
                    .btn-accent {
                        background: var(--accent);
                        color: #1E293B;
                        border: none;
                        padding: 8px 18px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        text-decoration: none;
                        transition: all 0.2s;
                    }
                    .btn-accent:hover { background: var(--accent-hover); transform: translateY(-1px); }

                    /* Hero */
                    .hero {
                        background: linear-gradient(135deg, #002a6b 0%, #003580 40%, #0056a6 100%);
                        padding: 64px 24px 80px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    .hero::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -10%;
                        width: 60%;
                        height: 200%;
                        background: radial-gradient(ellipse, rgba(255,153,0,0.08) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hero::after {
                        content: '';
                        position: absolute;
                        bottom: -30px;
                        right: 5%;
                        width: 400px;
                        height: 400px;
                        background: radial-gradient(ellipse, rgba(0,87,184,0.3) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hero-tag {
                        display: inline-block;
                        background: rgba(255,153,0,0.15);
                        border: 1px solid rgba(255,153,0,0.4);
                        color: var(--accent);
                        font-size: 12px;
                        font-weight: 600;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        padding: 5px 14px;
                        border-radius: 20px;
                        margin-bottom: 16px;
                    }
                    .hero h1 {
                        font-size: clamp(28px, 5vw, 52px);
                        font-weight: 800;
                        color: #fff;
                        line-height: 1.15;
                        margin-bottom: 14px;
                        letter-spacing: -1px;
                    }
                    .hero h1 em { color: var(--accent); font-style: normal; }
                    .hero p {
                        color: rgba(255,255,255,0.75);
                        font-size: 17px;
                        margin-bottom: 36px;
                        max-width: 520px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    /* Search Box */
                    .search-box {
                        background: #fff;
                        border-radius: 16px;
                        padding: 20px 24px;
                        max-width: 900px;
                        margin: 0 auto;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
                        position: relative;
                        z-index: 2;
                    }
                    .search-form {
                        display: grid;
                        grid-template-columns: 2fr 1fr 1fr 0.8fr auto;
                        gap: 12px;
                        align-items: end;
                    }
                    @media (max-width: 768px) {
                        .search-form { grid-template-columns: 1fr; }
                    }
                    .search-field label {
                        display: block;
                        font-size: 11px;
                        font-weight: 600;
                        color: var(--text-muted);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 6px;
                    }
                    .search-field input {
                        width: 100%;
                        border: 2px solid var(--border);
                        border-radius: 8px;
                        padding: 11px 14px;
                        font-size: 15px;
                        font-family: 'Inter', sans-serif;
                        color: #1E293B;
                        transition: border-color 0.2s, box-shadow 0.2s;
                        background: #FAFBFC;
                        outline: none;
                    }
                    .search-field input:focus {
                        border-color: var(--primary-light);
                        background: #fff;
                        box-shadow: 0 0 0 3px rgba(0,87,184,0.1);
                    }
                    .btn-search {
                        background: var(--accent);
                        color: #1E293B;
                        border: none;
                        border-radius: 8px;
                        padding: 13px 28px;
                        font-size: 15px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                        white-space: nowrap;
                        font-family: 'Inter', sans-serif;
                    }
                    .btn-search:hover { background: var(--accent-hover); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,153,0,0.4); }

                    /* Stats Bar */
                    .stats-bar {
                        background: #fff;
                        border-bottom: 1px solid var(--border);
                        padding: 20px 24px;
                    }
                    .stats-inner {
                        max-width: 1200px;
                        margin: 0 auto;
                        display: flex;
                        justify-content: center;
                        gap: 48px;
                        flex-wrap: wrap;
                    }
                    .stat-item { text-align: center; }
                    .stat-number { font-size: 22px; font-weight: 800; color: var(--primary); line-height: 1; }
                    .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 3px; font-weight: 500; }

                    /* Section */
                    .section { padding: 60px 24px; max-width: 1200px; margin: 0 auto; }
                    .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
                    .section-title { font-size: 26px; font-weight: 800; color: #1E293B; letter-spacing: -0.5px; }
                    .section-sub { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
                    .view-all-link { color: var(--primary-light); font-size: 14px; font-weight: 600; text-decoration: none; }
                    .view-all-link:hover { text-decoration: underline; }

                    /* Hotel Grid */
                    .hotel-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 24px;
                    }

                    /* Hotel Card */
                    .hotel-card {
                        background: #fff;
                        border-radius: 14px;
                        overflow: hidden;
                        box-shadow: var(--card-shadow);
                        transition: all 0.3s ease;
                        border: 1px solid var(--border);
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                    }
                    .hotel-card:hover {
                        box-shadow: var(--card-shadow-hover);
                        transform: translateY(-4px);
                    }
                    .hotel-img-wrapper {
                        position: relative;
                        height: 200px;
                        overflow: hidden;
                    }
                    .hotel-img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.4s ease;
                    }
                    .hotel-card:hover .hotel-img { transform: scale(1.06); }
                    .hotel-badge {
                        position: absolute;
                        top: 12px;
                        left: 12px;
                        background: rgba(0,53,128,0.92);
                        color: #fff;
                        font-size: 11px;
                        font-weight: 700;
                        padding: 4px 10px;
                        border-radius: 6px;
                        letter-spacing: 0.3px;
                    }
                    .hotel-badge-deal {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        background: #16A34A;
                        color: #fff;
                        font-size: 10px;
                        font-weight: 700;
                        padding: 4px 8px;
                        border-radius: 6px;
                        letter-spacing: 0.3px;
                    }
                    .hotel-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
                    .hotel-meta { display: flex; align-items: center; justify-content: space-between; }
                    .hotel-name { font-size: 17px; font-weight: 700; color: #1E293B; line-height: 1.3; }
                    .hotel-location {
                        color: var(--text-muted);
                        font-size: 13px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .hotel-desc {
                        color: #475569;
                        font-size: 13px;
                        line-height: 1.6;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .hotel-footer {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-top: auto;
                        padding-top: 12px;
                        border-top: 1px solid var(--border);
                    }
                    .hotel-price-from { font-size: 11px; color: var(--text-muted); font-weight: 500; }
                    .hotel-price { font-size: 22px; font-weight: 800; color: var(--primary); line-height: 1; }
                    .hotel-price span { font-size: 13px; font-weight: 500; color: var(--text-muted); }
                    .btn-book {
                        background: var(--primary);
                        color: #fff;
                        border: none;
                        border-radius: 8px;
                        padding: 9px 20px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        text-decoration: none;
                        transition: all 0.2s;
                        font-family: 'Inter', sans-serif;
                        display: inline-block;
                    }
                    .btn-book:hover { background: var(--primary-light); transform: translateY(-1px); }

                    /* Empty State */
                    .empty-state {
                        text-align: center;
                        padding: 80px 24px;
                        color: var(--text-muted);
                    }
                    .empty-state-icon { font-size: 64px; margin-bottom: 16px; }
                    .empty-state h3 { font-size: 20px; font-weight: 700; color: #374151; margin-bottom: 8px; }
                    .empty-state p { font-size: 15px; }

                    /* Destinations */
                    .dest-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                        gap: 16px;
                    }
                    .dest-card {
                        background: #fff;
                        border: 2px solid var(--border);
                        border-radius: 14px;
                        padding: 24px 16px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .dest-card:hover {
                        border-color: var(--primary-light);
                        background: #EFF6FF;
                        transform: translateY(-3px);
                        box-shadow: var(--card-shadow);
                    }
                    .dest-emoji { font-size: 36px; margin-bottom: 10px; }
                    .dest-name { font-size: 15px; font-weight: 700; color: #1E293B; }
                    .dest-sub { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

                    /* Features */
                    .features-section {
                        background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
                        padding: 60px 24px;
                    }
                    .features-inner { max-width: 1200px; margin: 0 auto; }
                    .features-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 24px;
                        margin-top: 36px;
                    }
                    .feature-card {
                        background: #fff;
                        border-radius: 14px;
                        padding: 28px 24px;
                        box-shadow: var(--card-shadow);
                        text-align: center;
                        transition: all 0.3s;
                    }
                    .feature-card:hover { box-shadow: var(--card-shadow-hover); transform: translateY(-4px); }
                    .feature-icon {
                        font-size: 40px;
                        margin-bottom: 14px;
                    }
                    .feature-title { font-size: 17px; font-weight: 700; color: #1E293B; margin-bottom: 8px; }
                    .feature-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

                    /* Footer */
                    .footer {
                        background: #0C1A2E;
                        color: rgba(255,255,255,0.7);
                        padding: 48px 24px 32px;
                    }
                    .footer-inner {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .footer-top {
                        display: grid;
                        grid-template-columns: 2fr 1fr 1fr;
                        gap: 40px;
                        padding-bottom: 40px;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    @media (max-width: 640px) {
                        .footer-top { grid-template-columns: 1fr; }
                    }
                    .footer-brand { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 10px; }
                    .footer-brand span { color: var(--accent); }
                    .footer-desc { font-size: 14px; line-height: 1.7; max-width: 280px; }
                    .footer-col-title { font-size: 13px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; }
                    .footer-col a { display: block; font-size: 14px; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
                    .footer-col a:hover { color: #fff; }
                    .footer-bottom {
                        padding-top: 28px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 12px;
                        font-size: 13px;
                    }

                    /* Highlight on active filter */
                    .filter-active-notice {
                        background: #EFF6FF;
                        border: 1px solid #BFDBFE;
                        color: var(--primary);
                        border-radius: 8px;
                        padding: 10px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                    }
                    .clear-btn {
                        background: none;
                        border: none;
                        color: var(--primary-light);
                        font-weight: 600;
                        font-size: 13px;
                        cursor: pointer;
                        font-family: 'Inter', sans-serif;
                    }
                    .clear-btn:hover { text-decoration: underline; }
                `}</style>
            </Head>

            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-inner">
                    <a href="/" className="navbar-logo">Hotel<span>BD</span></a>
                    <div className="navbar-links">
                        {auth.user ? (
                            <Link href={dashboard()} className="btn-accent">Dashboard</Link>
                        ) : (
                            <>
                                <Link href={login()} className="btn-ghost">Log in</Link>
                                {canRegister && (
                                    <Link href={register()} className="btn-accent">Register</Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-tag">🏨 Bangladesh's #1 Hotel Booking</div>
                <h1>Find Your <em>Perfect</em><br />Hotel Stay</h1>
                <p>Discover the best hotels across Bangladesh at unbeatable prices. Book instantly, travel freely.</p>

                <div className="search-box">
                    <form className="search-form" onSubmit={handleSearch}>
                        <div className="search-field">
                            <label htmlFor="location">📍 City, Destination, or Hotel Name</label>
                            <input
                                id="location"
                                type="text"
                                placeholder="Where are you going?"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                        </div>
                        <div className="search-field">
                            <label htmlFor="checkin">📅 Check-in</label>
                            <input
                                id="checkin"
                                type="date"
                                value={checkin}
                                onChange={(e) => setCheckin(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="search-field">
                            <label htmlFor="checkout">📅 Check-out</label>
                            <input
                                id="checkout"
                                type="date"
                                value={checkout}
                                onChange={(e) => setCheckout(e.target.value)}
                                min={checkin || new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="search-field">
                            <label htmlFor="guests">👥 Guests</label>
                            <input
                                id="guests"
                                type="number"
                                min="1"
                                max="20"
                                placeholder="1"
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-search">Search</button>
                    </form>
                </div>
            </section>

            {/* Stats */}
            <div className="stats-bar">
                <div className="stats-inner">
                    <div className="stat-item">
                        <div className="stat-number">500+</div>
                        <div className="stat-label">Hotels Available</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">64</div>
                        <div className="stat-label">Districts Covered</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">50K+</div>
                        <div className="stat-label">Happy Guests</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">4.8★</div>
                        <div className="stat-label">Average Rating</div>
                    </div>
                </div>
            </div>

            {/* Hotels Section */}
            <div className="section">
                <div className="section-header">
                    <div>
                        <div className="section-title">
                            {filters.location
                                ? `Hotels in "${filters.location}"`
                                : 'Featured Hotels'}
                        </div>
                        {!filters.location && (
                            <div className="section-sub">
                                {hotels.length} hand-picked propert{hotels.length === 1 ? 'y' : 'ies'} for you
                            </div>
                        )}
                    </div>
                </div>

                {filters.location && (
                    <div className="filter-active-notice">
                        <span>Showing results for: <strong>{filters.location}</strong></span>
                        <button
                            className="clear-btn"
                            onClick={() => {
                                setLocation('');
                                router.get('/', {}, { preserveState: false });
                            }}
                        >
                            ✕ Clear Filter
                        </button>
                    </div>
                )}

                {hotels.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>No hotels found</h3>
                        <p>Try adjusting your search or browse all destinations below.</p>
                    </div>
                ) : (
                    <div className="hotel-grid">
                        {hotels.map((hotel) => {
                            const heroImage = hotel.images?.[0]?.path;
                            const minPrice = hotel.rooms_min_price_per_night ?? hotel.rooms?.[0]?.price_per_night;
                            const isTopRated = hotel.star_rating >= 4;

                            return (
                                <div 
                                    key={hotel.id} 
                                    className="hotel-card"
                                    onClick={() => router.get(`/hotels/${hotel.id}`, { checkin, checkout, guests })}
                                >
                                    <div className="hotel-img-wrapper">
                                        {heroImage ? (
                                            <img
                                                className="hotel-img"
                                                src={heroImage}
                                                alt={hotel.name}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                background: 'linear-gradient(135deg, #003580, #0056a6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '48px',
                                            }}>
                                                🏨
                                            </div>
                                        )}
                                        <div className="hotel-badge">{hotel.star_rating} Star</div>
                                        {isTopRated && <div className="hotel-badge-deal">✓ Top Rated</div>}
                                    </div>

                                    <div className="hotel-body">
                                        <div className="hotel-meta">
                                            <StarRating rating={hotel.star_rating} />
                                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                                                {hotel.rooms?.length ?? 0} room types
                                            </span>
                                        </div>
                                        <div className="hotel-name">{hotel.name}</div>
                                        <div className="hotel-location">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                            {hotel.city}, {hotel.country}
                                        </div>
                                        <div className="hotel-desc">{hotel.description}</div>

                                        <div className="hotel-footer">
                                            <div>
                                                <div className="hotel-price-from">Starting from</div>
                                                <div className="hotel-price">
                                                    ৳{minPrice?.toLocaleString() ?? '—'}<span>/night</span>
                                                </div>
                                            </div>
                                            <Link href={`/hotels/${hotel.id}?checkin=${checkin}&checkout=${checkout}&guests=${guests}`} className="btn-book">View Details</Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Popular Destinations */}
            <div style={{ background: '#F1F5F9', padding: '60px 24px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="section-header">
                        <div>
                            <div className="section-title">Popular Destinations</div>
                            <div className="section-sub">Explore Bangladesh's most sought-after getaways</div>
                        </div>
                    </div>
                    <div className="dest-grid">
                        {destinations.map((dest) => (
                            <div
                                key={dest.city}
                                className="dest-card"
                                onClick={() => handleDestinationClick(dest.city)}
                            >
                                <div className="dest-emoji">{dest.emoji}</div>
                                <div className="dest-name">{dest.label}</div>
                                <div className="dest-sub">{dest.subtitle}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Why Choose Us */}
            <section className="features-section">
                <div className="features-inner">
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <div className="section-title">Why Choose HotelBD?</div>
                        <div className="section-sub" style={{ marginTop: '8px' }}>We make every stay unforgettable</div>
                    </div>
                    <div className="features-grid">
                        {[
                            { icon: '🔒', title: 'Secure Payments', desc: 'Your transactions are 100% encrypted and protected by our advanced security system.' },
                            { icon: '🏷️', title: 'Best Price Guarantee', desc: 'Found it cheaper elsewhere? We\'ll match the price. No questions asked.' },
                            { icon: '🕐', title: '24/7 Support', desc: 'Our customer support team is available around the clock to help with anything.' },
                            { icon: '✅', title: 'Free Cancellation', desc: 'Plans change. Cancel for free up to 24 hours before check-in on most bookings.' },
                            { icon: '⚡', title: 'Instant Confirmation', desc: 'Receive an instant booking confirmation. No waiting, no uncertainty.' },
                            { icon: '🌟', title: 'Verified Reviews', desc: 'All reviews are from real guests who have completed their stay with us.' },
                        ].map((feature) => (
                            <div key={feature.title} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <div className="feature-title">{feature.title}</div>
                                <div className="feature-desc">{feature.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-inner">
                    <div className="footer-top">
                        <div>
                            <div className="footer-brand">Hotel<span>BD</span></div>
                            <div className="footer-desc">
                                Bangladesh's leading online hotel booking platform. Find and book the best hotels
                                at the best prices, from the serene tea gardens of Sylhet to the beaches of Cox's Bazar.
                            </div>
                        </div>
                        <div className="footer-col">
                            <div className="footer-col-title">Company</div>
                            <a href="#">About Us</a>
                            <a href="#">Careers</a>
                            <a href="#">Press</a>
                            <a href="#">Blog</a>
                        </div>
                        <div className="footer-col">
                            <div className="footer-col-title">Support</div>
                            <Link href="/find-booking">Find My Booking</Link>
                            <a href="#">Help Center</a>
                            <a href="#">Cancellation</a>
                            <a href="#">Safety</a>
                            <a href="#">Contact Us</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span>© 2026 HotelBD. All rights reserved.</span>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '13px' }}>Privacy Policy</a>
                            <a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '13px' }}>Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
