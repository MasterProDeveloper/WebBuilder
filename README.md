# SiteCloud

AI-powered platform for handling heavy and complex tasks with seamless efficiency.

## Architecture Overview

```
sitecloud/
├── frontend/          # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Layout, Sidebar, Header
│   │   ├── pages/         # Dashboard, Chat, Tasks, Analytics, Admin, Settings
│   │   ├── store/         # Zustand state management
│   │   ├── lib/           # API client (Axios) + Local storage backend
│   │   └── i18n/          # Multi-language support (en, es, fr, de, ar)
│   └── public/
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/        # App config, database, logger
│   │   ├── middleware/    # Auth (JWT), error handling, validation (Zod)
│   │   ├── routes/        # REST API endpoints
│   │   └── services/      # Business logic (AI, auth, tasks, analytics, gamification)
│   └── Dockerfile
├── database/          # PostgreSQL schema and migrations
├── docker-compose.yml # Full stack orchestration
└── .env.example       # Environment variable template
```

## Features

### Fully Functional Offline Mode
- **Local Storage Backend** - All features work without a backend server
- **Automatic Fallback** - Seamlessly falls back to local storage when API is unavailable
- **Client-Side AI** - Direct OpenAI API integration from the browser (API key in Settings)

### AI-Powered Intelligence
- **AI Chat** - GPT-4 powered conversations with full history
- **Recommendations** - Personalized suggestions based on user context
- **Predictive Analytics** - Trend analysis, anomaly detection, forecasting
- **Smart Search** - AI-enhanced query understanding and intent extraction
- **Workflow Optimization** - Automated suggestions and risk assessment

### Task Management
- Create, update, and track tasks with priority levels
- Status workflow: pending -> in_progress -> completed/failed
- Filterable and paginated task lists
- Due date tracking and metadata support

### Analytics Dashboard
- Real-time metrics: users, tasks, conversations, messages
- Task completion rate visualization
- Top events tracking (7-day window)
- Time series analytics for any event type
- Performance overview with engagement metrics

### Admin Panel
- User management (list, enable/disable, role assignment)
- System health monitoring (database, uptime, memory)
- Audit log viewer for security tracking
- Full metrics dashboard

### Gamification
- Points system with level progression
- Daily streak tracking
- Achievement system
- Global leaderboard

### Multi-Language Support
- English, Spanish, French, German, Arabic
- RTL layout support for Arabic
- Persistent language preference

### Security
- JWT-based authentication with refresh tokens
- bcrypt password hashing (SHA-256 in local mode)
- Role-based access control (user, admin, moderator)
- Helmet security headers
- CORS configuration
- Rate limiting
- Zod request validation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State Management | Zustand |
| HTTP Client | Axios (with local fallback) |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend | Node.js, Express, TypeScript |
| AI Integration | OpenAI GPT-4 API (client + server) |
| Database | PostgreSQL 16 (with localStorage fallback) |
| Caching | Redis 7 |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Logging | Winston |
| Containerization | Docker + Docker Compose |

## Getting Started

### Quick Start (No Backend Required)

The frontend works standalone with localStorage as the backend:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, register an account, and start using all features immediately. The first registered user automatically gets admin role.

To enable AI chat with GPT-4, go to Settings > AI Configuration and add your OpenAI API key.

### Full Stack Setup

#### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for database)
- OpenAI API key (for AI features)

#### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 2. Start infrastructure

```bash
docker compose up -d postgres redis
```

#### 3. Start backend

```bash
cd backend
npm install
npm run dev
```

#### 4. Start frontend

```bash
cd frontend
npm install
npm run dev
```

#### 5. Open the app

Navigate to http://localhost:5173

### Docker Compose (Full Stack)

```bash
docker compose up --build
```

Access at http://localhost

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile

### AI
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/conversations` - List conversations
- `GET /api/ai/conversations/:id/messages` - Get conversation messages
- `POST /api/ai/recommendations` - Get AI recommendations
- `POST /api/ai/predict` - Predictive analytics
- `POST /api/ai/search` - AI-enhanced search

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics (admin)
- `GET /api/analytics/timeseries/:eventType` - Time series (admin)
- `GET /api/analytics/my-activity` - User's activity
- `POST /api/analytics/track` - Track event

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Unread count
- `PATCH /api/notifications/:id/read` - Mark read
- `POST /api/notifications/read-all` - Mark all read

### Gamification
- `GET /api/gamification/points` - User points
- `GET /api/gamification/achievements` - User achievements
- `GET /api/gamification/leaderboard` - Global leaderboard
- `POST /api/gamification/check-achievements` - Check achievements

### Admin
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id` - Update user
- `GET /api/admin/metrics` - System metrics
- `GET /api/admin/audit-logs` - Audit logs
- `GET /api/admin/health` - System health

## License

MIT
