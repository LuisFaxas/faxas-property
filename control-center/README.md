# Control Center - Construction Management System

A production-ready construction management system for the Miami Duplex Remodel project, featuring role-based access control, real-time collaboration, and automated workflows.

## 🚀 Features

- **Dual Dashboard System**: Separate interfaces for Admin/Staff and Contractors
- **Firebase Authentication**: Secure Google and email/password authentication with role-based access
- **PostgreSQL Database**: Robust data management with Prisma ORM
- **File Management**: Firebase Storage integration with signed URLs
- **Automation**: n8n workflow automation for Gmail, Google Calendar, and notifications
- **Modern UI**: Dark glassmorphism theme with responsive design
- **Module-based Access Control**: Granular permissions per contractor per project

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Authentication**: Firebase Auth with custom claims
- **Database**: PostgreSQL (Neon/Supabase) with Prisma ORM
- **File Storage**: Firebase Storage
- **Automation**: n8n workflows
- **Deployment**: Docker, Caddy (reverse proxy)

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL database (local or cloud)
- Firebase project
- Docker & Docker Compose (for deployment)

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Next.js
NODE_ENV=development

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (base64-encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64=base64-encoded-json

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# App Secrets
WEBHOOK_SECRET=your-webhook-secret-min-32-chars
JWT_AUDIENCE=your-firebase-project-id

# Optional
SENTRY_DSN=your-sentry-dsn
```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Authentication (Google + Email/Password providers)
4. Get client SDK config from Project Settings > General
5. Generate service account key from Project Settings > Service Accounts
6. Encode service account JSON to base64: `base64 -i service-account.json`

### Database Setup (Neon)

1. Sign up at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Update `DATABASE_URL` in `.env.local`

### Database Setup (Supabase)

1. Sign up at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (use "Transaction" mode)
5. Update `DATABASE_URL` in `.env.local`

## 🚀 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with initial data
npm run db:seed
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Access Database Studio

```bash
npm run db:studio
```

Visit http://localhost:5555

## 🔐 Initial Admin Setup

### 1. Create Admin User

1. Sign up using Firebase Auth (Google or Email)
2. Note the user's UID from Firebase Console

### 2. Set Admin Role

```bash
curl -X POST http://localhost:3000/api/admin/set-claims \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-webhook-secret" \
  -d '{
    "uid": "firebase-user-uid",
    "role": "ADMIN"
  }'
```

### 3. Delete Set-Claims Route

After setting up initial admin, delete the file for security:
```bash
rm app/api/admin/set-claims/route.ts
```

## 📦 Docker Deployment

### 1. Build and Run Locally

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Production Deployment (VPS)

1. **Prepare VPS**:
   - Install Docker and Docker Compose
   - Point domain DNS to VPS IP
   - Open ports 80, 443

2. **Update Configuration**:
   - Edit `Caddyfile` with your domain
   - Update environment variables in `.env.production`

3. **Deploy**:
```bash
# Clone repository on VPS
git clone <your-repo-url>
cd control-center

# Create production env file
cp .env.local .env.production
# Edit .env.production with production values

# Start services
docker-compose -f docker-compose.yml up -d
```

## 🔄 n8n Automation Setup

### 1. Access n8n

- Local: http://localhost:5678
- Production: https://n8n.yourdomain.com
- Default credentials: admin/changeme (change immediately)

### 2. Gmail Integration

1. Create Gmail trigger node
2. Set up OAuth2 authentication
3. Configure label filter: "Construction/Inbound"
4. Add HTTP Request node:
   - URL: `https://control.yourdomain.com/api/webhooks/gmail-inbound`
   - Method: POST
   - Headers: `x-webhook-secret: your-webhook-secret`

### 3. Google Calendar Sync

1. Create Calendar trigger node
2. Set up OAuth2 authentication
3. Add HTTP Request node:
   - URL: `https://control.yourdomain.com/api/webhooks/calendar-event`
   - Method: POST
   - Headers: `x-webhook-secret: your-webhook-secret`

### 4. Notification Flow

1. Create Webhook trigger
2. Add Gmail node for sending emails
3. Configure templates for:
   - Contractor invitations
   - Schedule confirmations
   - Invoice status updates

## 🧪 Testing

### Run E2E Tests

```bash
# Install Playwright
npx playwright install

# Run tests
npm run test:e2e
```

### Run Unit Tests

```bash
npm run test
```

## 📊 Database Management

### Migrations

```bash
# Create migration
npx prisma migrate dev --name migration-name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backup

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## 🔒 Security Checklist

- [ ] Change default n8n credentials
- [ ] Set strong `WEBHOOK_SECRET` (min 32 characters)
- [ ] Delete `/api/admin/set-claims` route after initial setup
- [ ] Enable 2FA for admin accounts in Firebase
- [ ] Configure Firebase Storage rules
- [ ] Set up rate limiting on API routes
- [ ] Enable CORS only for trusted domains
- [ ] Regular security updates for dependencies
- [ ] Set up SSL certificates (automatic with Caddy)
- [ ] Configure firewall rules on VPS

## 📱 Firebase Storage Rules

Add to Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuth() { 
      return request.auth != null; 
    }
    
    // Contractor uploads
    match /projects/{projectId}/contractors/{uid}/{rest=**} {
      allow write: if isAuth() && request.auth.uid == uid;
      allow read: if false; // Use signed URLs
    }
    
    // Plans
    match /projects/{projectId}/plans/{rest=**} {
      allow read, write: if false; // Admin API only
    }
  }
}
```

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.ts` to customize the graphite theme:

```typescript
colors: {
  graphite: {
    900: '#0f1115', // Darkest
    // ... adjust as needed
  },
  accent: {
    500: '#8EE3C8', // Primary accent
  }
}
```

### Glass Effects

Modify in `app/globals.css`:

```css
.glass {
  background: rgba(20, 22, 27, 0.55);
  backdrop-filter: blur(8px);
  /* Adjust opacity and blur as needed */
}
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check DATABASE_URL format
postgresql://user:pass@host:5432/db?sslmode=require
```

### Firebase Auth Issues

1. Check Firebase project settings
2. Verify service account permissions
3. Ensure auth providers are enabled

### Docker Issues

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📝 API Documentation

### Core Endpoints

- `GET /api/health` - Health check
- `POST /api/admin/invite-contractor` - Invite contractor (Admin only)
- `POST /api/signed-url` - Generate signed URL for file access
- `POST /api/webhooks/gmail-inbound` - Gmail webhook
- `POST /api/webhooks/calendar-event` - Calendar webhook

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## 🚦 Status

- ✅ Core functionality implemented
- ✅ Authentication system
- ✅ Database schema and migrations
- ✅ Admin dashboard
- ✅ Contractor dashboard
- ✅ API endpoints
- ✅ Docker configuration
- 🔄 n8n automation flows (configuration required)
- 🔄 Testing suite (in progress)
- 🔄 Production deployment (ready for deployment)

---

Built with ❤️ for the Miami Duplex Remodel Project
