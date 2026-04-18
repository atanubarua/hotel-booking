# 🏨 Hotel Booking Platform

A full-featured, multi-role hotel booking platform built with **Laravel 12**, **React 19**, and **Inertia.js**. Inspired by industry leaders like Booking.com and OYO Rooms, it provides a polished end-to-end experience — from hotel discovery and room selection to Stripe-powered online payments with double-booking protection.

---

## ✨ Features

### 🌐 Client Portal
- **Premium Home Page** — Hero search bar, featured hotel listings, destination highlights, and a full footer
- **Advanced Search & Filtering** — Search by location, check-in / check-out dates, and guest count with mandatory validation
- **Hotel Detail Page** — Interactive image gallery, room availability filtered by selected dates, room card animations
- **Multi-step Booking Flow** — Guest-checkout support (no account required), special requests, and guest details
- **Pay Now Page** — Stripe Elements integration with real-time card validation
- **Booking Confirmation** — Unique `HBD-XXXXXX` confirmation codes with full booking summary

### 🧑‍💼 Admin Panel
- **Dashboard** — Platform-wide stats (hotels, rooms, bookings, revenue)
- **User Management** — List all users, view partner hotels
- **Hotel Management** — Full CRUD with multi-image upload and ordering
- **Room Management** — Full CRUD with multi-image upload and dynamic price rules
- **Bookings Overview** — View all platform bookings with status and payment info
- **Stripe Setup Check** — Verify Stripe keys are configured correctly

### 🏢 Partner Portal
- **Dashboard** — Partner-scoped stats for their own hotels
- **Hotel Management** — Partners manage only their own hotels and images
- **Room Management** — Partners manage only their own rooms, images, and pricing

### 💳 Payments & Booking Engine
- **Stripe Integration** — Custom `StripeGateway` service (no SDK dependency) using Laravel's HTTP client
- **Concurrency-Safe Booking** — Pessimistic DB locking (`lockForUpdate`) prevents double-booking races
- **Payment Hold System** — Rooms are held for a configurable window (default 15 min) awaiting payment
- **Stripe Webhooks** — `payment_intent.succeeded` and `payment_intent.payment_failed` handled with signature verification and idempotent event processing
- **Automatic Expiry** — Expired pending bookings released via queued jobs
- **3D Secure** — Automatic 3DS challenge support via Stripe

### 💰 Dynamic Pricing Engine
- **Price Rules** — Per-room rules with date ranges, day-of-week targeting, priority, and stackability
- **Season Types** — Peak / off-peak season pricing
- **Adjustment Types** — Flat or percentage price adjustments

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | PHP 8.2+, Laravel 12 |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4 |
| **Full-Stack Bridge** | Inertia.js v2, Laravel Wayfinder |
| **Auth** | Laravel Fortify (2FA ready) |
| **Payments** | Stripe (custom gateway, no SDK) |
| **UI Components** | shadcn/ui, Radix UI primitives, Lucide React |
| **Queue** | Laravel Database Queue |
| **Testing** | Pest PHP |
| **Build Tool** | Vite 7 |
| **Database** | SQLite (default) / MySQL / PostgreSQL |
| **Code Quality** | Laravel Pint, ESLint, Prettier |

---

## 📂 Project Structure

```
hotel-booking/
├── app/
│   ├── Actions/              # Single-responsibility action classes
│   ├── Console/              # Artisan commands
│   ├── Enums/
│   │   └── Role.php          # admin | partner | customer
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/        # AdminController, HotelController, AdminRoomController
│   │   │   ├── Partner/      # PartnerController, PartnerHotelController, PartnerRoomController
│   │   │   ├── BookingController.php   # Full booking + payment + webhook flow
│   │   │   ├── HomeController.php
│   │   │   └── SearchController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureAdmin.php
│   │   │   ├── EnsurePartner.php
│   │   │   └── PreventAdminFromDashboard.php
│   │   └── Requests/
│   ├── Jobs/
│   │   └── HotelRegistrationJob.php
│   ├── Mail/
│   │   └── PartnerWelcomeMail.php
│   ├── Models/
│   │   ├── Booking.php       # Conflict detection, hold logic, scopes
│   │   ├── Hotel.php
│   │   ├── HotelImage.php
│   │   ├── Room.php
│   │   ├── RoomImage.php
│   │   ├── RoomPriceRule.php # Dynamic pricing engine
│   │   ├── StripeWebhookEvent.php
│   │   └── User.php
│   └── Services/
│       └── StripeGateway.php  # Custom Stripe HTTP client
├── database/
│   ├── migrations/            # 18 migrations
│   └── seeders/               # Admin, hotel, room, and image seeders
├── resources/js/
│   ├── layouts/               # app, admin, partner, auth layouts
│   ├── pages/
│   │   ├── welcome.tsx        # Home / landing page
│   │   ├── hotels/            # search.tsx, show.tsx
│   │   ├── bookings/          # create.tsx, pay.tsx, confirmation.tsx
│   │   ├── admin/             # dashboard, users, hotels, rooms, bookings
│   │   └── partner/           # dashboard, hotels, rooms
│   └── components/
└── routes/
    ├── web.php
    └── settings.php
```

---

## 🗄️ Database Schema

