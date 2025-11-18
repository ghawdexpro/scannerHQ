# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solar Scan GE is a Next.js 14 application providing instant solar system analysis and quotes for residential and commercial properties in Malta and Gozo. It uses a dual-analysis approach: Google Solar API for Malta and AI-based fallback for Gozo (where Google Solar coverage is limited). The application is fully optimized for mobile with PWA capabilities and responsive design.

## Development Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Deployment
railway up           # Deploy to Railway.app
```

## Architecture

### Dual Analysis System

The core architecture uses two analysis paths:

1. **Google Solar API** (Primary for Malta)
   - `src/lib/google/solar-service.ts` - Interfaces with Google Solar API
   - Returns precise roof geometry, panel placement, and energy production data
   - Used when `getBuildingInsights()` succeeds

2. **AI Fallback** (Gozo and unsupported areas)
   - `src/lib/ai/roof-detection.ts` - AI-based roof analysis
   - Uses satellite imagery from Google Static Maps API
   - Estimates roof area, usable space, and panel placement
   - Currently simplified for MVP; production would use TensorFlow.js or similar

**Decision Logic**: Always attempt Google Solar API first. If it returns `LOCATION_NOT_FOUND`, fall back to AI analysis. This is controlled by the `ENABLE_GOZO_AI_FALLBACK` feature flag.

### Malta-Specific Configuration

All Malta solar calculations are centralized in `src/config/constants.ts`:

- **Feed-in Tariffs**:
  - 0.105 EUR/kWh (with government grant)
  - 0.15 EUR/kWh (without grant)
  - 20-year guarantee period

- **Government Grant**:
  - Max €2400
  - 30% of installation cost
  - Affects tariff rate (lower with grant, higher without)

- **Location Bounds**:
  - `MALTA_BOUNDS` and `GOZO_BOUNDS` for geographic validation
  - Used to determine AI fallback necessity

- **Solar Parameters**:
  - 5.2 kWh/m²/day irradiance
  - 0.5% annual panel degradation
  - 80% system efficiency
  - 400W panels (1.7m × 1.0m)

### Financial Calculations

20-year ROI projections are calculated in `src/lib/google/solar-service.ts`:

```typescript
calculateFinancials(systemSize, yearlyGeneration, withGrant)
```

Key aspects:
- Installation cost: €1500/kW
- Panel degradation: 0.5%/year compound
- Two scenarios calculated simultaneously (with/without grant)
- ROI calculation finds breakeven year
- Returns full 20-year projection array

### Database Schema

Supabase PostgreSQL with 4 main tables (see `src/types/database.ts`):

1. **customers** - Contact info, location coordinates
2. **analyses** - Roof analysis results (Google or AI), stores `analysis_type` enum
3. **quotes** - Generated quotes with financial projections, status tracking
4. **leads** - Lead capture and assignment system

**Important**: `analyses.raw_data` is JSONB storing complete API responses for audit trail.

### API Routes

Implemented endpoints:
- `/api/analyze` - Trigger solar analysis (Google API → AI fallback chain)
- `/api/quote` - Generate and store quote
- `/api/lead` - Capture lead information

These routes:
1. Use server-side Supabase client (`src/lib/supabase/server.ts`)
2. Handle API key security (never expose `GOOGLE_SOLAR_API_KEY` to client)
3. Implement rate limiting per `APP_CONFIG.MAX_REQUESTS_PER_MINUTE`
4. Return structured errors from `ERROR_MESSAGES` constant
5. Validate all input using utilities from `src/lib/utils/validation.ts`

### Environment Variables

Critical variables (see `.env.example`):
- `GOOGLE_SOLAR_API_KEY` - Server-side only, for Solar API
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Client-side maps
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- `NEXT_PUBLIC_SUPABASE_*` - Client-side database access

**Security**: Never use service role keys in client components. Use `src/lib/supabase/client.ts` for client, `server.ts` for server.

### Feature Flags

Controlled in `src/config/constants.ts`:
- `ENABLE_GOZO_AI_FALLBACK` - Enable AI analysis for unsupported areas
- `ENABLE_3D_VISUALIZATION` - 3D roof rendering (not implemented)
- `ENABLE_WHATSAPP` - WhatsApp integration (not implemented)

## Current Implementation Status

### ✅ Implemented
- Landing page with interactive map input
- Analysis results page with 20-year ROI charts
- Google Maps integration with address search
- Malta-specific financial calculations
- Database schema and type definitions
- Service layer for Google APIs

### ❌ Not Implemented
- API routes (empty directories exist)
- Admin dashboard
- Quote PDF generation
- Email notifications (SendGrid)
- Lead management system
- Solar visualizer component (panel overlay on satellite imagery)
- Financial calculator component (interactive what-if scenarios)

## Important Patterns

### Google API Usage
Always use fallback chain for API keys:
```typescript
key: process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Client vs Server Components
- Use `'use client'` directive for all interactive components
- Map components MUST be client-side (Google Maps JavaScript API)
- API calls to external services should be in API routes (server-side)

### Error Handling
Use predefined error messages from `ERROR_MESSAGES` constant. Special codes:
- `LOCATION_NOT_FOUND` - Triggers AI fallback
- `QUOTA_EXCEEDED` - Rate limit reached
- `SOLAR_API_UNAVAILABLE` - Generic Solar API failure

### Malta Phone/Address Validation
Use regex from `VALIDATION` constant:
- Phone: `+356` optional + 8 digits
- Postcode: 3 letters + 4 digits (e.g., VLT 1234)

## Next.js 14 Specifics

- App Router architecture (`src/app/` directory)
- Route groups: `(public)` and `(admin)` for layout organization
- `force-dynamic` export for analysis page (no static generation)
- Client component forms with `useSearchParams` for URL state

## Database Migration Pattern

When schema changes are needed:
```bash
npx supabase gen types typescript --project-id <id> > src/types/database.generated.ts
```

Manual types in `database.ts` should mirror generated types for easier editing.
