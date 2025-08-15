# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FreeResend is a self-hosted, open-source alternative to Resend for sending transactional emails. It provides 100% Resend-compatible API using Amazon SES for email delivery, with optional Digital Ocean DNS automation for domain setup.

**Key Technologies:**
- Next.js 15 (App Router)
- TypeScript
- PostgreSQL (direct connection, migrated from Supabase)
- Amazon SES SDK v3
- Digital Ocean API
- JWT authentication
- bcryptjs for password hashing

## Development Commands

```bash
# Development
npm run dev         # Start development server with Turbopack

# Production
npm run build       # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint

# Testing
node test-email.js  # Comprehensive email testing (API + Resend SDK)
./test-curl.sh      # Quick cURL-based API test
```

## Architecture Overview

### Core Structure
- **API Layer**: Next.js App Router API routes (`/src/app/api/`)
- **Business Logic**: Modular libraries in `/src/lib/`
- **Database**: Direct PostgreSQL with connection pooling
- **Frontend**: React dashboard components in `/src/components/`

### Database Architecture
The project uses **direct PostgreSQL** (not Supabase) with:
- Connection pooling via `pg` package
- Transaction support
- Auto-updating timestamps via triggers
- UUID primary keys
- JSONB fields for flexible data (DNS records, email arrays)

**Key Tables:**
- `users` - Admin user accounts
- `domains` - Email sending domains with SES integration
- `api_keys` - API authentication keys (bcrypt hashed)
- `email_logs` - All sent email records with delivery status
- `webhook_events` - SES delivery event processing

### Integration Architecture

**Amazon SES Integration** (`/src/lib/ses.ts`):
- Domain verification and DKIM setup
- Email sending (simple and raw with attachments)
- Configuration sets and webhook handling
- Bounce/complaint processing

**Digital Ocean DNS** (`/src/lib/digitalocean.ts`):
- Automatic DNS record creation (TXT, MX, SPF, DMARC, DKIM)
- Domain validation
- Error handling and manual fallback

**API Key System** (`/src/lib/api-keys.ts`):
- Format: `frs_{keyId}_{secretPart}` 
- bcrypt hashing with prefix for identification
- Domain-scoped permissions

## API Design Patterns

### Resend Compatibility
The project maintains **100% compatibility** with Resend SDK by:
- Matching exact API endpoint structure (`/api/emails`)
- Supporting same request/response formats
- Using environment variable `RESEND_BASE_URL` for endpoint override

### Authentication Flow
1. **Admin Login**: JWT tokens via `/api/auth/login`
2. **API Keys**: Bearer token authentication for email operations
3. **Middleware**: `withAuth()` and `withApiKeyAuth()` helpers

### Error Handling Pattern
Consistent error responses with:
```typescript
{ error: "Error message", details?: "Additional info" }
```

## Key Development Patterns

### Database Operations
Always use the connection pool and transaction helpers:
```typescript
import { query, transaction } from "@/lib/database";

// Simple query
const result = await query("SELECT * FROM users WHERE id = $1", [userId]);

// Transaction
const result = await transaction(async (client) => {
  // Multiple operations
  return result;
});
```

### API Route Structure
Follow the established pattern in `/src/app/api/`:
- Use proper HTTP methods (GET, POST, DELETE)
- Apply authentication middleware
- Return consistent JSON responses
- Handle errors gracefully

### Component Organization
- **Dashboard.tsx**: Main container with tab switching
- **[Feature]Tab.tsx**: Individual feature components
- **LoginForm.tsx**: Authentication handling
- Use React hooks and context for state management

## Environment Configuration

Required environment variables:
```bash
# Database (PostgreSQL)
DATABASE_URL=postgresql://...

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Digital Ocean (optional)
DO_API_TOKEN=...

# Security
NEXTAUTH_SECRET=...

# Admin Setup
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

## Testing Strategy

**Primary Test Script**: `node test-email.js`
- Tests direct API calls
- Validates Resend SDK compatibility  
- Checks email log functionality
- Sends actual test emails

**Quick Test**: `./test-curl.sh`
- Fast cURL-based validation
- Useful for CI/CD integration

## Database Migration Notes

The project recently migrated from Supabase to direct PostgreSQL:
- Connection pooling replaces Supabase client
- Row Level Security removed (handled in application layer)
- Direct SQL queries replace Supabase query builder
- Types maintained for compatibility

## Domain Setup Workflow

1. **Add Domain**: POST `/api/domains` with domain name
2. **DNS Records**: Auto-created (DO) or manual setup required
3. **SES Verification**: Automatic domain verification with AWS
4. **DKIM Setup**: Automatic DKIM key generation and DNS records
5. **API Key Creation**: Generate keys for verified domains only
6. **Email Sending**: Use API keys with Resend-compatible endpoints

## Common Development Tasks

### Adding New API Endpoints
1. Create route file in `/src/app/api/[path]/route.ts`
2. Add business logic to appropriate `/src/lib/` file
3. Apply authentication middleware if needed
4. Update types in `/src/lib/database.ts` if database changes required

### Database Schema Changes
1. Update `/database.sql` with new schema
2. Update TypeScript interfaces in `/src/lib/database.ts`
3. Test with `node test-email.js`

### Testing Email Functionality
Always test with real email addresses and verify:
- Email delivery via AWS SES console
- Webhook processing for delivery events
- Email logs in dashboard
- API key authentication

## Security Considerations

- All passwords are bcrypt hashed (rounds: 12)
- API keys are hashed with identifiable prefixes
- JWT tokens for dashboard authentication
- Direct database queries use parameterized statements
- Environment variables for all sensitive data
- CORS handling for cross-origin requests

## Production Deployment

The application supports multiple deployment methods:
- **Vercel**: Serverless deployment (recommended)
- **Docker**: Containerized deployment
- **Traditional**: Node.js server deployment

Key production requirements:
- PostgreSQL database (hosted)
- AWS SES out of sandbox mode
- SSL certificates for HTTPS
- Environment variables configured
- Database schema initialized