```
users               — id, name, email, password, role (admin|partner|customer), 2FA fields
hotels              — id, user_id (partner), name, address, city, country, star_rating, status
hotel_images        — id, hotel_id, path, order
rooms               — id, hotel_id, name, type, capacity, price_per_night, status
room_images         — id, room_id, path, order
room_price_rules    — id, room_id, name, season_type, start_date, end_date, days_of_week,
                      adjustment_type, adjustment_value, priority, is_active, is_stackable
bookings            — id, user_id?, room_id, hotel_id, confirmation_code, guest_name,
                      guest_email, guest_phone, special_requests, check_in, check_out,
                      guests, nights, price_per_night, total_price, status, payment_method,
                      payment_status, stripe_payment_intent_id, payment_intent_attempt,
                      guest_access_token, payment_expires_at, cancelled_at
stripe_webhook_events — id, stripe_event_id, payload, processed_at
```

---

## 🚀 Getting Started

### Prerequisites

- **PHP** >= 8.2
- **Composer** >= 2.x
- **Node.js** >= 20.x & npm
- A [Stripe](https://stripe.com) account (for payment features)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/hotel-booking.git
cd hotel-booking
```

**2. Install PHP dependencies**
```bash
composer install
```

**3. Install JS dependencies**
```bash
npm install
```

**4. Configure your environment**
```bash
cp .env.example .env
php artisan key:generate
```

**5. Set up the database**
```bash
# SQLite (default — no extra config needed)
touch database/database.sqlite

php artisan migrate
```

**6. Seed demo data** *(optional but recommended)*
```bash
php artisan db:seed --class=AdminUserSeeder
php artisan db:seed --class=BulkHotelRoomSeeder
```

**7. Configure Stripe** *(required for booking payments)*

Add the following to your `.env`:
```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BOOKING_PAYMENT_HOLD_MINUTES=15
```

**8. Start the development server**
```bash
composer dev
```

This runs **Laravel**, the **database queue worker**, and **Vite** concurrently.

> Visit **http://localhost:8000**

---

## 👥 User Roles & Credentials

After seeding, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password` |

Additional partner and customer accounts can be created through the admin panel or registration flow.

### Role Capabilities

| Feature | Customer / Guest | Partner | Admin |
|---|:---:|:---:|:---:|
| Browse & search hotels | ✅ | ✅ | ✅ |
| Book rooms (guest checkout) | ✅ | ✅ | ✅ |
| Manage own hotels & rooms | ❌ | ✅ | ✅ |
| View all platform bookings | ❌ | ❌ | ✅ |
| Manage all hotels & users | ❌ | ❌ | ✅ |

---

## 💳 Stripe Webhook Setup

For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:

```bash
stripe listen --forward-to http://localhost:8000/stripe/webhook
```

Copy the webhook signing secret (`whsec_...`) printed by the CLI and set it as `STRIPE_WEBHOOK_SECRET` in your `.env`.

The app handles the following Stripe events:
- `payment_intent.succeeded` — Confirms the booking
- `payment_intent.payment_failed` — Marks payment as failed

---

## 🧪 Running Tests

```bash
php artisan test
# or using Pest directly
./vendor/bin/pest
```

---

## 🎨 Code Quality

```bash
# PHP linting (Laravel Pint)
composer lint

# JS/TS linting (ESLint)
npm run lint

# Code formatting (Prettier)
npm run format

# TypeScript type checking
npm run types:check
```

---

## ⚙️ Configuration Reference

| Variable | Description | Default |
|---|---|---|
| `DB_CONNECTION` | Database driver | `sqlite` |
| `QUEUE_CONNECTION` | Queue driver | `database` |
| `STRIPE_KEY` | Stripe publishable key | — |
| `STRIPE_SECRET` | Stripe secret key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | — |
| `BOOKING_PAYMENT_HOLD_MINUTES` | Time window a room is held awaiting payment | `15` |
| `MAIL_MAILER` | Mail driver (e.g. `smtp`, `log`) | `log` |

---

## 📦 Key Packages

### PHP (Backend)
| Package | Purpose |
|---|---|
| `laravel/framework` v12 | Core framework |
| `inertiajs/inertia-laravel` v2 | Server-side Inertia adapter |
| `laravel/fortify` | Authentication scaffolding + 2FA |
| `laravel/wayfinder` | Type-safe route generation for frontend |

### JavaScript (Frontend)
| Package | Purpose |
|---|---|
| `react` v19 | UI library |
| `@inertiajs/react` v2 | Client-side Inertia adapter |
| `tailwindcss` v4 | Utility-first CSS framework |
| `@radix-ui/*` | Accessible UI primitives |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `class-variance-authority` | Component variant management |

---

## 🔒 Security Highlights

- **CSRF protection** on all state-changing routes (webhooks exempt)
- **Pessimistic locking** (`lockForUpdate`) on room availability checks to prevent race conditions
- **Stripe webhook signature verification** with 5-minute timestamp tolerance
- **Idempotent webhook processing** via `stripe_webhook_events` deduplication table
- **Guest access tokens** for unauthenticated booking management
- **Role-based middleware** (`EnsureAdmin`, `EnsurePartner`) on all protected routes

---

## 🗺️ Roadmap

- [ ] Email notifications for booking confirmation and cancellation
- [ ] Booking cancellation flow with Stripe refunds
- [ ] Reviews and ratings system
- [ ] Calendar-based availability view for partners
- [ ] Multi-currency support

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
