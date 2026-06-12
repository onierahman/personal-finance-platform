<div align="center">

# 💰 FinanceOS

**A mobile-first personal finance platform — track expenses, budgets, savings goals, investments, and net worth in one place.**

[Live Demo](https://financeos-sepia.vercel.app) · [Report a Bug](../../issues) · [Request a Feature](../../issues)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8)

</div>

---

## ✨ Features

### Core
- **Dashboard** — income/expense/savings/investment summary cards, daily overview chart, spending by category, net worth, recent activity, budget health, upcoming bills, and savings goals — all scoped to a switchable month (swipe or arrows, Apple Calendar style)
- **Transactions** — sub-5-second QuickAdd sheet, search & filters, date-grouped list, swipe-to-delete and long-press context menus on mobile, inline editing, CSV/PDF export
- **Budgets** — monthly and annual caps per category with status coloring (safe → warning → danger → over), inline limit editing, automatic `spent_amount` refresh via Postgres triggers
- **Savings Goals** — goal types (emergency fund, vacation, car, house, education, retirement, custom), deadlines with urgency badges, suggested monthly contribution, one-tap contributions
- **Recurring & Bills** — bills, subscriptions, and income streams with frequencies, next-due tracking, overdue/due-soon urgency, and committed-outflow summary
- **Accounts** — bank accounts, cards, and loans with automatic balance sync (DB triggers), assets/liabilities breakdown
- **Investments** — holdings with cost basis, market value, P&L, and asset-type allocation
- **Net Worth** — liquid + portfolio composition with per-account breakdown
- **Analytics** — 5-tab insights (overview, spending, income, budgets, merchants) across 3/6/12-month windows, savings-rate trend, PDF & CSV export

### Import & AI
- **Receipt scanning (OCR)** — snap a receipt, Claude extracts merchant, amount, date, and category
- **CSV import** — flexible column mapping with preview
- **Bank statement import** — presets for 7 banks plus PDF statement parsing

### Notifications
- **In-app notification bell** — budget alerts, weekly digests, import results (auto-expire after 30 days)
- **Email notifications via Gmail OAuth** — connect your Gmail account; tokens encrypted at rest
- **Weekly digest cron** — Vercel Cron fires every Monday 08:00 UTC

### Experience
- **Mobile-first UX** — bottom tab bar, frosted-glass bars, haptic feedback, iOS-style page transitions, pull-to-refresh, swipe gestures, safe-area support
- **Dark / light theme** — one tap, persisted
- **PWA** — installable with standalone display
- **Multi-currency display** — set your default currency (USD, CAD, …) and timezone in Settings

---

## 🧱 Tech Stack

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------- |
| Framework    | [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 |
| Language     | TypeScript 5.8 (strict)                                             |
| Styling      | Tailwind CSS 3.4 + custom design tokens                             |
| Components   | Radix UI primitives + custom component library                      |
| Server state | TanStack React Query 5                                              |
| UI state     | Zustand 5                                                           |
| Backend      | Supabase (Postgres, Auth, RLS, triggers)                            |
| Validation   | Zod + React Hook Form                                               |
| Animation    | Framer Motion 12                                                    |
| Charts       | Recharts                                                            |
| AI           | Anthropic Claude (receipt & statement extraction)                   |
| OCR fallback | Tesseract.js                                                        |
| Export       | jsPDF + autotable, PapaParse                                        |
| Hosting      | Vercel (with Vercel Cron)                                           |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** and npm
- A free [Supabase](https://app.supabase.com) project
- (Optional) [Anthropic API key](https://console.anthropic.com) — receipt/statement AI import
- (Optional) Google Cloud OAuth credentials — Gmail email notifications

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/financeos.git
cd financeos
npm install
```

### 2. Set up the database

In the Supabase Dashboard → **SQL Editor**, run each migration **in order**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_indexes.sql
supabase/migrations/004_triggers.sql
supabase/migrations/005_budget_calculations.sql
supabase/migrations/006_recurring_and_contributions.sql
supabase/migrations/007_notifications.sql
```

Or with the Supabase CLI:

```bash
npx supabase db push
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

| Variable                        | Required    | Purpose                                                                 |
| ------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅          | Supabase project URL                                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅          | Supabase anon (public) key                                               |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅          | Server-only admin key — **never expose to the browser**                  |
| `APP_SECRET`                    | ✅          | HMAC token signing + AES-GCM encryption of stored Gmail tokens. Generate: `openssl rand -base64 48` |
| `CRON_SECRET`                   | ✅          | Authorizes the weekly-digest cron endpoint                               |
| `NEXT_PUBLIC_APP_URL`           | ✅          | Public base URL (`http://localhost:3000` in dev)                         |
| `ANTHROPIC_API_KEY`             | optional    | AI receipt scanning & bank-statement extraction                          |
| `GOOGLE_CLIENT_ID`              | optional    | Gmail OAuth (email notifications)                                        |
| `GOOGLE_CLIENT_SECRET`          | optional    | Gmail OAuth                                                              |
| `GOOGLE_REDIRECT_URI`           | optional    | Gmail OAuth callback, e.g. `http://localhost:3000/api/auth/gmail/callback` |

### 4. Configure Supabase Auth redirects

In Supabase → **Authentication → URL Configuration → Redirect URLs**, add:

```
http://localhost:3000/reset-password
https://<your-domain>/reset-password
```

This is required for the password-recovery email flow.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start tracking.

---

## 📜 Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack)  |
| `npm run build`     | Production build                  |
| `npm run start`     | Serve the production build        |
| `npm run lint`      | ESLint                            |
| `npm run typecheck` | TypeScript `--noEmit` check       |

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/            # login, register, forgot/reset password
│   ├── (dashboard)/       # dashboard, transactions, accounts, budgets,
│   │                      # goals, investments, net-worth, recurring,
│   │                      # analytics, settings
│   ├── api/               # ai/ocr, auth (gmail, session), cron,
│   │                      # notifications, webhooks
│   └── unsubscribe/       # one-click email unsubscribe
├── components/            # feature components + shared UI library
├── features/              # data layer per domain (api + hooks + schema)
├── hooks/                 # cross-cutting hooks (user, scroll, badges…)
├── lib/                   # supabase clients, crypto, formatters, utils,
│   │                      # constants, haptics, rate limiting
├── stores/                # Zustand stores (UI state)
└── middleware.ts          # auth gating + route redirects

supabase/migrations/       # ordered SQL migrations (schema → RLS →
                           # indexes → triggers → notifications)
```

**Conventions**

- `features/<domain>/` owns data access (Supabase queries), React Query hooks, and Zod schemas for one domain
- `components/<domain>/` owns the UI for that domain; shared primitives live in `components/ui` and `components/shared`
- Server state lives in React Query; ephemeral UI state (active month, theme, sheets) lives in Zustand

---

## 🔐 Security

- **Row Level Security** on every table — users can only read/write their own rows
- **Auth middleware** — protected routes redirect to login (with safe, same-origin `next` redirect handling); unknown routes 404 instead of leaking route existence
- **Secrets hygiene** — service-role key and API keys are server-only; `.env.local` is git-ignored
- **Encryption at rest** — Gmail OAuth tokens encrypted with AES-GCM; HMAC-signed state for the OAuth flow (driven by `APP_SECRET`)
- **Hardened headers** — strict Content-Security-Policy, HSTS (preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, restrictive Permissions-Policy and Referrer-Policy
- **Cron endpoint auth** — weekly digest requires `CRON_SECRET`
- **Rate limiting** on sensitive API routes

---

## ☁️ Deployment (Vercel)

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com)
2. Add all required environment variables (table above) in **Project → Settings → Environment Variables**
3. `vercel.json` already schedules the weekly digest:

   ```json
   { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 8 * * 1" }] }
   ```

4. Update Supabase **Redirect URLs** and `GOOGLE_REDIRECT_URI` with your production domain
5. Deploy 🎉

---

## 🧭 Roadmap

- [ ] Shared/household budgets
- [ ] Bank sync via open-banking APIs
- [ ] Budget rollover rules
- [ ] Multi-currency conversion (live FX)
- [ ] Native mobile wrappers

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo and create a feature branch: `git checkout -b feat/amazing-feature`
2. Make your changes — keep `npm run typecheck` and `npm run lint` clean
3. Commit with a descriptive message and open a Pull Request

Please open an issue first for large changes so we can discuss the approach.

---

## 📄 License

No license has been granted yet — all rights reserved. If you intend to use this code, please open an issue.

---

<div align="center">
Built with ❤️ using Next.js and Supabase
</div>
