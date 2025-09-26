# Vercel Environment Variables

Copy these environment variables exactly as shown into your Vercel project settings.

## Instructions
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable below (name and value)
4. Select **Production**, **Preview**, and **Development** for all variables
5. Make sure Root Directory is empty or set to `.` (dot)

## Environment Variables (12 total)

### Firebase Client Configuration (5 variables)

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCoVJXYGRLkgSqjwYK8_vJ6q5IOYyb_Kio
```

```
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=faxas-property.firebaseapp.com
```

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=faxas-property
```

```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=faxas-property.firebasestorage.app
```

```
NEXT_PUBLIC_FIREBASE_APP_ID=1:693706017245:web:6a71d424a7a6e70776ce34
```

### Firebase Admin Configuration (1 variable)

```
FIREBASE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZmF4YXMtcHJvcGVydHkiLAogICJwcml2YXRlX2tleV9pZCI6ICJjMDFjZTg0ZTllNDVlNTkyZTBjNTEyN2FlZDFiNTFkZGQ4Zjk1MjU5IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdlFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLY3dnZ1NqQWdFQUFvSUJBUUM3aWlwaXBLTXVyMi9YXG5hdEtiWWJtVkI1NWFmOGRvT2Z0UGJzTFNxUThWWVdzM2loMDRPMWVrL2ZMMlFWYTNVcmZGQXlLdm5hQkduQTVGXG5IVTF5SCtkbzczM2IxR1l6OU15SjJqc1hnUWZVNHlxVkVBSXpOSXZsNWZLZUNFdHptUWVxVXFrZHVZR3E4cm05XG5uVlgxOG4zWWU1SEZxQWtEU0RwNkdBNmFJRDNQR0xjQzVUbHFDZ2Rzb3dvQituWHZOMUFhMGw3ZThISWR3MXBIXG5mYVMreGFsRUpneFR0d2JjWjdSMm51VHVVcnI1MXhQb0JxbWxFTlV3Q29Cd0JSbm9Ma0R3NTlHMHVubldDUUhaXG5lQlhtZ1JnbG9BOVdoMm05VnVhVmlBeGFIVGE2TWV3VlVjdmpOMzVGdXlhK2pzVnVpSHBkWkZtWjZON2dENW9BXG5CcnV3VU9VckFnTUJBQUVDZ2dFQUFsVk5naDlpR2xuTnN3MmQwWmZJMzhyYStQK3gxVE5YZUcrWDFqT0s5clpZXG43RFY0VTNPT3NqdHh2RkM2TjJRWUlzZjlJa1Y4YUtJeVFtVnczRXRwTFNDS3l6NjM0eFVxR1c1alJqOWZFaEo1XG5LaFJQK3JIU3ZKdU8yRDh6ZFJ5QmdHaDVsRTBGbTFOY2Q0R3E5cDI3cFRvUVZ5V3habkQ3WkIrZXBBZlI4WnkwXG4wUXluRitKVWN2b0JBZENVNmF0STAyLzR2Qy9heWZpWGtzVFBXTTN6OVZjSGw2S3U0cXlLY0dPYVFxbWNpSTFZXG4yTkMrejNjVDE1R2ZxTHk2RDZhOXdoN2pxbitDSkw1WTdnbDNCamNxbXk0dWdJV21tU053SnJQVFBqRVBscUU0XG5Ob0xxYTlEUWhYdjREYmZBb0xOVWZFRU9oQVZrS0xrTUlIQStMTjdRUFFLQmdRRDY1S0d0R1M0cEMrYjdpc2QxXG5OSE5MZzNGamM1MlE1bDNQWkhNYUxPODQrUFVPUGRjbERsL1d0UGt1d1JGQ1dkTDV6Rk9iM21aVkJKbTBFdXlPXG4ycmxqaUVxTEdjSytWR3BIelRXcGhyMFNqdE4vMW5ycHp3SlZQS3l6aUNud3crcGdLZ2psTEZTTzdmY1ltWW5KXG5FYlBXTy96UVgvWVgzNUczSmpsaDZEQ3RKUUtCZ1FDL1cyaVRFNzk3Nng4a2VteFg5U3VFdGxpbkM1bmoyYVZWXG5GWTludWtTM3NxWXhZLzFkMHZjZmQwLzQrRUhLZWNzeFJNMEhlYkFxK0VZWC9DNXRkeHBtM0NlbDEzeSt4TkFsXG5QUmZGWldFNG9xUEJDejl3RFVTSUVDMzJIWC82MFZ1MmIwclo0WWtDcTZUN2hFZ0xpYXk3QytnUmE5cTVhNkJRXG5PdHhYUWIvQUR3S0JnQWozUHFmVzdJVmUvWVFqczNrR3hOQUFCSDlQVkdRbk4xYi8rZlVIZ2cwQktKQzN1UWFEXG4rdnpMUHRSaTVlRC9JTUQ0Z2t4aHFEcUZqWkNYMUloT1hLMm40eklSVzVvOW5nYXUyS29VUEpGN05TZXVYSG9hXG5nYlRXRkQzZU1kRit6dE5jN1RCell4b3dldElRT3BKSzVhaFVRSGFaMTB1SEc4ZjF2N3MxOXZkWkFvR0JBS0ExXG5VbzlZeUVkaWFiZHJ1OHZFV3dRSWVwNllpdVlGc1hOVDByV0FjTW52aTA3c3JSTGhicjdzY0lzOHBqQnoyZGZOXG5CMjlMeFYra2IyTGpZcWVKUVJSL0c3NndkQ052dWVpRGhxUmdwWTM2Tk9tSmxqb2xFWXh0SjEzWUF1OG1Xd2VaXG5rK3hvOUFIRlhTS3E5SHFjY0g1RmtLME5SSmxhNzJSY2MxK21qM2luQW9HQVA1QjZRNXpuRWI0Z0NMTjliNXdFXG5DZ2hBSlZEY1F5WDFrRWgxM083czVIREpZMnE1QzZKK2luWXJFSFUzSGFLSVg2cjlYQTI5YnZScXNrd0kvU0NoXG5ubHlzaW1mbWRDL3Z1ZkVraEV3OHljQkdCY2ZlcnFGNmY4NUd2SVA5Vzdyb0lVWktDVUFtdk4rditpOUFVNHovXG55c0FmbXJMOGVOd2plYzRvWER0QlBxcz1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BmYXhhcy1wcm9wZXJ0eS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTM4ODI3OTk5MjM4NDg1ODQwNDAiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwZmF4YXMtcHJvcGVydHkuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K
```

