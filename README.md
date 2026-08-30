# RetroMo

A full-featured retrospective application. Run agile retrospectives with your team using post-it style cards, dot voting, action points, timers, and facilitator controls — all in real-time.

## Features

### Core Retrospective Board

- **Templates**: Mad/Sad/Glad, Liked/Learned/Lacked, Start/Stop/Continue, or blank slate
- **Custom columns**: Add, remove, reorder, rename, and color-code columns
- **Post-it cards**: Colorful sticky notes with text, emoji, and image support
- **Public & Private sections**: Each column has a shared public area and a personal private space; drag cards to share
- **Drag & drop**: HTML5 drag-and-drop to move cards between columns and sections
- **Anonymous or named participation**: Choose whether cards are tied to participant names

### Dot Voting

- Configurable votes per participant, per column, and per card
- Secret voting mode (results hidden until facilitator reveals) or public voting
- Real-time vote counts

### Action Points

- Capture actionable items directly from the retrospective
- Assign owners and due dates
- Track status (open / done)
- Team-level action point overview

### Facilitator Tools

- Lock the board (read-only mode)
- Toggle secret voting on/off
- Set a countdown timer (1, 3, 5, 10, 15 minutes)
- Moderate cards
- Copy share link to invite participants

### Real-time Collaboration

- Live updates via polling (cards, votes, participants, action points sync automatically)
- Participant list with avatars and colors
- Ready check for participants

### Teams

- Create teams with custom names and colors
- Invite members by email
- Group retrospectives under a team
- View team-wide action point overview (open vs. done)
- Owner and member roles

### Authentication

- Email & password sign up / sign in (powered by [better-auth](https://better-auth.com))
- Optional Google and GitHub OAuth social login
- Anonymous guest participation (no account required for free retros)

### Plans

- **Anonymous** (Free): No account needed, retros retained for 365 days
- **Individual** ($10/mo): Personal account, unlimited retros
- **Company** ($20/mo): Teams, member management, action point tracking

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language  | TypeScript 5                       |
| Styling   | TailwindCSS v4                     |
| Database  | PostgreSQL                         |
| ORM       | Drizzle ORM + drizzle-kit          |
| Auth      | better-auth                        |
| Runtime   | Node.js 20+                        |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+

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

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/retromo"
BETTER_AUTH_SECRET="generate-a-32-char-secret-string"
BETTER_AUTH_URL="http://localhost:3000"

# Optional — for social login (Google / GitHub OAuth)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

> Generate a secret with: `openssl rand -base64 32`

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
│   ├── api/                  # API routes
│   │   ├── auth/[...all]/    # better-auth handler
│   │   ├── retros/           # Retro CRUD + settings
│   │   ├── cards/            # Card CRUD
│   │   ├── votes/            # Vote toggle
│   │   ├── action-points/    # Action point CRUD
│   │   ├── participants/     # Join/update participants
│   │   └── teams/            # Team CRUD + members
│   ├── page.tsx              # Marketing homepage
│   ├── features/             # Features page
│   ├── plans/                # Pricing page
│   ├── faq/                  # FAQ page
│   ├── sign-in/              # Sign in page
│   ├── sign-up/              # Sign up page
│   ├── dashboard/            # User dashboard (retros + teams)
│   ├── teams/                # Teams list + detail
│   ├── new-retrospective/    # Retro setup wizard
│   └── retro/[id]/           # Retro board (real-time)
├── components/
│   ├── Navbar.tsx            # Responsive nav with mobile menu
│   ├── Footer.tsx
│   ├── Button.tsx            # Reusable button component
│   ├── Logo.tsx
│   └── board/
│       ├── Card.tsx          # Post-it card with voting, colors, DnD
│       ├── Column.tsx        # Column with public + private sections
│       ├── ActionPointsPanel.tsx
│       └── useRetroBoard.ts  # Real-time board state hook
├── db/
│   ├── schema.ts             # Drizzle schema (all tables + relations)
│   ├── index.ts              # DB connection
│   └── seed.ts               # Template seeder
└── lib/
    ├── auth.ts               # better-auth server config
    ├── auth-client.ts        # better-auth React client
    ├── session.ts            # Server-side session helper
    ├── templates.ts          # Built-in retro templates
    ├── card-colors.ts        # Post-it color palette
    └── utils.ts              # Shared utilities
```

## Database Schema

The schema includes these tables:

- **user**, **session**, **account**, **verification** — better-auth tables
- **team**, **team_member** — team management
- **retro** — retrospective with voting config, timer, facilitation flags, plan
- **retro_participant** — participants with display name, color, facilitator flag
- **column** — board columns with color and position
- **card** — post-it cards with color, public/private flag, vote count, author
- **vote** — individual votes
- **action_point** — action items with assignee, due date, status
- **template** — built-in and custom templates

## License

MIT
