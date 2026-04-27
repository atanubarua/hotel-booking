import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function FindBooking() {
    const { props } = usePage<{ flash: { error?: string } }>();
    const { data, setData, post, processing, errors } = useForm({
        confirmation_code: '',
        guest_email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/find-booking');
    };

    return (
        <>
            <Head title="Find My Booking" />
            <link rel="preconnect" href="https://fonts.bunny.net" />
            <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800" rel="stylesheet" />
            <style>{`
                * { box-sizing: border-box; }
                body { margin: 0; font-family: 'Instrument Sans', sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%); color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; }
                .page { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
                .card { width: 100%; max-width: 440px; background: white; border: 1px solid rgba(148,163,184,0.2); border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15,23,42,0.08); padding: 36px; }
                h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1; font-weight: 800; }
                p { margin: 0 0 28px; color: #64748b; font-size: 15px; line-height: 1.6; }
                .form-group { margin-bottom: 20px; }
                label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
                input { width: 100%; padding: 14px 16px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 16px; font-family: inherit; transition: all 0.2s; background: #f8fafc; }
                input:focus { outline: none; border-color: #0f766e; background: white; box-shadow: 0 0 0 3px rgba(15,118,110,0.1); }
                .error { color: #dc2626; font-size: 13px; margin-top: 6px; font-weight: 500; }
                .alert { background: #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
                .btn { display: block; width: 100%; padding: 16px; background: #0f766e; color: white; border: none; border-radius: 14px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; text-align: center; font-family: inherit; }
                .btn:hover:not(:disabled) { background: #0d645e; transform: translateY(-1px); }
                .btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .back-link { display: inline-flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px; font-weight: 600; text-decoration: none; margin-bottom: 24px; transition: color 0.2s; }
                .back-link:hover { color: #0f172a; }
            `}</style>

            <div className="page">
                <div className="card">
                    <Link href="/" className="back-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back to Home
                    </Link>
                    
                    <h1>Find My Booking</h1>
                    <p>Enter your confirmation code and email address to manage your reservation.</p>

                    {(errors.guest_email || props.flash.error) && <div className="alert">{errors.guest_email || props.flash.error}</div>}

                    <form onSubmit={submit}>
                        <div className="form-group">
                            <label htmlFor="confirmation_code">Confirmation Code</label>
                            <input
                                id="confirmation_code"
                                type="text"
                                name="confirmation_code"
                                value={data.confirmation_code}
                                onChange={(e) => setData('confirmation_code', e.target.value.toUpperCase())}
                                placeholder="e.g. HBD-A1B2C3"
                                required
                            />
                            {errors.confirmation_code && <div className="error">{errors.confirmation_code}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="guest_email">Email Address</label>
                            <input
                                id="guest_email"
                                type="email"
                                name="guest_email"
                                value={data.guest_email}
                                onChange={(e) => setData('guest_email', e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <button type="submit" className="btn" disabled={processing}>
                            {processing ? 'Searching...' : 'Find Booking'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