### Database Configuration (1 variable)

```
DATABASE_URL=postgresql://postgres:AXvz9QLt9YjAeNgg@db.xaydusadyemjlbhrkaxd.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### Supabase Configuration (2 variables)

```
NEXT_PUBLIC_SUPABASE_URL=https://xaydusadyemjlbhrkaxd.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhheWR1c2FkeWVtamxiaHJrYXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDE1NDcsImV4cCI6MjA3MTM3NzU0N30._ibCEojJxZ8Z1UQ-6Y495TA02KNzMpKLM8ryY0oSrqc
```

### Application Secrets (2 variables)

```
WEBHOOK_SECRET=xK9mN3pQ7vR2wS8tL6hF4jG5bY1aZ0cD
```

```
JWT_AUDIENCE=faxas-property
```

### Feature Flags (1 variable)

```
NEXT_PUBLIC_DASHBOARD_V2=false
```

## Important Notes

1. **DO NOT** add quotes around any values
2. **DO NOT** add spaces before or after the = sign
3. The `FIREBASE_SERVICE_ACCOUNT_BASE64` is ONE LONG LINE (no line breaks)
4. Copy each line exactly as shown
5. Select **Production**, **Preview**, and **Development** environments for all variables
6. Make sure **Root Directory** is empty or `.` (dot)

## Verification Checklist

- [ ] 5 NEXT_PUBLIC_FIREBASE_* variables
- [ ] 1 FIREBASE_SERVICE_ACCOUNT_BASE64 variable
- [ ] 1 DATABASE_URL variable
- [ ] 2 NEXT_PUBLIC_SUPABASE_* variables
- [ ] 2 App secrets (WEBHOOK_SECRET, JWT_AUDIENCE)
- [ ] 1 Feature flag (NEXT_PUBLIC_DASHBOARD_V2)
- [ ] Total: 12 environment variables

## What Each Variable Does

- **NEXT_PUBLIC_FIREBASE_*** - Firebase client-side configuration for authentication
- **FIREBASE_SERVICE_ACCOUNT_BASE64** - Firebase Admin SDK credentials for server-side operations
- **DATABASE_URL** - PostgreSQL database connection string (Supabase)
- **NEXT_PUBLIC_SUPABASE_*** - Supabase client configuration (optional, for future features)
- **WEBHOOK_SECRET** - Secret for validating webhook requests
- **JWT_AUDIENCE** - JWT token validation audience
- **NEXT_PUBLIC_DASHBOARD_V2** - Feature flag for dashboard version

## Troubleshooting

If deployment fails:
1. Ensure all variables are copied exactly (no quotes, no extra spaces)
2. Check that Root Directory is empty or set to `.`
3. Make sure all variables are enabled for Production, Preview, and Development
4. The FIREBASE_SERVICE_ACCOUNT_BASE64 must be one continuous string