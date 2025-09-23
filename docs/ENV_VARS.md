# Environment Variables Reference

## Required Variables
| Variable | Purpose | Used In |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `lib/prisma.ts`, API routes |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client API key | `lib/firebaseClient.ts` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `lib/firebaseClient.ts` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `lib/firebaseClient.ts` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `lib/firebaseClient.ts` |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 encoded service account JSON | `lib/firebaseAdmin.ts` |
| `WEBHOOK_SECRET` | Webhook authentication secret (32+ chars) | Webhook endpoints |

## Optional Variables
| Variable | Purpose | Default | Used In |
|----------|---------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | Throughout app |
| `JWT_AUDIENCE` | Token audience | Firebase project ID | Auth validation |
| `SENTRY_DSN` | Error tracking | None | Error boundaries |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` | Email templates |
| `LOG_LEVEL` | Winston log level | `info` | `lib/logger.ts` |

## Security Notes
- NEVER commit actual values to repository
- Use `.env.local` for local development
- Use environment secrets in production
- Rotate WEBHOOK_SECRET regularly
- Keep Firebase service account secure

## Source
Per SOT Operations documentation (`/docs/06-operations.md`)