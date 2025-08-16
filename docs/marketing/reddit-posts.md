# Reddit Posts for Different Subreddits

## r/selfhosted

**Title:** FreeResend: Self-hosted email service that's 100% compatible with Resend SDK

**Post:**
I got tired of paying premium prices for transactional emails across my side projects, so I built FreeResend - a self-hosted alternative to Resend that uses Amazon SES for delivery.

**Key features:**
- 100% API compatible with Resend (drop-in replacement)
- Uses Amazon SES ($0.10/1k emails vs premium SaaS pricing)  
- Auto-creates DNS records if you use Digital Ocean
- Next.js 15 + TypeScript + PostgreSQL
- Docker ready with included compose file
- MIT licensed

**Setup:** Clone repo → configure AWS SES + database → run `npm run dev` → start sending emails

Been running it in production for months across multiple projects with 85% cost savings.

For anyone self-hosting email infrastructure, curious about your current setup and pain points?

**GitHub:** https://github.com/eibrahim/freeresend

---

## r/webdev

**Title:** Built a drop-in replacement for Resend that saves 85% on email costs

**Post:**
Fellow developers, I built FreeResend after my Resend bills started adding up across multiple projects.

**The problem:** Love Resend's DX, but costs add up fast with multiple side projects and client work.

**The solution:** Self-hosted alternative that:
- Uses the exact same API as Resend (zero code changes)
- Leverages Amazon SES for delivery ($0.10/1k vs premium pricing)
- Auto-handles DNS setup with Digital Ocean integration
- Gives you complete control over email infrastructure

**Migration is literally:**
```javascript
// Just set this env var - that's it
RESEND_BASE_URL="https://your-freeresend.com/api"

// Your existing Resend code works unchanged
const resend = new Resend("your-freeresend-api-key");
```

Tech stack: Next.js 15, TypeScript, PostgreSQL, AWS SES SDK v3.

**GitHub:** https://github.com/eibrahim/freeresend

Anyone else finding SaaS email costs challenging at scale?

---

## r/SaaS

**Title:** Created an open-source alternative to Resend after email costs hit $200+/month

**Post:**
Running multiple SaaS products, our Resend costs were approaching $200+/month across projects. Built FreeResend as a solution.

**Business impact:**
- Reduced email costs by 85% (now using Amazon SES rates)
- Eliminated vendor lock-in concerns
- Faster domain setup (auto DNS vs manual configuration)
- Complete visibility into email delivery

**Technical approach:**
- 100% API compatibility with Resend (zero migration effort)
- Self-hosted Next.js application
- Amazon SES for reliable delivery
- Digital Ocean integration for automatic DNS setup
- Open source (MIT license)

**ROI:** For anyone sending 50k+ emails/month, the savings pay for the hosting costs within weeks.

The goal isn't to replace Resend for everyone - they're fantastic. But for cost-conscious founders and agencies, this provides the same DX at fraction of the cost.

**GitHub:** https://github.com/eibrahim/freeresend

Other SaaS founders - what's your email cost tipping point?

---

## r/entrepreneur

**Title:** Cut my email costs by 85% with this open-source Resend alternative

**Post:**
**Background:** Serial entrepreneur running 12+ side projects and client work. Email costs with Resend were eating into margins.

**The build:** Created FreeResend - self-hosted email service that's 100% compatible with Resend's API but uses Amazon SES for actual delivery.

**Business results:**
- 85% reduction in email costs (from ~$150/month to ~$20/month)
- Zero development time for migration (drop-in replacement)
- Eliminated dependency on external email provider
- Faster project launches (60-second domain setup vs 15+ minutes)

**Why share it open source:**
- Every entrepreneur faces this cost vs. functionality tradeoff
- Great developer tools shouldn't be exclusive to well-funded companies
- Community contributions make it better for everyone

**Perfect for:**
- Bootstrapped startups watching every dollar
- Agencies managing multiple client projects
- Side project enthusiasts
- Anyone wanting email infrastructure control

Not trying to bash Resend - they're excellent. But sometimes you need the same functionality at startup-friendly prices.

