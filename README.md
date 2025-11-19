# Solar Scan GE - Ghawdex Engineering Solar Analysis Platform

An AI-powered web application for instant solar system analysis and quotes for residential and commercial properties in Malta and Gozo. Built by Ghawdex Engineering to revolutionize solar installation sales with instant visual analysis and 3-hour quote turnaround.

## 🌟 Features

- **Instant Visual Analysis** - Get solar potential analysis in under 30 seconds
- **AI-Powered Roof Detection** - Automatic roof detection and panel placement
- **Google Solar API Integration** - Professional-grade solar analysis for Malta
- **Custom Gozo Fallback** - AI-based analysis for areas without Google Solar coverage
- **Financial Calculator** - Compare government grant vs. non-grant options
- **20-Year ROI Projections** - Detailed financial modeling with degradation analysis
- **3-Hour Quote Guarantee** - Automated quote generation and delivery system
- **Mobile Responsive** - Optimized for all devices
- **Multi-language Support** - English and Maltese interfaces

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud Platform account with APIs enabled
- SendGrid account (for emails)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ghawdex-engineering/solar-scan-ge.git
cd solar-scan-ge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your API keys in `.env.local`:
   - Supabase credentials
   - Google Maps API key
   - Google Solar API key
   - SendGrid API key

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **AI/ML:** TensorFlow.js, Google Cloud Vision
- **Maps:** Google Maps API, Google Solar API
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Vercel
- **Email:** SendGrid
- **Analytics:** Google Analytics 4

## 📁 Project Structure

```
solar-scan-ge/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (public)/           # Public-facing pages
│   │   ├── (admin)/            # Admin dashboard
│   │   └── api/                # API endpoints
│   ├── components/             # React components
│   │   ├── address-input/      # Address search component
│   │   ├── map-viewer/         # Google Maps integration
│   │   ├── solar-visualizer/   # Solar panel overlay
│   │   └── financial-calculator/ # ROI calculations
│   ├── lib/                    # Utility libraries
│   │   ├── google/             # Google API services
│   │   ├── ai/                 # AI/ML functions
│   │   ├── supabase/           # Database client
│   │   └── utils/              # Helper functions
│   ├── config/                 # Configuration files
│   ├── types/                  # TypeScript definitions
│   └── hooks/                  # Custom React hooks
```

## 🔧 Configuration

### Google APIs Required

1. **Maps JavaScript API** - For map display and interaction
2. **Geocoding API** - For address validation
3. **Solar API** - For solar potential analysis
4. **Static Maps API** - For satellite imagery
5. **Cloud Vision API** - For roof detection

### Supabase Setup

1. Create a new Supabase project
2. Run the database migrations in `supabase/migrations/`
3. Set up Row Level Security policies
4. Configure authentication settings

### Environment Variables

See `.env.example` for all required environment variables. Key configurations:

- `NEXT_PUBLIC_MALTA_GRANT_TARIFF` - Feed-in tariff with grant (0.105)
- `NEXT_PUBLIC_NO_GRANT_TARIFF` - Feed-in tariff without grant (0.15)
- `NEXT_PUBLIC_MAX_GRANT_AMOUNT` - Maximum government grant (€2400)
- `NEXT_PUBLIC_MALTA_SOLAR_IRRADIANCE` - Average solar irradiance (5.2 kWh/m²/day)

## 🌍 Malta-Specific Features

### Government Grant System
- Up to €2400 grant for eligible installations
- 10.5 cents/kWh feed-in tariff with grant
- 15 cents/kWh without grant
- 20-year guaranteed rates

### Gozo AI Fallback
When Google Solar API isn't available (common in Gozo):
1. System captures satellite imagery
2. AI detects roof boundaries
3. Calculates optimal panel placement
4. Generates visual overlay
5. Estimates production based on Malta solar data

## 📊 API Endpoints

- `POST /api/analyze` - Initiate solar analysis
- `POST /api/quote` - Generate customer quote
- `POST /api/lead` - Capture lead information
- `GET /api/quote/[id]` - Retrieve specific quote
- `POST /api/admin/quotes` - Admin quote management

## 🚦 Development

### Running Tests
```bash
npm run test
npm run test:e2e
```

### Building for Production
```bash
npm run build
npm run start
```

### Database Migrations
```bash
npx supabase migration new <migration_name>
npx supabase db push
```

## 📈 Performance Targets

- Page Load: < 3 seconds
- Analysis Time: < 30 seconds
- API Response: < 500ms
- Uptime: 99.9%
- Quote Delivery: < 3 hours

## 🔐 Security

- GDPR compliant data handling
- SSL/TLS encryption
- API rate limiting
- Input validation and sanitization
- Secure authentication with Supabase
- Environment variable protection

## 📱 Mobile Support

Fully responsive design optimized for:
- iOS Safari
- Chrome Mobile
- Samsung Internet
- Firefox Mobile

## 🌐 Deployment

### Vercel Deployment

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy with:
```bash
vercel --prod
```

### Custom Domain Setup

1. Add domain in Vercel dashboard
2. Update DNS records
3. Configure SSL certificate

## 📝 License

Proprietary - © 2024 Ghawdex Engineering. All rights reserved.

## 🤝 Contributing

This is a private repository. For contributing guidelines, please contact the development team.

## 📞 Support

For technical support or questions:
- Email: admin@ghawdex.pro
- Phone: [Malta Phone Number]

## 🎯 Roadmap

- [x] MVP with Google Solar API
- [x] Gozo AI fallback system
- [ ] WhatsApp integration
- [ ] 3D roof visualization
- [ ] Battery storage calculator
- [ ] Commercial property support
- [ ] Mobile app (React Native)
- [ ] Smart home integration quotes

## 👥 Team

Built with ❤️ by Ghawdex Engineering - Malta's premier AI-based solar and smart energy solutions provider.

---

**Note:** This application requires valid API credentials. Please ensure all environment variables are properly configured before deployment.