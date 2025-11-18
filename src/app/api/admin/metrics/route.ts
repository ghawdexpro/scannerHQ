import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    // Fetch lead statistics
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('status')

    if (leadsError) {
      console.error('[METRICS] Failed to fetch leads:', leadsError)
      throw leadsError
    }

    const leadStats = {
      total: leads?.length || 0,
      new: leads?.filter((l: any) => l.status === 'new').length || 0,
      contacted: leads?.filter((l: any) => l.status === 'contacted').length || 0,
      qualified: leads?.filter((l: any) => l.status === 'qualified').length || 0,
      converted: leads?.filter((l: any) => l.status === 'converted').length || 0,
      lost: leads?.filter((l: any) => l.status === 'lost').length || 0
    }

    // Fetch quote statistics
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('status, upfront_cost')

    if (quotesError) {
      console.error('[METRICS] Failed to fetch quotes:', quotesError)
      throw quotesError
    }

    const quoteStats = {
      total: quotes?.length || 0,
      sent: quotes?.filter((q: any) => q.status === 'sent').length || 0,
      viewed: quotes?.filter((q: any) => q.status === 'viewed').length || 0,
      accepted: quotes?.filter((q: any) => q.status === 'accepted').length || 0,
      rejected: quotes?.filter((q: any) => q.status === 'rejected').length || 0
    }

    // Calculate overdue leads (>3 hours old with status 'new')
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const { data: overdueLeads, error: overdueError } = await supabase
      .from('leads')
      .select('id')
      .eq('status', 'new')
      .lt('created_at', threeHoursAgo)

    if (overdueError) {
      console.error('[METRICS] Failed to fetch overdue leads:', overdueError)
      throw overdueError
    }

    // Calculate revenue
    const potentialRevenue = quotes?.reduce((sum: number, q: any) => sum + (q.upfront_cost || 0), 0) || 0
    const closedRevenue =
      quotes
        ?.filter((q: any) => q.status === 'accepted')
        .reduce((sum: number, q: any) => sum + (q.upfront_cost || 0), 0) || 0

    return NextResponse.json(
      {
        leads: leadStats,
        quotes: quoteStats,
        overdue: overdueLeads?.length || 0,
        revenue: {
          potential: potentialRevenue,
          closed: closedRevenue
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[METRICS] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
