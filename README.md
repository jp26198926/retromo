# RetroMo

A full-featured retrospective application. Run agile retrospectives with your team using post-it style cards, dot voting, action points, timers, and facilitator controls — all in real-time. Includes a subscription/billing system with PayPal, team management, an admin panel, and Cloudinary-powered asset uploads.

## Features

### Core Retrospective Board

- **Templates**: Mad/Sad/Glad, Liked/Learned/Lacked, Start/Stop/Continue, or blank slate
- **Custom columns**: Add, remove, reorder, rename, and color-code columns during retro setup
- **Post-it cards**: Colorful sticky notes with text, emoji, and image support (paste or upload)
- **Public & Private sections**: Each column has a shared public area and a personal private space; drag cards to share
- **Drag & drop**: HTML5 drag-and-drop to move cards between columns and sections
- **Anonymous or named participation**: Choose whether cards are tied to participant names
- **Data export**: Export the entire board (columns, cards, votes, action points) to Markdown

### Dot Voting

- Configurable votes per participant, per column, and per card
- Secret voting mode (results hidden until facilitator reveals) or public voting — toggleable live
- Real-time vote counts with sort-by-votes

### Action Points

- Capture actionable items directly from the retrospective
- Assign owners and due dates
- Track status (open / done)
- Team-level action point overview

### Facilitator Tools

- Lock the board (read-only mode)
- Toggle secret voting on/off
- Set a countdown timer (0, 1, 3, 5, 10, 15 minutes) with auto-lock when expired
- Copy share link to invite participants
- Ready check for participants
- **Card moderation panel** (paid plans) — a floating panel with a pending-count badge lets facilitators approve or reject cards before they become visible to the rest of the team

### Real-time Collaboration

- Live updates via polling (cards, votes, participants, action points sync automatically)
- Participant list with avatars and colors
- Retro history dashboard with search, filtering (by plan, team, role), sorting, and pagination

### Teams

- Create teams with custom names and colors (plan-limited: Anonymous = 0, Individual = 3, Company = unlimited)
- Invite members by email (with optional SMTP email invitations and accept-token flow)
- Group retrospectives under a team
- View team-wide action point overview (open vs. done)
- Roles: `owner`, `member`, plus **`scrumMaster`** and **`teamLead`** (Company plan only) — the team owner can change any member's role from the team detail page

### Authentication

