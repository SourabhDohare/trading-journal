# MarketSaga — AI-Powered Trading Journal

## Try it : https://www.marketsaga.site/

A full-stack, enterprise-grade Trading Journal application built with **Spring Boot 3**, **Angular 17**, and **MongoDB Atlas**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [MongoDB Atlas Setup](#mongodb-atlas-setup)
8. [Environment Variables](#environment-variables)
9. [API Reference](#api-reference)
10. [Feature Walkthrough](#feature-walkthrough)
11. [Strict Mode](#strict-mode)
12. [Pattern Detection Engine](#pattern-detection-engine)
13. [Production Deployment](#production-deployment)
14. [Extending the Application](#extending-the-application)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Angular 17 SPA                          │
│  Dashboard │ Trade Log │ Analytics │ Journal │ Reports          │
└─────────────────────┬───────────────────────────────────────────┘
                      │  HTTP/REST (JWT Bearer Token)
┌─────────────────────▼───────────────────────────────────────────┐
│                   Spring Boot 3 REST API                        │
│  AuthController │ TradeController │ ReportController            │
│  ─────────────────────────────────────────────────────          │
│  AuthService │ TradeService │ AnalyticsService                  │
│  ─────────────────────────────────────────────────────          │
│  Spring Security (JWT) │ Validation │ Cache                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │  Spring Data MongoDB
┌─────────────────────▼───────────────────────────────────────────┐
│                      MongoDB Atlas                              │
│  trades │ users │ daily_sessions                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
trading-journal/
├── backend/                          # Spring Boot API
│   ├── src/main/java/com/tradingjournal/
│   │   ├── TradingJournalApplication.java
│   │   ├── config/
│   │   │   └── SecurityConfig.java   # JWT + CORS config
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── TradeController.java
│   │   │   └── ReportController.java
│   │   ├── dto/
│   │   │   ├── TradeDTO.java          # Request/Response/Query DTOs
│   │   │   ├── AnalyticsDTO.java      # Analytics response structure
│   │   │   ├── AuthDTO.java
│   │   │   └── UserDTO.java
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   ├── ResourceNotFoundException.java
│   │   │   ├── BadRequestException.java
│   │   │   └── StrictModeException.java   # Strict mode rejections
│   │   ├── model/
│   │   │   ├── Trade.java             # Core domain entity
│   │   │   ├── User.java
│   │   │   └── DailySession.java
│   │   ├── repository/
│   │   │   ├── TradeRepository.java   # Custom query methods
│   │   │   ├── UserRepository.java
│   │   │   └── DailySessionRepository.java
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthFilter.java
│   │   │   └── UserPrincipal.java
│   │   └── service/
│   │       ├── TradeService.java      # Business logic + auto-tagging
│   │       ├── AnalyticsService.java  # Pattern detection + metrics
│   │       └── AuthService.java
│   └── src/main/resources/
│       └── application.yml
│
└── frontend/                         # Angular 17 SPA
    └── src/app/
        ├── app.component.ts
        ├── app.config.ts             # Standalone app config
        ├── app.routes.ts             # Lazy-loaded routes
        ├── core/
        │   ├── guards/auth.guard.ts
        │   ├── interceptors/
        │   │   ├── auth.interceptor.ts   # Attach JWT token
        │   │   └── error.interceptor.ts  # 401/403 handling
        │   └── services/
        │       ├── auth.service.ts       # Signal-based auth state
        │       └── trade.service.ts      # All trade/analytics API calls
        ├── features/
        │   ├── auth/                 # Login + Register
        │   ├── dashboard/            # KPI cards + recent trades
        │   ├── trades/               # List + Form + Detail
        │   ├── analytics/            # Full performance breakdown
        │   ├── journal/              # Daily session notes
        │   └── reports/              # Daily/Weekly/Monthly reports
        └── shared/
            ├── components/layout/    # Sidebar shell
            └── models/               # TypeScript interfaces
```

---

## Tech Stack

| Layer       | Technology                          | Version  |
|-------------|-------------------------------------|----------|
| Frontend    | Angular (Standalone Components)     | 17.x     |
| UI          | Angular Material + Custom CSS       | 17.x     |
| Backend     | Spring Boot                         | 3.2.x    |
| Security    | Spring Security + JWT (JJWT)        | 0.11.5   |
| Database    | MongoDB via Spring Data             | Atlas    |
| Auth        | BCrypt + JWT access/refresh tokens  | —        |
| Validation  | Jakarta Bean Validation             | 3.x      |
| Docs        | SpringDoc OpenAPI (Swagger UI)      | 2.3.0    |
| Build       | Maven (backend) / Angular CLI       | —        |
| Java        | Java 17 LTS                         | 17       |

---

## Prerequisites

- **Java 17+** — `java -version`
- **Maven 3.8+** — `mvn -version`
- **Node.js 18+** — `node -v`
- **Angular CLI 17** — `npm install -g @angular/cli`
- **MongoDB Atlas** account (free tier works) or local MongoDB 6+

---

## Backend Setup

### 1. Clone and configure

```bash
cd trading-journal/backend
cp src/main/resources/application.yml src/main/resources/application-local.yml
```

Edit `application-local.yml` and set your MongoDB URI and JWT secret.

### 2. Set environment variables

```bash
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/trading_journal"
export JWT_SECRET="your-minimum-32-character-secret-key-here"
export ALLOWED_ORIGINS="http://localhost:4200"
```

### 3. Run

```bash
mvn spring-boot:run
# API available at: http://localhost:8080/api/v1
# Swagger UI at:    http://localhost:8080/api/v1/swagger-ui.html
```

### 4. Build JAR for production

```bash
mvn clean package -DskipTests
java -jar target/trading-journal-api-1.0.0.jar
```

---

## Frontend Setup

```bash
cd trading-journal/frontend
npm install
ng serve
# App available at: http://localhost:4200
```

### Production build

```bash
ng build --configuration production
# Output in: dist/trading-journal-ui/
```

---

## MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free cluster.
2. Create a database user with read/write permissions.
3. Whitelist your IP (or use `0.0.0.0/0` for development).
4. Get the connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/trading_journal`
5. Set this as your `MONGODB_URI` environment variable.

### Indexes (auto-created by Spring Data)

```javascript
// trades collection
db.trades.createIndex({ "userId": 1, "tradeDate": -1 })
db.trades.createIndex({ "userId": 1, "instrument": 1 })
db.trades.createIndex({ "tradeId": 1, "userId": 1 }, { unique: true })

// daily_sessions collection
db.daily_sessions.createIndex({ "userId": 1, "sessionDate": -1 }, { unique: true })
```

---

## Environment Variables

### Backend

| Variable           | Description                        | Default                     |
|--------------------|------------------------------------|-----------------------------|
| `MONGODB_URI`      | MongoDB connection string          | `mongodb://localhost:27017/trading_journal` |
| `JWT_SECRET`       | JWT signing key (min 32 chars)     | **Change in production**    |
| `ALLOWED_ORIGINS`  | CORS allowed origins               | `http://localhost:4200`     |
| `PORT`             | Server port                        | `8080`                      |
| `UPLOAD_DIR`       | Chart image upload directory       | `./uploads`                 |

### Frontend

Edit `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api/v1'
};
```

---

## API Reference

### Authentication

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| POST   | `/auth/register`      | Register new trader          |
| POST   | `/auth/login`         | Login, receive JWT tokens    |
| POST   | `/auth/refresh`       | Refresh access token         |

### Trades

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | `/trades`             | Log a new trade                      |
| GET    | `/trades`             | List trades (paginated)              |
| GET    | `/trades/{id}`        | Get single trade                     |
| PUT    | `/trades/{id}`        | Update trade / add reflection        |
| DELETE | `/trades/{id}`        | Delete trade                         |
| POST   | `/trades/query`       | Advanced filter query                |
| GET    | `/trades/analytics`   | Full performance analytics           |

### Reports

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/reports/daily`      | Today's report                       |
| GET    | `/reports/weekly`     | This week's report                   |
| GET    | `/reports/monthly`    | This month's report                  |
| GET    | `/reports/custom`     | Custom date range (`?from=&to=`)     |

### Query Engine Examples

```json
POST /api/v1/trades/query

// Show all FOMO loss trades
{ "emotionalState": "FOMO", "outcomeTag": "LOSS" }

// Show trades with R:R > 2
{ "minRR": 2.0 }

// Show last 10 trades
{ "limit": 10, "sortBy": "tradeDate", "sortDir": "desc" }

// Show SL breaches
{ "slRespected": false }

// Show breakout setup trades
{ "setupType": "BREAKOUT" }

// Show trades with specific tags
{ "tags": ["#DisciplineBreak", "#FOMO"] }

// Show trades in date range
{
  "dateFrom": "2024-01-01T00:00:00",
  "dateTo": "2024-03-31T23:59:59"
}
```

---

## Feature Walkthrough

### 1. Trade Logging

Every trade captures:
- **Core data**: Instrument, type, direction, prices, lot size, exchange
- **Risk metrics**: Auto-computed R:R ratio, risk per trade, brokerage costs
- **Mandatory thinking layer**: Why, edge, confirmation, invalidation, emotional state
- **Auto-tagging**: FOMO, Revenge, HighRR tags applied automatically

### 2. Mandatory Thinking Layer

The form **enforces** minimum character counts on critical fields:
- `whyTookTrade` — minimum 20 characters, descriptive
- `edgeOrSetupLogic` — minimum 20 characters
- `confirmationUsed` — required
- `invalidationReason` — required
- `emotionalState` — required with FOMO/Revenge warnings

### 3. Post-Trade Reflection

After closing a trade, the reflection form prompts:
- What went right?
- What went wrong?
- What will you repeat?
- What will you avoid?
- Discipline score (1–10)
- Was SL respected?

### 4. Analytics Engine

The `AnalyticsService` computes:
- Win rate, profit factor, expectancy
- Max drawdown, consecutive wins/losses
- Setup performance breakdown
- Emotion vs performance correlation
- Time-of-day performance (morning/afternoon/closing)
- Monthly P&L calendar
- Discipline rating (0–100) and grade (A–F)

### 5. Pattern Detection

Automatically flags:
- FOMO trades with ≥3 losses → alert
- SL breaches ≥2 → capital destruction warning
- Revenge trading ≥2 instances → break recommendation
- Early exits ≥3 → money-left-on-table alert
- Best setups (≥3 trades, ≥60% win rate)

### 6. Strict Mode

Enable via user settings. When active:
- Rejects entries without SL
- Rejects entries without target
- Requires ≥30 character trade reason
- Flags FOMO/Revenge emotional states with a confirmation gate
- Returns `HTTP 422` with a list of all issues

---

## Strict Mode

Enable per user in the `User` document:

```json
{ "strictMode": true }
```

Or via API (add this endpoint to `UserController`):
```
PUT /users/me
{ "strictMode": true }
```

When strict mode is on and a trade fails validation, the API returns:

```json
HTTP 422 Unprocessable Entity
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Strict Mode: Trade entry rejected",
  "details": [
    "Stop Loss is mandatory in Strict Mode",
    "Trade reason must be at least 30 characters — be specific"
  ]
}
```

---

## Pattern Detection Engine

The `AnalyticsService.detectRepeatingMistakes()` method scans all trades and generates blunt, specific alerts:

| Pattern                       | Trigger               | Message                                              |
|-------------------------------|-----------------------|------------------------------------------------------|
| FOMO → Loss                  | ≥3 occurrences        | "FOMO trades lead to losses (N instances) — stop chasing" |
| SL Not Respected              | ≥2 occurrences        | "SL not respected in N trades — this is capital destruction" |
| Revenge Trading               | ≥2 occurrences        | "Revenge trading detected — take a break after losses" |
| Early Exit                    | ≥3 `#EarlyExit` tags  | "Early exits in N trades — you're leaving money on table" |
| Win Rate < 40%                | —                     | "Focus on setup quality over quantity" |
| Avg R:R < 1:1                 | —                     | "You're risking more than you make" |

---

## Production Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - ALLOWED_ORIGINS=https://your-domain.com
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped
```

### Backend Dockerfile

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/trading-journal-api-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=build /app/dist/trading-journal-ui /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://api:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Extending the Application

### Add Broker Integration (Future)

The `Trade` model has `brokerId` and `brokerTradeId` fields ready. Add a `BrokerSyncService`:

```java
@Service
public class BrokerSyncService {
    // Zerodha Kite Connect API
    // Upstox API
    // Angel Broking SmartAPI
    // Map broker trade to Trade model, auto-fill entry/exit
}
```

### Add Team / Multi-User (Future)

- `User.teamId` field is already present
- Add `TeamController` with team-level analytics
- Scope all `TradeRepository` queries by `teamId` for managers
- `User.Role.MANAGER` can view all team members' trades

### Add Chart Image Upload

```java
// Add to TradeController
@PostMapping("/{tradeId}/charts")
public ResponseEntity<Trade> uploadChart(
    @PathVariable String tradeId,
    @RequestParam("file") MultipartFile file,
    @AuthenticationPrincipal UserPrincipal principal) {
    // Save to S3 / local disk
    // Update trade.chartImageUrls
}
```

### Add Webhook / Notification

```java
@Component
public class TradeEventListener {
    @EventListener
    public void onTradeLogged(TradeCreatedEvent event) {
        // Send Telegram/Discord/email notification
        // Alert on FOMO/Revenge trade
        // Daily P&L summary at EOD
    }
}
```

---

## Security Notes

1. **Change `JWT_SECRET`** before any deployment — minimum 32 chars, use a UUID
2. **MongoDB Atlas** — use IP whitelist, not `0.0.0.0/0` in production
3. **CORS** — set `ALLOWED_ORIGINS` to your exact frontend domain
4. **Passwords** — BCrypt with strength 10 (Spring default)
5. **HTTPS** — always terminate SSL at nginx/load balancer in production

---

## License

MIT License — free to use, modify, and distribute.

---

*Built with: Spring Boot 3.2 · Angular 17 · MongoDB Atlas · JWT Auth*
