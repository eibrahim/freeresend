# Design Document

## Overview

This design implements a comprehensive waitlist and pricing strategy system for FreeResend's upcoming hosted version. The solution integrates seamlessly with the existing Next.js application, adding email collection functionality, enhanced pricing page experience, and competitive pricing strategy display. The design leverages the existing PostgreSQL database, Tailwind CSS styling, and follows established patterns from the current codebase.

## Architecture

### System Components

1. **Database Layer**: New `waitlist_signups` table in PostgreSQL
2. **API Layer**: RESTful endpoints for waitlist management
3. **UI Components**: Enhanced pricing page with integrated waitlist signup
4. **Homepage Integration**: Pricing discovery and navigation improvements
5. **Admin Interface**: Waitlist management and analytics

### Data Flow

```
User Journey:
Homepage → Pricing Discovery → Pricing Page → Calculator Interaction → Waitlist Signup → Confirmation

Admin Journey:
Dashboard → Waitlist Tab → Analytics & Export → Email Campaign Management
```

## Components and Interfaces

### Database Schema

**New Table: `waitlist_signups`**
```sql
CREATE TABLE waitlist_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  estimated_volume INTEGER,
  current_provider VARCHAR(100),
  referral_source VARCHAR(100),
  user_agent TEXT,
  ip_address INET,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints

**POST /api/waitlist**
- Purpose: Add email to waitlist
- Input: `{ email, estimatedVolume?, currentProvider?, utmParams? }`
- Output: `{ success: boolean, message: string }`
- Validation: Email format, duplicate handling

**GET /api/waitlist** (Admin only)
- Purpose: Retrieve waitlist analytics and entries
- Output: `{ total: number, recent: WaitlistEntry[], analytics: Analytics }`
- Authentication: Admin API key required

**GET /api/waitlist/export** (Admin only)
- Purpose: Export waitlist as CSV
- Output: CSV file download
- Authentication: Admin API key required

### React Components

**WaitlistSignup Component**
```typescript
interface WaitlistSignupProps {
  estimatedVolume?: number;
  onSuccess?: () => void;
  compact?: boolean;
}
```

**Enhanced PricingCalculator Component**
- Integrates waitlist signup form
- Shows hosted version pricing tiers
- Displays competitive analysis
- Includes call-to-action for waitlist

**WaitlistTab Component** (Admin Dashboard)
- Analytics dashboard
- Email list management
- Export functionality
- Signup trends visualization

### Homepage Enhancements

**Pricing Discovery Section**
- Prominent "See Pricing" button in hero section
- Pricing comparison teaser in benefits section
- Cost savings calculator preview
- Clear hosted version messaging

## Data Models

### WaitlistSignup Interface
```typescript
interface WaitlistSignup {
  id: string;
  email: string;
  estimatedVolume?: number;
  currentProvider?: string;
  referralSource?: string;
  userAgent?: string;
  ipAddress?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Pricing Strategy Model
```typescript
interface HostedPricingTier {
  name: string;
  monthlyFee: number;
  includedEmails: number;
  overageRate: number; // per 1000 emails
  features: string[];
  recommended?: boolean;
}

interface PricingComparison {
  volume: number;
  freeResendSelfHosted: number;
  freeResendHosted: number;
  resendCost: number;
  savings: {
    vsResend: number;
    percentage: number;
  };
}
```

## Error Handling

### API Error Responses
- **400 Bad Request**: Invalid email format, missing required fields
- **409 Conflict**: Email already exists in waitlist
- **429 Too Many Requests**: Rate limiting for signup attempts
- **500 Internal Server Error**: Database or server errors

### Client-Side Error Handling
- Form validation with real-time feedback
- Network error recovery with retry mechanism
- Graceful degradation for JavaScript disabled users
- Toast notifications for success/error states

### Database Error Handling
- Unique constraint violations (duplicate emails)
- Connection pool exhaustion
- Transaction rollback on failures
- Proper error logging and monitoring

## Testing Strategy

### Unit Tests
- **Waitlist API endpoints**: Input validation, database operations, error scenarios
- **PricingCalculator enhancements**: Waitlist integration, form submission, state management
- **Database operations**: CRUD operations, constraint handling, data integrity
- **Utility functions**: Email validation, pricing calculations, analytics

### Integration Tests
- **End-to-end waitlist flow**: Homepage → Pricing → Signup → Confirmation
- **Admin dashboard**: Waitlist management, export functionality, analytics
- **API integration**: Frontend-backend communication, error handling
- **Database integration**: Schema validation, data persistence, query performance

### Component Tests
- **WaitlistSignup component**: Form submission, validation, success states
- **Enhanced PricingCalculator**: Integration with waitlist, user interactions
- **Homepage pricing sections**: Navigation, call-to-action functionality
- **Admin WaitlistTab**: Data display, export functionality, analytics

## Pricing Strategy Design

### Hosted Version Tiers

**Starter Tier**
- $15/month base fee
- 10,000 included emails
- $0.15 per 1,000 additional emails
- Basic support
- Standard features

**Professional Tier** (Recommended)
- $35/month base fee
- 50,000 included emails
- $0.12 per 1,000 additional emails
- Priority support
- Advanced analytics
- Custom domains

**Enterprise Tier**
- $75/month base fee
- 200,000 included emails
- $0.10 per 1,000 additional emails
- Dedicated support
- SLA guarantees
- Custom integrations

### Competitive Positioning
- 50-70% savings compared to Resend
- Linear pricing (no tier jumps)
- Transparent cost structure
- Self-hosted option remains free

## Security Considerations

### Data Protection
- Email addresses encrypted at rest
- GDPR compliance for EU users
- Data retention policies
- Secure data export mechanisms

### API Security
- Rate limiting on waitlist endpoints
- Input sanitization and validation
- CSRF protection for form submissions
- Admin authentication for management endpoints

### Privacy
- Minimal data collection
- Clear privacy policy updates
- Opt-out mechanisms
- Cookie consent for tracking

## Performance Optimization

### Database Performance
- Indexes on email and created_at columns
- Connection pooling for concurrent requests
- Query optimization for analytics
- Pagination for large datasets

### Frontend Performance
- Lazy loading for pricing calculator
- Optimistic UI updates for form submission
- Caching for pricing calculations
- Progressive enhancement for core functionality

### Caching Strategy
- Static pricing data caching
- API response caching for analytics
- CDN caching for static assets
- Browser caching for repeated visits

## Monitoring and Analytics

### Metrics to Track
- Waitlist signup conversion rate
- Traffic source attribution
- Pricing calculator usage patterns
- Email volume distribution in signups

### Error Monitoring
- API endpoint error rates
- Database connection issues
- Form submission failures
- Client-side JavaScript errors

### Business Intelligence
- Signup trends over time
- Geographic distribution of signups
- Estimated revenue potential
- Competitive analysis effectiveness