-- ============================================
-- SCANNERHQ - DATABASE SETUP
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    notes TEXT
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    roof_area DECIMAL(10, 2),
    usable_area DECIMAL(10, 2),
    panel_count INTEGER,
    system_size DECIMAL(10, 2),
    yearly_generation DECIMAL(12, 2),
    analysis_type VARCHAR(20) CHECK (analysis_type IN ('google_solar', 'ai_fallback')) NOT NULL,
    confidence_score DECIMAL(3, 2),
    roof_image_url TEXT,
    processed_image_url TEXT,
    raw_data JSONB
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    system_size DECIMAL(10, 2) NOT NULL,
    panel_count INTEGER NOT NULL,
    installation_cost DECIMAL(12, 2) NOT NULL,
    with_grant BOOLEAN DEFAULT false,
    grant_amount DECIMAL(10, 2) DEFAULT 0,
    upfront_cost DECIMAL(12, 2) NOT NULL,
    feed_in_tariff DECIMAL(5, 3) NOT NULL,
    yearly_generation DECIMAL(12, 2) NOT NULL,
    yearly_revenue DECIMAL(12, 2) NOT NULL,
    roi_years DECIMAL(4, 1),
    twenty_year_savings DECIMAL(12, 2),
    carbon_offset DECIMAL(10, 2),
    status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected')) DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    pdf_url TEXT
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    source VARCHAR(50) CHECK (source IN ('website', 'referral', 'advertisement', 'other')) DEFAULT 'website',
    status VARCHAR(20) CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'new',
    notes TEXT,
    assigned_to VARCHAR(255)
);

-- Create yearly_projections table for detailed ROI calculations
CREATE TABLE IF NOT EXISTS public.yearly_projections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    generation DECIMAL(12, 2) NOT NULL,
    revenue DECIMAL(12, 2) NOT NULL,
    cumulative_savings DECIMAL(12, 2) NOT NULL,
    degradation_factor DECIMAL(5, 4) NOT NULL,
    UNIQUE(quote_id, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_analyses_customer_id ON public.analyses(customer_id);
CREATE INDEX IF NOT EXISTS idx_analyses_location ON public.analyses(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_analysis_id ON public.quotes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_projections ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for public access (for development)
-- In production, replace with proper auth policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all for customers" ON public.customers;
DROP POLICY IF EXISTS "Enable all for analyses" ON public.analyses;
DROP POLICY IF EXISTS "Enable all for quotes" ON public.quotes;
DROP POLICY IF EXISTS "Enable all for leads" ON public.leads;
DROP POLICY IF EXISTS "Enable all for yearly_projections" ON public.yearly_projections;

-- Create new policies
CREATE POLICY "Enable all for customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Enable all for analyses" ON public.analyses FOR ALL USING (true);
CREATE POLICY "Enable all for quotes" ON public.quotes FOR ALL USING (true);
CREATE POLICY "Enable all for leads" ON public.leads FOR ALL USING (true);
CREATE POLICY "Enable all for yearly_projections" ON public.yearly_projections FOR ALL USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: customers, analyses, quotes, leads, yearly_projections';
    RAISE NOTICE 'Row Level Security enabled with development policies';
END $$;