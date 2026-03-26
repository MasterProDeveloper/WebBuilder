# Lovable Bolt

AI-powered platform for handling heavy and complex tasks with seamless efficiency.

## Architecture Overview

```
lovable-bolt/
├── frontend/          # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Layout, Sidebar, Header
│   │   ├── pages/         # Dashboard, Chat, Tasks, Analytics, Admin, Settings
│   │   ├── store/         # Zustand state management
│   │   ├── lib/           # API client (Axios)
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
- Achievement system (First Login, Chat Starter, Task Master, Power User, Data Analyst)
- Global leaderboard

### Multi-Language Support
- English, Spanish, French, German, Arabic
- RTL layout support for Arabic
- Persistent language preference

### Security
- JWT-based authentication with refresh tokens
- bcrypt password hashing
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
| HTTP Client | Axios |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend | Node.js, Express, TypeScript |
| AI Integration | OpenAI GPT-4 API |
| Database | PostgreSQL 16 |
| Caching | Redis 7 |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Logging | Winston |
| Containerization | Docker + Docker Compose |

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for database)
- OpenAI API key (for AI features)

### Quick Start

1. **Clone and setup**
```bash
git clone https://github.com/MasterProDeveloper/WebBuilder.git
cd WebBuilder
cp .env.example .env
# Edit .env with your configuration
```

2. **Start infrastructure**
```bash
docker-compose up -d postgres redis
```

3. **Install dependencies and run**
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/api/health

### Docker (Full Stack)
```bash
docker-compose up -d
# Frontend: http://localhost:80
# API: http://localhost:3001
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh tokens |
| GET | /api/auth/me | Get current user |
| PATCH | /api/auth/me | Update profile |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/chat | Send chat message |
| GET | /api/ai/conversations | List conversations |
| GET | /api/ai/conversations/:id/messages | Get messages |
| POST | /api/ai/recommendations | Get AI recommendations |
| POST | /api/ai/predict | Predictive analytics |
| POST | /api/ai/search | AI-enhanced search |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/dashboard | Dashboard metrics (admin) |
| GET | /api/analytics/timeseries/:type | Time series data (admin) |
| GET | /api/analytics/my-activity | User activity |
| POST | /api/analytics/track | Track event |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| GET | /api/notifications/unread-count | Unread count |
| PATCH | /api/notifications/:id/read | Mark as read |
| POST | /api/notifications/read-all | Mark all read |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/gamification/points | User points |
| GET | /api/gamification/achievements | User achievements |
| GET | /api/gamification/leaderboard | Global leaderboard |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | List all users |
| PATCH | /api/admin/users/:id | Update user role/status |
| GET | /api/admin/metrics | System metrics |
| GET | /api/admin/audit-logs | Audit logs |
| GET | /api/admin/health | System health |

## Database Schema

The PostgreSQL schema includes:
- **users** - User accounts with roles and preferences
- **refresh_tokens** - JWT refresh token storage
- **conversations** / **messages** - AI chat history
- **tasks** - Task management with metadata
- **workflows** - Automated workflow definitions
- **analytics_events** - Event tracking
- **performance_metrics** - System metrics
- **notifications** - User notifications
- **recommendations** - AI-generated recommendations
- **user_points** / **achievements** / **user_achievements** - Gamification
- **audit_logs** - Security audit trail

## Deployment

### AWS / GCP / Azure
The application is containerized and ready for deployment on any cloud platform:
- Frontend: Serve via CDN (CloudFront, Cloud CDN) or container
- Backend: ECS, Cloud Run, or AKS
- Database: RDS, Cloud SQL, or Azure Database
- Redis: ElastiCache, Memorystore, or Azure Cache

### Environment Variables
See [.env.example](.env.example) for all required configuration.

## License

MIT
