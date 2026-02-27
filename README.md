--


<img width="834" height="738" alt="{AE307DAA-F562-49A2-B6F6-68C1DC965576}" src="https://github.com/user-attachments/assets/41984e4e-2b0f-4acc-a8fb-5fe83dd3ab74" />

<img width="884" height="787" alt="image" src="https://github.com/user-attachments/assets/b79e5ac8-b26c-4c2a-a9ea-594d091284a9" />

<img width="887" height="829" alt="image" src="https://github.com/user-attachments/assets/837ecbd5-4090-4184-b52e-67a6fb5937c2" />

<img width="887" height="829" alt="image" src="https://github.com/user-attachments/assets/6eab4edc-11af-4f03-888f-90740ab819c9" />

<img width="823" height="824" alt="image" src="https://github.com/user-attachments/assets/d081cd65-3a89-4416-9fc3-fede4d48be50" />

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