**GitHub:** https://github.com/eibrahim/freeresend

Fellow entrepreneurs - what's your approach to managing SaaS costs as you scale?

---

## r/sideproject

**Title:** Side project: Built a self-hosted alternative to Resend that saves me $100+/month

**Post:**
Like many of you, I'm running multiple side projects and the email costs were adding up fast with Resend.

**The side project:** FreeResend - basically Resend but self-hosted and using Amazon SES for delivery.

**Why I built it:**
- Multiple side projects = multiple email bills
- Wanted same great DX without the premium pricing
- Love tinkering with email infrastructure (weird hobby, I know)

**What makes it cool:**
- Drop-in replacement for Resend SDK (literally just change one env var)
- Auto-creates DNS records if you use Digital Ocean
- 85% cost savings using Amazon SES
- Open source so you can modify for your needs

**Tech stack:** Next.js 15, TypeScript, PostgreSQL, AWS SES, Docker

**Best part:** Domain setup went from 15+ minutes of manual DNS work to 60 seconds automated.

Now using it across 12 side projects with zero issues.

**GitHub:** https://github.com/eibrahim/freeresend

Anyone else building tools to reduce their side project operating costs?

---

## r/aws

**Title:** Built a Resend-compatible email service using SES SDK v3

**Post:**
Built FreeResend - an open-source email service that provides Resend's API compatibility while using Amazon SES for delivery.

**AWS Integration highlights:**
- SES SDK v3 for email sending (simple + raw with attachments)
- Automatic domain verification with SES
- DKIM key generation and DNS record creation
- Configuration sets for webhook handling
- Bounce/complaint processing
- Multi-region support

**Architecture:**
- Next.js 15 API routes for HTTP endpoints
- Direct SES integration (no middleware services)
- PostgreSQL for email logging and metrics
- Digital Ocean API for automated DNS setup (optional)

**Benefits over managed email services:**
- Pay only SES rates ($0.10/1k emails)
- Complete control over delivery settings
- Custom webhook processing
- No vendor lock-in

**Performance:** Handling 50k+ emails/month across production projects with 99.9%+ delivery rates.

The goal was Resend's excellent DX but at SES pricing. Mission accomplished.

**GitHub:** https://github.com/eibrahim/freeresend

Fellow AWS users - what's your preferred approach for transactional emails?

---

## r/nextjs

**Title:** Show r/nextjs: Email service built with Next.js 15 that's API-compatible with Resend

**Post:**
Built FreeResend using Next.js 15 - thought the community might find the architecture interesting.

**Next.js features used:**
- App Router with API routes for REST endpoints
- TypeScript throughout with strict types
- Server-side email processing
- Environment-based configuration
- Docker deployment with Next.js optimizations

**Interesting technical details:**
- Resend SDK compatibility using environment variable override
- AWS SES integration with attachment handling
- Real-time email logging and webhook processing
- Type-safe API route handlers with Zod validation
- PostgreSQL integration with connection pooling

**API structure:**
```
/api/emails - Resend-compatible email sending
/api/domains - Domain management and verification
/api/api-keys - API key generation and management
/api/webhooks/ses - SES event processing
```

**Why Next.js was perfect for this:**
- API routes made REST endpoints trivial
- TypeScript integration caught issues early  
- Easy deployment to various platforms
- Great developer experience

**Production stats:** Handling 50k+ emails/month, <100ms API response times, 99.9%+ uptime.

**GitHub:** https://github.com/eibrahim/freeresend

Always curious about other Next.js API-heavy projects - what patterns are you using?

---

## Posting Strategy Notes:

**Timing:**
- HN: Tuesday-Thursday, 8-10 AM PST
- Reddit: Varies by subreddit, generally weekdays

**Engagement:**
- Respond to all questions promptly
- Share specific metrics when asked
- Be humble about limitations
- Offer help with setup/migration
- Don't oversell - let the project speak for itself

**Follow-up:**
- Monitor comments for 24-48 hours
- Cross-post learnings to improve the project
- Thank contributors and early adopters
- Share updates in comments if relevant