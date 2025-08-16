# Hacker News Post

## Title Options:
1. **FreeResend: Open-source, self-hosted alternative to Resend with 85% cost savings**
2. **Show HN: FreeResend – Drop-in Resend replacement using Amazon SES**
3. **Built FreeResend: Self-hosted email service with auto DNS setup (85% cheaper than Resend)**

## Post Content:

I built FreeResend after my email costs across multiple side projects started getting expensive with Resend (which I still think is fantastic, btw).

**What it is:** A self-hosted, open-source alternative to Resend that uses Amazon SES for actual email delivery while maintaining 100% API compatibility.

**Why it matters:**
- 85% cost reduction (Amazon SES rates: $0.10/1k emails vs premium pricing)
- True drop-in replacement - just set RESEND_BASE_URL env var
- Auto-creates DNS records if you use Digital Ocean (optional)
- Complete control over your email infrastructure

**Technical stack:**
- Next.js 15 + TypeScript
- Direct PostgreSQL (no external DB services)
- AWS SES SDK v3
- Digital Ocean API integration
- Docker ready

**The magic moment:** Add domain → auto-create 7 DNS records → sending emails in <60 seconds vs 15+ minutes of manual DNS setup.

I've been running it in production across 12 projects for months. MIT licensed, well-documented, includes test scripts.

Curious what the HN community thinks about self-hosted alternatives to popular SaaS tools?

**GitHub:** https://github.com/eibrahim/freeresend

---

## Comment Strategy:
- Be ready to answer technical questions about SES integration
- Discuss the trade-offs (setup complexity vs cost savings)
- Share specific metrics if asked
- Acknowledge Resend's strengths while explaining the use case for alternatives
- Be helpful, not defensive if people prefer SaaS solutions