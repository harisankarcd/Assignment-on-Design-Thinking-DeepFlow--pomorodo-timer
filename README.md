--

## 📡 API Documentation

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Dev",
  "email": "jane@example.com",
  "password": "securepass123"
}

Response 201:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "name": "Jane Dev", "email": "jane@example.com" }
}
```

#### Login
```
POST /api/auth/login
{
  "email": "jane@example.com",
  "password": "securepass123"
}
```

All subsequent requests require:
```
Authorization: Bearer <token>
```

---

### Sessions

#### Create Session
```
POST /api/sessions
{
  "type": "focus",           // focus | shortBreak | longBreak
  "duration": 25,            // minutes
  "completed": true,
  "interrupted": false,
  "date": "2025-06-01",
  "startedAt": "2025-06-01T09:00:00Z",
  "completedAt": "2025-06-01T09:25:00Z",
  "taskId": 3                // optional
}
```

#### Get Sessions
```
GET /api/sessions?startDate=2025-05-25&endDate=2025-06-01&type=focus
```

---

### Tasks

| Method   | Endpoint          | Description         |
|----------|-------------------|---------------------|
| `GET`    | `/api/tasks`      | List all tasks      |
| `POST`   | `/api/tasks`      | Create task         |
| `PATCH`  | `/api/tasks/:id`  | Update task         |
| `DELETE` | `/api/tasks/:id`  | Delete task         |

```
POST /api/tasks
{
  "title": "Fix auth bug in checkout flow",
  "tag": "dev"              // general | dev | design | review | meeting | docs
}
```

---

### Stats

| Endpoint             | Description                    |
|----------------------|--------------------------------|
| `GET /api/stats/today`  | Today's focus stats         |
| `GET /api/stats/weekly` | Last 7 days aggregated      |
| `GET /api/stats/streak` | Current streak + history    |

**Weekly Response:**
```json
[
  { "date": "2025-05-26", "focusSessions": 4, "focusMinutes": 100 },
  { "date": "2025-05-27", "focusSessions": 6, "focusMinutes": 150 },
  ...
]
```

**Streak Response:**
```json
{
  "streak": 7,
  "dates": ["2025-06-01", "2025-05-31", ...]
}
```

---

## 🗄️ Database Schema

```
Users ──┬── Tasks
        │     └── PomodoroSessions
        ├── PomodoroSessions
        └── DailyStats (aggregated, indexed by userId+date)
```

All tables indexed on `userId` + key query fields for performance.

---

## 🔒 Security Features

- **Passwords**: bcrypt with 12 salt rounds
- **JWT**: 7-day expiry, signed with RS256-equivalent secret
- **Rate limiting**: 100 req/15min general, 10 req/15min auth endpoints
- **Helmet.js**: HTTP security headers
- **CORS**: Restricted to frontend origin
- **Input validation**: express-validator on all routes
- **SQL injection**: Prevented by Prisma ORM parameterized queries
- **Cascade deletes**: User deletion removes all related data

---

## 🧪 Testing

```bash
cd backend
npm test              # Jest unit tests
npm run test:e2e      # Supertest API tests
```

---

## 📦 package.json Scripts

### Backend
```json
{
  "dev": "nodemon server.js",
  "start": "node server.js",
  "migrate": "prisma migrate dev",
  "generate": "prisma generate",
  "studio": "prisma studio",
  "test": "jest"
}
```

### Frontend
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint src/"
}
```

---

## 🚧 Roadmap

- [ ] Slack/Teams OAuth integration for real status updates
- [ ] Browser extension for tab blocking during focus
- [ ] Export stats to CSV/PDF
- [ ] Team workspaces
- [ ] Custom timer durations
- [ ] Spotify/YouTube ambient sound integration
- [ ] Mobile PWA with offline support

---

## 📄 License

MIT © 2025 DeepFlow
