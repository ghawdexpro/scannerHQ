-- Add metadata column to quotes table for storing additional quote request information
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_quotes_metadata ON public.quotes USING GIN (metadata);

-- Add comment for documentation
COMMENT ON COLUMN public.quotes.metadata IS 'Stores additional quote request data: roof type, property type, budget, timeline, electricity bill, notes';
