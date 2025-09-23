# Operations & DevOps Documentation

[← Back to Main](../SOURCE_OF_TRUTH.md)

## Development Commands

### Core Development
```bash
npm run dev                     # Start dev server on port 3000
npm run build                   # Production build
npm run start                   # Start production server
npm run lint                    # Run ESLint
npm run typecheck              # TypeScript type checking
```

### Database Operations
```bash
# Schema Management
npx prisma generate            # Generate Prisma Client
npx prisma db push            # Push schema changes (dev)
npx prisma migrate dev        # Create and apply migrations
npx prisma migrate deploy     # Apply migrations (production)
npx prisma migrate reset      # Reset database (dev only)

# Database Tools
npx prisma studio             # Open GUI at port 5555
npm run db:seed              # Seed with initial data
npm run db:backup            # Backup database
npm run db:restore           # Restore from backup
```

### Testing
```bash
npm run test                  # Run all tests
npm run test:security        # Security test suite
npm run test:security:watch  # Watch mode
npm run test:security:ci     # CI mode with coverage
```

## Scripts Directory

### Admin & User Management
| Script | Purpose | Usage |
|--------|---------|-------|
| `create-admin.ts` | Create admin user | `npm run create-admin` |
| `create-user.ts` | Create any user | `tsx scripts/create-user.ts` |
| `ensure-project-members.ts` | Fix project memberships | `tsx scripts/ensure-project-members.ts` |
| `setup-module-access.mjs` | Configure module permissions | `node scripts/setup-module-access.mjs` |
| `verify-access.mjs` | Verify user access | `node scripts/verify-access.mjs` |

### Database Maintenance
| Script | Purpose | Usage |
|--------|---------|-------|
| `backup-database.ts` | Backup DB to file | `tsx scripts/backup-database.ts` |
| `restore-database.ts` | Restore from backup | `tsx scripts/restore-database.ts` |
| `add-indexes.ts` | Add missing indexes | `tsx scripts/add-indexes.ts` |
| `check-duplicates.mjs` | Find duplicate records | `node scripts/check-duplicates.mjs` |
| `seed-tasks-contacts.ts` | Seed test data | `tsx scripts/seed-tasks-contacts.ts` |

### Storage & Cleanup
| Script | Purpose | Usage |
|--------|---------|-------|
| `clear-invalid-storage.mjs` | Clean orphaned files | `node scripts/clear-invalid-storage.mjs` |

## Environment Variables

### Required Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client | `AIza...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | `project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage | `project.appspot.com` |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Admin SDK | Base64 encoded JSON |
| `WEBHOOK_SECRET` | Webhook auth | 32+ char secret |

### Optional Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Environment | `development` |
| `JWT_AUDIENCE` | Token audience | Firebase project ID |
| `SENTRY_DSN` | Error tracking | None |
| `NEXT_PUBLIC_APP_URL` | App URL | `http://localhost:3000` |

## Logging & Monitoring

### Winston Configuration
**File**: `lib/logger.ts`

```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
})
```

### Log Levels
- **error**: Application errors
- **warn**: Warning conditions
- **info**: Informational messages
- **debug**: Debug information

### Correlation IDs
Every API request gets a unique correlation ID:
```typescript
const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
```

## Docker Deployment

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: construction
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  caddy:
    image: caddy:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
```

## Caddy Configuration
**File**: `Caddyfile`

```
control.example.com {
    reverse_proxy app:3000

    header {
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000"
    }

    encode gzip

    handle_path /api/* {
        reverse_proxy app:3000
    }
}
```

## Database Migrations

### Migration Workflow
1. **Development**:
   ```bash
   # Make schema changes
   # Create migration
   npx prisma migrate dev --name add_feature

   # Test migration
   npx prisma migrate reset
   npx prisma migrate dev
   ```

2. **Staging**:
   ```bash
   # Apply pending migrations
   npx prisma migrate deploy

   # Verify
   npx prisma migrate status
   ```

3. **Production**:
   ```bash
   # Backup first
   npm run db:backup

   # Apply migrations
   npx prisma migrate deploy

   # Verify
   npx prisma db pull
   ```

### Rollback Strategy
```bash
# Create down migration
npx prisma migrate dev --create-only

# Edit migration SQL
# Apply specific migration
npx prisma migrate resolve --applied "migration_name"
```

## Health Checks

### Application Health
**Endpoint**: `/api/health`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "0.1.0",
  "database": "connected",
  "redis": "connected"
}
```

### Database Health
```typescript
// lib/health.ts
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'connected' }
  } catch (error) {
    return { status: 'disconnected', error }
  }
}
```

## Backup & Recovery

### Automated Backups
```bash
# Cron job for daily backups
0 2 * * * cd /app && npm run db:backup
```

### Manual Backup
```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Data only
pg_dump --data-only $DATABASE_URL > data_backup.sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema_backup.sql
```

### Restore Process
```bash
# Full restore
psql $DATABASE_URL < backup.sql

# With Prisma
npx prisma db push --skip-generate
npm run db:seed
```

## Performance Monitoring

### Next.js Analytics
```javascript
// next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true
  }
}
```

### Custom Metrics
```typescript
// lib/metrics.ts
export function trackApiCall(endpoint: string, duration: number) {
  logger.info('API Call', {
    endpoint,
    duration,
    timestamp: new Date().toISOString()
  })
}
```

## CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:security:ci

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: docker build -t app .
      - run: docker push registry/app
      - run: ssh server 'docker pull registry/app && docker-compose up -d'
```

## Security Checklist

- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] SSL certificates active
- [ ] Rate limiting enabled
- [ ] Logs rotation configured
- [ ] Health checks active
- [ ] Error tracking connected
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Secrets rotated regularly

---

[Next: Design System →](07-design-system.md) | [Back to Main →](../SOURCE_OF_TRUTH.md)