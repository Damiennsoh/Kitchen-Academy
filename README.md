# Cooking with Chipo — Complete Online Cooking School Platform

A comprehensive mobile-first Progressive Web App (PWA) for "Cooking with Chipo" — Zimbabwe's favorite online cooking school. This is the complete merged application containing all features from the original development.

## Complete Features

### Foundation
- ✅ Next.js 14 App Router with TypeScript
- ✅ Mobile-first responsive design (Tailwind CSS)
- ✅ Supabase integration (PostgreSQL, Auth, Storage)
- ✅ Phone OTP + Email magic link authentication
- ✅ Database schema with Row Level Security (RLS)
- ✅ Public landing page with class previews
- ✅ Class listing page (fetches from Supabase)
- ✅ Student registration form
- ✅ Mobile-responsive navbar with hamburger menu

### Dashboard & Payments
- ✅ **Student Dashboard** — Class history, payments, certificates, PDFs
- ✅ **Admin CRM Dashboard** — Full student management, bulk messaging
- ✅ **"Click to Send" WhatsApp** — Bulk messaging via Ultramsg API
- ✅ **"Click to Send" Email** — Bulk email via Brevo API
- ✅ **Mark Attendance & Issue Certificates** — One-click actions
- ✅ **Payment Integration** — Paynow (EcoCash) + Selar (Card/USD)
- ✅ **Auth Middleware** — Route protection

### E-Commerce & Affiliate
- ✅ **Rosella Shop** — Spice catalog, recipe kits, merchandise
- ✅ **Shopping Cart** — Session-based cart with quantity controls
- ✅ **Checkout** — EcoCash + Card payment flows
- ✅ **Certificate PDF Generation** — Branded HTML certificates
- ✅ **Affiliate Program** — 10% commission, referral tracking
- ✅ **Analytics Dashboard** — Revenue charts, registration trends

### PWA & Advanced Features
- ✅ **Progressive Web App (PWA)** — Installable on phones, works offline
- ✅ **Service Worker** — Caches pages for offline access
- ✅ **Offline Page** — Graceful offline experience
- ✅ **Dark Mode** — Toggle between light/dark/system themes
- ✅ **AI Chatbot Widget** — Floating assistant for classes, spices, payments
- ✅ **Push Notifications** — Browser push notification support
- ✅ **Scheduled Reminders** — Auto-send WhatsApp/Email before classes
- ✅ **Data Export** — Download CSVs of students, registrations, orders
- ✅ **PWA Install Button** — Prompt users to install the app

## Quick Start

```bash
# 1. Enter project directory
cd chipos-kitchen-platform-merged

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in your Supabase, Paynow, Ultramsg, Brevo keys

# 4. Run migrations in Supabase SQL Editor (in order):
#    001_initial_schema.sql
#    002_ecommerce_schema.sql
#    003_pwa_schema.sql

# 5. Enable Phone Auth in Supabase
#    Authentication → Providers → Phone → Enable

# 6. Start development
npm run dev
# Open http://localhost:3000
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payments
PAYNOW_INTEGRATION_ID=your-paynow-id
PAYNOW_INTEGRATION_KEY=your-paynow-key
SELAR_API_KEY=your-selar-key

# Messaging
ULTRAMSG_INSTANCE_ID=your-ultramsg-instance
ULTRAMSG_TOKEN=your-ultramsg-token
BREVO_API_KEY=your-brevo-key

# App
NEXT_PUBLIC_APP_NAME="Cooking with Chipo"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (PWA + Dark Mode + Chatbot)
│   ├── globals.css               # Styles (dark mode support)
│   ├── offline/page.tsx          # Offline fallback page
│   ├── auth/                     # Login/Register
│   ├── classes/                  # Class listing
│   ├── register/                 # Class registration
│   ├── dashboard/                # Student dashboard
│   ├── admin/                    # Admin CRM + Analytics + Export
│   ├── shop/                     # E-commerce
│   │   ├── page.tsx              # Product catalog
│   │   └── cart/page.tsx         # Shopping cart
│   ├── affiliate/                # Referral program
│   └── api/                      # API routes
│       ├── send-whatsapp/        # Bulk WhatsApp
│       ├── send-email/           # Bulk Email
│       ├── certificates/generate/# Certificate PDF
│       ├── affiliate/track/       # Referral tracking
│       ├── push/                 # Push notifications
│       ├── reminders/            # Scheduled reminders
│       ├── export/               # Data export (CSV/JSON)
│       ├── chatbot/              # AI chatbot
│       └── paynow/               # EcoCash payments
├── components/
│   ├── Navbar.tsx                # Nav + Dark Mode + PWA Install
│   ├── Footer.tsx
│   ├── chatbot/ChatbotWidget.tsx # Floating AI assistant
│   └── analytics/AnalyticsDashboard.tsx
├── context/
│   └── ThemeContext.tsx           # Dark mode provider
├── lib/
│   ├── supabase.ts               # Supabase clients
│   └── utils.ts                  # Helpers
├── types/
│   └── index.ts                  # TypeScript interfaces
├── middleware.ts                 # Auth protection
└── public/
    ├── manifest.json             # PWA manifest
    ├── sw.js                     # Service worker
    ├── icon-192.png              # PWA icon (192x192)
    └── icon-512.png              # PWA icon (512x512)
```

## Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with class previews |
| Classes | `/classes` | Browse and register for classes |
| Shop | `/shop` | Buy Rosella spices & merchandise |
| Cart | `/shop/cart` | Manage cart and checkout |
| Auth | `/auth` | Phone OTP or Email login |
| Dashboard | `/dashboard` | Student's class history |
| Admin | `/admin` | Chipo's CRM + Analytics |
| Affiliate | `/affiliate` | Referral program |

## Key Features Guide

### PWA (Install as Mobile App)
1. Open the site on your phone
2. Tap "Install App" button in navbar (or use browser "Add to Home Screen")
3. App works offline — cached pages load without internet

### Dark Mode
- Click the 🌙/☀️ icon in the navbar
- Persists across sessions
- System preference respected by default

### AI Chatbot
- Floating chat button (bottom-right)
- Ask about: classes, spices, payments, certificates, affiliates
- Quick action buttons for navigation
- **Production upgrade:** Replace rule-based logic with OpenAI GPT API

### Scheduled Reminders
- Automatically scheduled when a class is created:
  - 24 hours before: "Get your ingredients ready!"
  - 1 hour before: "Class starts soon!"
- Triggered by cron job calling `GET /api/reminders/trigger`
- Can be scheduled manually via `POST /api/reminders/schedule`

### Data Export
- Admin dashboard has "Export" buttons
- Download CSVs: Students, Registrations, Orders
- Also available as JSON via `?format=json`

### Push Notifications
- Students can subscribe to browser push
- Send class reminders, new class alerts, shop promotions
- Requires VAPID keys for production

## Payment Flows

### EcoCash (Zimbabwe)
```
Student clicks "Pay with EcoCash"
  → /api/paynow/initiate creates payment
  → Student receives USSD prompt
  → Enters PIN on phone
  → Paynow webhook → /api/paynow/callback
  → Registration marked PAID
  → WhatsApp confirmation sent
```

### Card / USD / Diaspora
```
Student clicks "Pay with Card"
  → Redirect to Selar checkout
  → Payment processed
  → Webhook updates order status
```

## Affiliate Flow
```
Student joins affiliate program → Gets unique code (e.g., CHIPO-A1B2C3)
  → Shares link: cookingwithchipo.com/auth?ref=CHIPO-A1B2C3
  → Friend clicks link → Signs up
  → /api/affiliate/track records referral
  → Friend makes first purchase
  → 10% commission credited to affiliate
```

## Admin Dashboard Guide

1. **Analytics Tab** — View revenue charts, registration trends, daily stats
2. **Registrations Tab** — Manage students, send messages, mark attendance
3. **Students Tab** — Full student directory
4. **Classes Tab** — Class overview with counts
5. **Messages Tab** — History of all communications

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/send-whatsapp` | Bulk WhatsApp messages |
| POST | `/api/send-email` | Bulk email messages |
| POST | `/api/certificates/generate` | Generate certificate PDF |
| POST | `/api/affiliate/track` | Track referral signup |
| POST | `/api/push` | Subscribe to push notifications |
| POST | `/api/reminders/schedule` | Schedule class reminders |
| GET | `/api/reminders/trigger` | Trigger due reminders (cron) |
| GET | `/api/export?type=...&format=csv` | Export data |
| POST | `/api/chatbot` | AI chatbot response |
| POST | `/api/paynow/initiate` | Start EcoCash payment |
| POST | `/api/paynow/callback` | Paynow webhook |

## Database Migrations (Run in Order)

1. `001_initial_schema.sql` — Foundation (students, classes, registrations, etc.)
2. `002_ecommerce_schema.sql` — E-commerce & affiliate (products, orders, affiliates)
3. `003_pwa_schema.sql` — PWA & automation (push subs, reminders, chatbot log)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Payments | Paynow (EcoCash), Selar (Card/USD) |
| Messaging | Ultramsg (WhatsApp), Brevo (Email) |
| PWA | Service Worker, Web Manifest, Push API |
| AI | Rule-based (upgradeable to OpenAI GPT) |

## Business Logic Summary

This platform serves as a comprehensive cooking school management system with the following core business flows:

1. **Class Discovery & Registration**: Students browse available cooking classes, view details, and register with their contact information
2. **Payment Processing**: Multiple payment options including EcoCash (local) and card payments (international)
3. **Student Management**: Admin can track registrations, mark attendance, and issue certificates
4. **Communication**: Bulk WhatsApp and email messaging for class reminders and updates
5. **E-commerce**: Integrated shop for selling spices, recipe kits, and merchandise
6. **Affiliate Marketing**: Referral program with commission tracking for student growth
7. **Analytics**: Comprehensive dashboard for tracking revenue, registrations, and engagement
8. **Mobile Experience**: PWA capabilities for offline access and mobile app-like experience

## Development Notes

- This is a merged application combining 4 original parts into a single cohesive platform
- All database migrations are included and should be run in sequential order
- The application uses Supabase for backend services including authentication, database, and storage
- Payment integration uses Paynow for Zimbabwe EcoCash and Selar for international card payments
- WhatsApp messaging is handled via Ultramsg API
- Email services are provided by Brevo (Sendinblue)
- The PWA features require proper icon files (icon-192.png and icon-512.png) to be added to the public folder

## License

This project is proprietary and confidential property of Cooking with Chipo.