- Email & password sign up / sign in (powered by [better-auth](https://better-auth.com))
- Optional Google and GitHub OAuth social login (auto-hidden if not configured)
- Anonymous guest participation (no account required for free retros)

### Plans & Billing

Three subscription tiers with plan-based feature gating. Payments are processed via PayPal (sandbox or production). The admin can configure pricing and the anonymous participant limit.

#### Anonymous (Free)

- No account needed — start a retro instantly
- **Up to 3 columns per retrospective** (enforced server-side at retro creation; more columns return `403`)
- Unlimited cards and action points
- All four built-in templates use three columns, so every template works on the free plan
- Configurable participant limit (admin-set, default 50)
- Basic facilitation tools (lock, secret voting, timer)
- Retros retained for 12 months (365 days, fixed — not configurable)
- ❌ No Markdown export (paid plans only)
- ❌ No private retros, moderation, archiving, or encryption

#### Individual ($10/mo, admin-configurable)

Everything from Anonymous, plus:

- **Unlimited columns per retrospective** — the 3-column free cap is lifted
- **Data export to Markdown** — export button appears on the board
- **Private, invite-only retrospectives** — restrict access to invited participants
- **Card moderation** — cards start as _pending_ and require facilitator approval before appearing publicly
- **Advanced facilitation tools** — secret voting, countdown timer, read-only lock mode
- **Extended retro customization** — custom columns, image filters (blur, translucent)
- **Manage up to 3 teams**
- **Infinite retrospective archive** — archive and restore retros; they never auto-expire
- **Configurable data retention** — choose forever, 30, 90, 180, or 365 days
- **High priority support**
- Unlimited participants

#### Company ($20/mo, admin-configurable)

Everything from Individual, plus:

- **Manage unlimited teams** in your company
- **Assign any number of teams to Scrum Masters and Team Leads** — dedicated `scrumMaster` and `teamLead` roles
- **Zero-knowledge encryption with custom passwords** — card content is encrypted in the browser with AES-256-GCM; the password is never sent to the server
- **Top priority support**

#### Plan comparison

| Feature                                         |    Anonymous     |  Individual  |   Company    |
| ----------------------------------------------- | :--------------: | :----------: | :----------: |
| Columns per retro                               |        3         |  Unlimited   |  Unlimited   |
| Cards & action points                           |    Unlimited     |  Unlimited   |  Unlimited   |
| Participants per retro                          |  50 (admin-set)  |  Unlimited   |  Unlimited   |
| Basic facilitation (lock, timer, secret voting) |        ✅        |      ✅      |      ✅      |
| Markdown export                                 |        ❌        |      ✅      |      ✅      |
| Private, invite-only retros                     |        ❌        |      ✅      |      ✅      |
| Card moderation (approve / reject)              |        ❌        |      ✅      |      ✅      |
| Extended customization                          |        ❌        |      ✅      |      ✅      |
| Archive / unarchive retros                      |        ❌        |      ✅      |      ✅      |
| Data retention                                  | 365 days (fixed) | Configurable | Configurable |
| Teams                                           |        0         |      3       |  Unlimited   |
| Scrum Master / Team Lead roles                  |        ❌        |      ❌      |      ✅      |
| Zero-knowledge encryption                       |        ❌        |      ❌      |      ✅      |
| Support priority                                |        —         |     High     |     Top      |

### Admin Panel (`/admin`)

- Dashboard with platform-wide reports (user count, retro count, active retros, team count, MRR estimates)
- User management (view all users, promote/demote admin role, view subscription status)
- App settings: customize app name, description, logo, and favicon
- **Logo & favicon uploads go directly to Cloudinary** (cloud storage)
- Configurable plan pricing (Individual and Company monthly prices)
- Configurable anonymous participant limit
- Billing history overview across all users

## Tech Stack

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack)                      |
| Language      | TypeScript 5                                            |
| Styling       | TailwindCSS v4                                          |
| Database      | PostgreSQL                                              |
| ORM           | Drizzle ORM + drizzle-kit                               |
| Auth          | better-auth (email/password + conditional social OAuth) |
| Payments      | PayPal (@paypal/paypal-server-sdk)                      |
| Image Storage | Cloudinary (cloudinary npm SDK)                         |
| Email         | Nodemailer (optional SMTP for team invitations)         |
| Runtime       | Node.js 20+                                             |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A PayPal account (sandbox for testing, or production) — optional, plans page works without it
- A Cloudinary account — optional, only needed for admin logo/favicon uploads

### 1. Clone and install

```bash
git clone https://github.com/jp26198926/retromo.git
cd retromo
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your details:

```bash
cp .env.example .env
```

#### Required

```env
DATABASE_URL="postgresql://user:password@localhost:5432/retromo"
BETTER_AUTH_SECRET="generate-a-32-char-secret-string"
BETTER_AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
```

> Generate a secret with: `openssl rand -base64 32`
>
> The `ADMIN_EMAIL` user is automatically an admin and can access `/admin`.

#### Optional — Social Login (Google / GitHub OAuth)

Leave commented out to hide the social login buttons:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

#### Optional — PayPal (for subscriptions)

```env
NEXT_PUBLIC_PAYPAL_ENVIRONMENT="sandbox"   # or "production"
NEXT_PUBLIC_PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
```

#### Optional — Cloudinary (for admin logo/favicon uploads)

Get these from your [Cloudinary console](https://console.cloudinary.com/console):

```env
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

#### Optional — SMTP (for team invitation emails)

If not set, invitations are still created but no email is sent — the invite link is returned in the API response for manual sharing.

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"
SMTP_FROM_NAME="RetroMo"
SMTP_SECURE="false"   # use "true" for port 465 (SSL)
```

### 3. Set up the database

Create the database:

```bash
createdb retromo
```

Run the migration to create all tables:

```bash
npx drizzle-kit push
```

Seed built-in templates (Mad/Sad/Glad, etc.):

```bash
npx tsx --env-file=.env src/db/seed.ts
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/
│   ├── api/                      # API routes
│   │   ├── auth/[...all]/        # better-auth handler
│   │   ├── auth/providers        # available OAuth providers
│   │   ├── retros/               # Retro CRUD + settings + history
│   │   ├── cards/                # Card CRUD
│   │   ├── votes/                # Vote toggle
│   │   ├── action-points/        # Action point CRUD
│   │   ├── participants/         # Join/update participants
│   │   ├── teams/                # Team CRUD + members + invite
│   │   ├── admin/                # Admin: check, settings, upload, users, reports, billing
│   │   ├── paypal/               # PayPal create-order + capture-order
│   │   ├── subscription/         # Subscription status + cancel
│   │   ├── app-settings/         # Public app settings (name, logo, prices)
│   │   └── contact/              # Contact form submission
│   ├── page.tsx                  # Marketing homepage
│   ├── features/                 # Features page
│   ├── plans/                    # Pricing page
│   ├── faq/                      # FAQ page
│   ├── sign-in/                  # Sign in page
│   ├── sign-up/                  # Sign up page
│   ├── billing/                  # Billing & subscription management
│   ├── dashboard/                # User dashboard (retros + teams)
│   ├── teams/                    # Teams list + detail + invite accept
│   ├── new-retrospective/        # Retro setup wizard
│   ├── retro/[id]/               # Retro board (real-time)
│   ├── admin/                    # Admin panel
│   └── layout.tsx                # Root layout (favicon, metadata)
├── components/
│   ├── Navbar.tsx                # Responsive nav with mobile menu
│   ├── Footer.tsx
│   ├── Button.tsx                # Reusable button component
│   ├── Logo.tsx                  # Dynamic logo from app settings
│   ├── PlanCard.tsx              # Pricing plan card
│   ├── UpgradePlanModal.tsx      # Upgrade/change plan modal with PayPal
│   ├── PayPalCheckout.tsx        # PayPal button component
│   ├── ConfirmModal.tsx          # Reusable confirmation modal
│   ├── MessageUs.tsx             # Contact form widget
│   ├── useAppSettings.ts         # Hook for public app settings
│   ├── useSocialProviders.ts     # Hook for available OAuth providers
│   ├── useAdmin.ts               # Hook for admin session
│   └── board/
│       ├── Card.tsx              # Post-it card with voting, colors, DnD
│       ├── Column.tsx            # Column with public + private sections
│       ├── ActionPointsPanel.tsx # Action points sidebar
│       └── useRetroBoard.ts      # Real-time board state hook (polling)
├── db/
│   ├── schema.ts                 # Drizzle schema (all tables + relations)
│   ├── index.ts                  # DB connection
│   └── seed.ts                   # Template seeder
└── lib/
    ├── auth.ts                   # better-auth server config
    ├── auth-client.ts            # better-auth React client
    ├── session.ts                # Server-side session helper
    ├── admin.ts                  # Admin session helper
    ├── plans.ts                  # Plan feature flags + current user plan
    ├── app-settings.ts           # App settings singleton helper
    ├── templates.ts              # Built-in retro templates
    ├── card-colors.ts            # Post-it color palette
    ├── cloudinary.ts             # Cloudinary config + uploadBuffer utility
    ├── email.ts                  # SMTP email (Nodemailer) for invitations
    ├── paypal/                   # PayPal client + order helpers
    └── utils.ts                  # Shared utilities
```

## Database Schema

The schema includes these tables:

- **user** — better-auth user with subscription fields (plan, status, PayPal ID, period end, cancelled at)
- **session**, **account**, **verification** — better-auth tables
- **team** — team with name, color, owner
- **team_member** — team membership (`owner`, `member`, `scrumMaster`, or `teamLead` role)
- **team_invitation** — email invitations with accept token
- **retro** — retrospective with voting config, timer, facilitation flags, visibility, plan, `retentionDays`, `archived`, `encryptionEnabled`, share token
- **retro_participant** — participants with display name, color, facilitator flag, anonymous session ID
- **column** — board columns with color, image URL, image filter, position
- **card** — post-it cards with color, public/private flag, `approved` (moderation) flag, vote count, author, image URL
- **vote** — individual votes
- **action_point** — action items with assignee, due date, status
- **template** — built-in and custom templates
- **billing_history** — payment records (subscribe, change_plan, cancel, renewal)
- **app_settings** — singleton: app name, description, logo URL, favicon URL, plan prices, participant limit

## Plan Feature Gating

Feature access is controlled by `src/lib/plans.ts`, which defines feature flags per plan:

| Feature flag                        | Anonymous                       | Individual | Company          |
| ----------------------------------- | ------------------------------- | ---------- | ---------------- |
| `maxTeams`                          | 0                               | 3          | Unlimited (`-1`) |
| `maxColumns`                        | 3                               | Unlimited (`-1`) | Unlimited (`-1`) |
| `participantLimit`                  | Admin-configurable (default 50) | Unlimited  | Unlimited        |
| `privateRetros`                     | —                               | ✅         | ✅               |
| `advancedFacilitation` (moderation) | —                               | ✅         | ✅               |
| `extendedCustomization`             | —                               | ✅         | ✅               |
| `infiniteArchive`                   | —                               | ✅         | ✅               |
| `configurableRetention`             | —                               | ✅         | ✅               |
| `zeroKnowledgeEncryption`           | —                               | —          | ✅               |
| `prioritySupport`                   | `none`                          | `high`     | `top`            |

The `getCurrentUserPlan()` function reads the user's subscription from the database and returns the active feature set. `hasActiveAccess()` handles cancelled subscriptions that are still within their paid period.

### Where gating is enforced

Gating is applied on the **server** (authoritative) and mirrored in the **UI** (for a good experience):

| Restriction               | Server enforcement                                                                                     | UI behaviour                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 3-column cap on free plan | `POST /api/retros` compares `columns.length` against `maxColumns` and returns `403` before touching the database                | "+ Add column" is disabled at the cap, with a _"3 of 3 columns used on the free plan"_ hint and an upgrade link |
| Markdown export           | —                                                                                                      | Export button hidden unless `retro.plan !== "anonymous"`                                     |
| Private retros            | `POST /api/retros` rejects `visibility: "private"` without `privateRetros`                             | Toggle disabled with an upgrade hint                                                         |
| Moderation                | `POST /api/cards/moderation` verifies the retro is moderated and the caller is owner/facilitator/admin | Moderation panel only rendered for facilitators on moderated retros                          |
| Configurable retention    | `POST /api/retros` forces 365 days for anonymous; validates 1–3650 (or 0/-1 = forever) for paid        | Dropdown disabled with _"Upgrade to configure"_                                              |
| Archive / unarchive       | `PATCH /api/retros/[id]` requires ownership and a paid plan                                            | Archive button only shown to owners of paid retros                                           |
| Scrum Master / Team Lead  | `PATCH /api/teams/[id]/members` requires the Company plan for those roles                              | Role options disabled for non-Company plans                                                  |
| Zero-knowledge encryption | `POST /api/retros` rejects `encryptionEnabled` without the Company plan                                | Toggle + password fields only enabled on Company plan                                        |

### Zero-knowledge encryption

Implemented in `src/lib/crypto.ts` using the Web Crypto API:

- **AES-256-GCM** for content encryption, with a **PBKDF2** key derivation (150,000 iterations, SHA-256)
- A random salt and IV are generated per card and packed with the ciphertext into a single base64 string
- Encryption and decryption happen **entirely in the browser** — the password is never transmitted, and the server only ever stores ciphertext
- The password is held in `sessionStorage` for the duration of the session so the board can transparently decrypt cards
- Because the server cannot recover the password, **a lost password means permanently unreadable cards**

## License

MIT
