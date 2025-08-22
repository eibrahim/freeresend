# FreeResend Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- Vercel account
- GitHub repository (recommended)
- PostgreSQL database (managed service recommended)
- AWS SES account configured
- Domain name (optional)

### 1. Database Setup

**Recommended Services:**
- **Railway**: [railway.app](https://railway.app) - $5/month
- **Supabase**: [supabase.com](https://supabase.com) - Free tier available
- **PlanetScale**: [planetscale.com](https://planetscale.com) - Free tier available
- **Neon**: [neon.tech](https://neon.tech) - Free tier available

**Database Schema:**
```sql
-- Run the contents of database.sql in your PostgreSQL database
-- This creates all necessary tables and indexes
```

### 2. Environment Variables

Set these in Vercel Dashboard or using Vercel CLI:

```bash
# Required Variables
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-64-character-secret-key
DATABASE_URL=postgresql://user:pass@host:port/db
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-password

# Optional Variables
DO_API_TOKEN=dop_v1_...
WEBHOOK_URL=https://your-domain.vercel.app/api/webhooks/ses
```

### 3. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

#### Option B: Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL
# ... add all other variables
```

#### Option C: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Feibrahim%2Ffreeresend)

### 4. Domain Configuration

**Custom Domain:**
1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Update `NEXTAUTH_URL` to your custom domain

**SSL Certificate:**
- Automatically provisioned by Vercel
- Usually takes 5-10 minutes to activate

### 5. Post-Deployment Setup

**Database Initialization:**
```bash
# Connect to your database and run:
psql DATABASE_URL < database.sql
```

**Verify Deployment:**
1. Visit your deployed URL
2. Check `/api/health` endpoint
3. Test login with admin credentials
4. Add a test domain
5. Send a test email

**AWS SES Configuration:**
1. Verify your domain in AWS SES Console
2. Move out of sandbox mode (if needed)
3. Configure DKIM and SPF records
4. Set up SNS webhooks (optional)

### 6. Performance Optimization

**Vercel Configuration:**
- Edge functions enabled automatically
- Image optimization built-in
- Static file caching optimized

**Database:**
- Use connection pooling
- Enable read replicas for high traffic
- Monitor query performance

**Monitoring:**
- Vercel Analytics enabled by default
- Set up error tracking (Sentry recommended)
- Monitor AWS SES metrics

### 7. Scaling Considerations

**Traffic Growth:**
- Vercel scales automatically
- Database may need upgrading
- AWS SES limits may need increasing

**Multi-Region:**
- Configure multiple AWS regions
- Use Vercel Edge Network
- Consider database read replicas

### 8. Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` (64+ characters)
- [ ] Secure database passwords
- [ ] AWS IAM with minimal permissions
- [ ] Environment variables in Vercel (not in code)
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Regular security updates

### 9. Troubleshooting

**Common Issues:**

**Build Errors:**
```bash
# Check build logs in Vercel Dashboard
# Ensure all environment variables are set
vercel logs
```

**Database Connection:**
```bash
# Test database connection
node -e "const { Client } = require('pg'); const client = new Client(process.env.DATABASE_URL); client.connect().then(() => console.log('Connected!')).catch(console.error);"
```

**Email Sending:**
```bash
# Test email functionality
node test-email.js
```

### 10. Maintenance

**Regular Tasks:**
- Monitor Vercel usage and billing
- Update dependencies monthly
- Review AWS SES usage and limits
- Backup database regularly
- Monitor error rates and performance

**Updating:**
```bash
# For GitHub integration, just push to main branch
git push origin main

# For CLI deployment
vercel --prod
```

## Support

- **Documentation**: Check README.md and SETUP.md
- **Issues**: [GitHub Issues](https://github.com/eibrahim/freeresend/issues)
- **Professional Support**: [EliteCoders](https://elitecoders.co/)

---

**Total estimated cost for production deployment: $5-15/month**
- Vercel: Free (hobby) or $20/month (Pro)
- Database: $5-10/month (managed service)
- AWS SES: $1-5/month (based on volume)
- Domain: $10-15/year