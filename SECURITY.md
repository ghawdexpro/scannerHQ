# Security Policy

## Overview

This document outlines the security measures, best practices, and procedures for the Solar Scan GE application.

## Reporting Security Vulnerabilities

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please report security issues to: **security@ghawdexengineering.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 48 hours and resolve critical issues within 7 days.

## Security Measures Implemented

### 1. Environment Variables & Secrets

**Protected Secrets:**
- Never commit `.env.local` files
- Use environment variables for all API keys
- Separate client-side and server-side credentials

**Environment Variable Naming:**
- `NEXT_PUBLIC_*` - Client-side accessible (use only for non-sensitive data)
- Without prefix - Server-side only (use for API keys, service role keys)

**Critical Variables:**
```bash
# Server-side only - NEVER expose to client
GOOGLE_SOLAR_API_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
SENDGRID_API_KEY=xxx

# Client-side accessible - safe to expose
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

**Before GitHub Push:**
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Check no secrets are hardcoded in source files
- [ ] Ensure `.env.example` contains only placeholder values
- [ ] Rotate any accidentally committed secrets immediately

### 2. HTTP Security Headers

Implemented in `next.config.ts`:

- **Strict-Transport-Security (HSTS)**: Force HTTPS for 2 years
- **X-Frame-Options**: Prevent clickjacking (SAMEORIGIN)
- **X-Content-Type-Options**: Prevent MIME sniffing
- **X-XSS-Protection**: Enable browser XSS protection
- **Content-Security-Policy (CSP)**: Restrict resource loading
- **Referrer-Policy**: Control referrer information
- **Permissions-Policy**: Disable unnecessary browser features

### 3. Content Security Policy (CSP)

Allowed sources:
- **Scripts**: Self, Google Maps, Google Tag Manager (for analytics)
- **Styles**: Self, Google Fonts (inline styles for React components)
- **Images**: Self, data URIs, HTTPS sources (for satellite imagery)
- **Connect**: Self, Google APIs, Supabase, SendGrid
- **Fonts**: Self, Google Fonts
- **Frames**: Self, Google Maps

**Note**: `unsafe-inline` and `unsafe-eval` are required for Next.js and Google Maps. Consider using nonces in production for stricter CSP.

### 4. Rate Limiting

Implemented in `src/lib/middleware/rate-limit.ts`:

**General API Limits:**
- 60 requests per minute per client
- Client identification: IP + User-Agent fingerprint
- Returns HTTP 429 with `Retry-After` header

**Analysis-Specific Limits:**
- 100 solar analyses per day per client
- Prevents abuse of Google Solar API quota
- Resets at midnight UTC

**Usage in API Routes:**
```typescript
import { rateLimit, analysissRateLimit } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  // Your API logic here
}
```

**Production Considerations:**
- Current implementation uses in-memory storage
- For multi-instance deployments, use Redis or similar
- Consider implementing sliding window algorithm for more granular control

### 5. Input Validation & Sanitization

All utilities in `src/lib/utils/validation.ts`:

**Always validate:**
- Email addresses (Malta format preferred)
- Phone numbers (Malta: +356 or 8 digits)
- Coordinates (within Malta/Gozo bounds)
- Addresses (max 200 chars, sanitized)
- User names (min 2 chars, sanitized)

**Usage:**
```typescript
import { validateLeadData, validateAnalysisParams } from '@/lib/utils/validation'

const result = validateLeadData(requestBody)
if (!result.valid) {
  return NextResponse.json({ errors: result.errors }, { status: 400 })
}

