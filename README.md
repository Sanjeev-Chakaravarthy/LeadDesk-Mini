# LeadDesk Mini

> **The Agency CRM Built for Digital Heroes**  
> Capture, organize, and convert every website inquiry from one beautifully crafted dashboard.

---

## ✨ Overview

LeadDesk Mini is a purpose-built lead management platform designed exclusively for creative and development agencies. It replaces scattered inboxes and spreadsheets with a centralized, real-time pipeline — so no inquiry ever slips through the cracks.

### Key Highlights

- ⚡ **Instant Lead Capture** — REST API + embeddable forms sync inquiries in real time
- 📊 **Dual-View Pipeline** — Toggle between Table stream and Kanban board
- 📧 **Automated Email Alerts** — Team-wide notifications on every new lead
- 📈 **Conversion Analytics** — Track monthly growth, sources, budgets, and conversion rates
- 👥 **Agency Team Workspaces** — Isolated multi-member workspaces with role-based access
- 📥 **One-Click CSV Export** — Export full lead data instantly
- 🔍 **Global Search (⌘K)** — Search leads, members, and pages from anywhere
- 📋 **Activity Log** — Complete audit trail of every workspace action

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Custom Material Design 3 tokens |
| **Authentication** | BetterAuth (session-based + Google OAuth) |
| **Database** | MongoDB with Prisma ORM |
| **Email** | Resend / Nodemailer for transactional alerts |
| **Forms** | React Hook Form + Zod validation |
| **Typography** | Playfair Display (serif) + Inter (sans-serif) |
| **Icons** | Material Symbols Outlined |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** instance (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/Sanjeev-Chakaravarthy/LeadDesk-Mini.git
cd LeadDesk-Mini
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# ── Database ──
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>

# ── Authentication (BetterAuth) ──
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# ── Email (Resend / SMTP) ──
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SMTP_HOST=smtp.resend.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_USER=resend
EMAIL_SMTP_PASS=re_your_api_key

# ── App ──
APP_URL=http://localhost:3000

# ── Google OAuth (optional) ──
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📂 Project Structure

```
LeadDesk-Mini/
├── prisma/                 # Prisma schema & migrations
│   └── schema.prisma
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (auth)/         # Auth-related routes
│   │   ├── api/            # API routes (leads, workspace, auth)
│   │   ├── dashboard/      # Agency dashboard
│   │   ├── leads/          # Lead stream & pipeline (Table + Kanban)
│   │   ├── analytics/      # Conversion analytics
│   │   ├── members/        # Team management
│   │   ├── activity-log/   # Workspace activity log
│   │   ├── settings/       # Workspace settings
│   │   ├── profile/        # User profile
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration / workspace creation
│   │   └── page.tsx        # Welcome / landing page
│   ├── components/         # Shared UI components
│   │   ├── Brand.tsx       # Logo & branding
│   │   ├── Navbar.tsx      # Top navigation bar
│   │   ├── Sidebar.tsx     # Sidebar navigation
│   │   ├── CommandPalette.tsx  # ⌘K global search
│   │   └── DigitalHeroesFooter.tsx
│   ├── utils/              # Utilities & auth client
│   └── lib/                # Prisma client & helpers
├── .env.local              # Environment variables (not committed)
├── tailwind.config.ts      # Tailwind + design token config
├── next.config.ts          # Next.js configuration
└── package.json
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

---

## 🌐 Pages & Routes

| Route | Description |
|---|---|
| `/` | Welcome / landing page (new visitors only) |
| `/register` | Create workspace or join via invite |
| `/login` | Sign in with email or Google |
| `/dashboard` | Agency dashboard with stats & recent leads |
| `/leads` | Lead stream — Table view + Kanban board |
| `/leads/[id]` | Individual lead detail page |
| `/analytics` | Conversion analytics & charts |
| `/members` | Team management & invitations |
| `/activity-log` | Workspace activity audit trail |
| `/settings` | Workspace settings |
| `/profile` | User profile management |
| `/help` | Help center |

---

## 🔑 Features in Detail

### Lead Capture API

Submit leads programmatically:

```bash
POST /api/leads
Content-Type: application/json

{
  "name": "Marcus Vance",
  "email": "marcus@techventures.io",
  "company": "TechVentures Inc.",
  "budget": "$10,000 - $25,000",
  "message": "Looking for a full website redesign.",
  "source": "Website Contact Form"
}
```

### Dual-View Pipeline

- **Table View** — Sortable, filterable high-density lead grid
- **Kanban Board** — Visual cards across *New Inquiries*, *In Conversation*, *Closed & Won*
- Single-click stage progression buttons on Kanban cards

### Team Workspaces

- Owner can invite members via email or shareable invite link
- Each workspace is fully isolated — leads, analytics, and settings are scoped per organization
- Role-based access (Owner / Member)

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 👤 Author

**Sanjeev M S**  
📧 [sanjeev.ms28122@gmail.com](mailto:sanjeev.ms28122@gmail.com)

---

*Built for [Digital Heroes](https://digitalheroesco.com) · Capture. Organize. Convert.*