// Use result.data (sanitized and validated)
```

**XSS Prevention:**
- Use `sanitizeHTML()` for user-generated content
- Use `sanitizeString()` for text inputs
- Never use `dangerouslySetInnerHTML` without sanitization

**SQL Injection Prevention:**
- Always use Supabase parameterized queries
- Never concatenate user input into SQL strings
- Use `escapeSQLString()` only as a last resort

### 6. API Key Security

**Google Maps API Key:**
- Enable HTTP referrer restrictions in Google Cloud Console
- Restrict to your domain: `ghawdexengineering.com/*`, `*.vercel.app/*`
- Enable only required APIs (Maps JavaScript, Geocoding, Solar, Static Maps)
- Set quota limits to prevent bill shock

**Google Solar API Key:**
- Keep server-side only (not `NEXT_PUBLIC_*`)
- Set daily quota limits
- Use fallback to AI analysis when quota exceeded

**Supabase:**
- Use Row Level Security (RLS) policies
- Never use service role key on client-side
- Implement proper authentication before production
- Enable email verification for user signups

**SendGrid:**
- Server-side only
- Enable link tracking and click tracking
- Set up SPF and DKIM records for domain
- Monitor sending reputation

### 7. Database Security

**Supabase Row Level Security (RLS):**

Before production, implement RLS policies:

```sql
-- Example: Users can only view their own quotes
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = customer_id);

-- Example: Only authenticated users can create leads
CREATE POLICY "Authenticated users can create leads"
  ON leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

**Data Protection:**
- Encrypt sensitive data at rest (Supabase default)
- Use SSL/TLS for all database connections (Supabase default)
- Regular automated backups (configure in Supabase)
- Point-in-time recovery enabled

**Audit Logging:**
- Store `raw_data` in analyses table for audit trail
- Track quote status changes (`status`, `sent_at`, `viewed_at`)
- Log lead source for attribution

### 8. GDPR Compliance

**Data Collection:**
- Only collect necessary data for solar analysis
- Store customer consent in database
- Provide data deletion mechanism

**Data Retention:**
- Keep analysis data for 30 days
- Archive quotes for 2 years
- Delete customer data on request

**Privacy Policy:**
- Document what data is collected
- Explain how data is used
- Provide contact for data requests
- Implement "Right to be Forgotten"

**Implementation Checklist:**
- [ ] Add privacy policy link in footer
- [ ] Implement cookie consent banner
- [ ] Add data deletion endpoint
- [ ] Create data export functionality
- [ ] Document data processing agreements

### 9. Authentication & Authorization

**Current Status**: No authentication implemented (public analysis tool)

**When implementing:**
- Use Supabase Auth for user management
- Implement email verification
- Add password strength requirements (min 12 chars)
- Enable 2FA for admin accounts
- Use magic links for passwordless auth
- Implement session timeout (24 hours)
- Add CSRF protection for form submissions

**Admin Dashboard Security:**
- Require authentication
- Implement role-based access control (RBAC)
- Log all admin actions
- Use separate admin subdomain if possible

### 10. Third-Party Dependencies

**Regular Security Audits:**
```bash
npm audit                    # Check for vulnerabilities
npm audit fix                # Auto-fix if possible
npm audit fix --force        # Force major version updates (test thoroughly)
```

**Dependency Management:**
- Run `npm audit` before every deploy
- Update dependencies monthly
- Pin exact versions in production
- Review security advisories for critical packages
- Use Dependabot or Renovate for automated updates

**Critical Packages:**
- `next` - Core framework
- `@supabase/supabase-js` - Database client
- `axios` - HTTP client (consider using fetch API instead)
- `react-hook-form` - Form handling

### 11. Deployment Security

**Vercel/Railway Deployment:**
- Enable automatic HTTPS
- Set environment variables in platform dashboard
- Enable preview deployment protection
- Use production/preview/development environments
- Configure domain security (DNSSEC, CAA records)

**Secrets Management:**
- Use platform's secret manager
- Never commit secrets to git
- Rotate secrets quarterly
- Use different keys for dev/staging/production

**Build Security:**
- Disable source maps in production (`productionBrowserSourceMaps: false`)
- Remove `console.log` in production builds
- Minify and obfuscate code
- Use SRI (Subresource Integrity) for CDN resources

### 12. Monitoring & Incident Response

**Error Tracking:**
- Set up Sentry for error monitoring
- Configure alert thresholds
- Create incident response playbook
- Document security contact procedures

**Logging:**
- Log all API errors
- Track failed authentication attempts
- Monitor rate limit violations
- Alert on suspicious patterns

**Metrics to Monitor:**
- Failed API requests
- Rate limit hits
- Database errors
- Abnormal traffic patterns
- Geographic anomalies

## Security Checklist for New Features

Before merging:
- [ ] Input validation implemented
- [ ] Rate limiting applied
- [ ] No secrets in code
- [ ] SQL injection prevented
- [ ] XSS vulnerabilities addressed
- [ ] CSRF protection added (if forms)
- [ ] Authentication checked (if required)
- [ ] Error messages don't leak sensitive info
- [ ] Security headers tested
- [ ] Dependencies audited

## Security Testing

**Automated:**
```bash
npm audit                           # Dependency vulnerabilities
npm run build                       # Check for build-time errors
```

**Manual Testing:**
- Test CORS policies
- Verify rate limiting
- Attempt SQL injection
- Test XSS vectors
- Check CSP violations in browser console
- Validate authentication flows
- Test file upload restrictions

**Tools:**
- OWASP ZAP - Penetration testing
- Burp Suite - Security testing
- Chrome DevTools - CSP validation
- Lighthouse - Security audit

## Incident Response Plan

1. **Detection**: Security issue identified
2. **Assessment**: Evaluate severity and impact
3. **Containment**: Isolate affected systems
4. **Remediation**: Deploy fix
5. **Recovery**: Restore normal operations
6. **Review**: Post-mortem and documentation

## Security Contacts

- **Security Email**: security@ghawdexengineering.com
- **Development Team**: tech@ghawdexengineering.com
- **Emergency**: [Phone number]

## Version History

- **v1.0** (2024-11-18): Initial security documentation
  - Security headers implemented
  - Rate limiting added
  - Input validation utilities created
  - GDPR compliance framework outlined
