import sgMail from '@sendgrid/mail'

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ghawdex.pro'
const FROM_NAME = 'Ghawdex Engineering'
const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL || 'quotes@ghawdex.pro'

interface QuoteEmailData {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  systemSize: number
  panelCount: number
  yearlyGeneration: number
  withGrantCost: number
  withoutGrantCost: number
  quoteId: string
  pdfUrl?: string
}

export async function sendCustomerQuoteEmail(data: QuoteEmailData, pdfBuffer?: Buffer): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn('[EMAIL] SendGrid API key not configured, skipping customer email')
    return
  }

  const customerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .highlight-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .specs { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .spec-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .spec-label { font-weight: bold; color: #6b7280; }
    .spec-value { color: #111827; font-weight: 600; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #111827; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Your Solar Quote is Ready!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Ghawdex Engineering - Solar & Smart Energy Solutions</p>
    </div>

    <div class="content">
      <p>Dear ${data.customerName},</p>

      <p>Thank you for your interest in solar energy! We've prepared a comprehensive quote for your property at <strong>${data.address}</strong>.</p>

      <div class="highlight-box">
        <h2 style="margin-top: 0; color: #2563eb;">Your System Overview</h2>
        <div class="specs">
          <div class="spec-row">
            <span class="spec-label">System Size</span>
            <span class="spec-value">${data.systemSize.toFixed(1)} kW</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Number of Panels</span>
            <span class="spec-value">${data.panelCount} panels</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Annual Generation</span>
            <span class="spec-value">${Math.round(data.yearlyGeneration).toLocaleString()} kWh</span>
          </div>
          <div class="spec-row" style="border-bottom: none;">
            <span class="spec-label">20-Year CO₂ Offset</span>
            <span class="spec-value">${((data.yearlyGeneration * 0.41 * 20) / 1000).toFixed(1)} tons</span>
          </div>
        </div>
      </div>

      <div class="highlight-box">
        <h3 style="margin-top: 0; color: #10b981;">💰 Two Options Available</h3>
        <p><strong>Option 1: With Government Grant</strong><br>
        Investment: €${data.withGrantCost.toLocaleString()} (after €2,400 grant)</p>

        <p><strong>Option 2: Without Grant</strong><br>
        Investment: €${data.withoutGrantCost.toLocaleString()} (higher feed-in tariff)</p>

        <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
        📎 Your detailed quote is attached to this email with full 20-year financial projections, ROI calculations, and system specifications.
        </p>
      </div>

      <div style="text-align: center;">
        <a href="mailto:info@ghawdex.pro?subject=Quote ${data.quoteId.substring(0, 8)}" class="cta-button">
          📞 Schedule a Consultation
        </a>
      </div>

      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        <strong>Next Steps:</strong><br>
        1. Review the attached quote<br>
        2. Reply to this email or call us to schedule a site visit<br>
        3. We'll assist with grant application and installation planning
      </p>

      <p style="margin-top: 20px;">This quote is valid for 30 days. We guarantee to contact you within 3 hours during business hours.</p>

      <p>Best regards,<br>
      <strong>Ghawdex Engineering Team</strong></p>
    </div>

    <div class="footer">
      <p>Ghawdex Engineering | Malta & Gozo<br>
      📧 info@ghawdex.pro | 🌐 www.ghawdex.pro</p>
      <p style="margin-top: 10px; font-size: 11px;">
      You received this email because you requested a solar quote through our website.
      </p>
    </div>
  </div>
</body>
</html>
  `

  const attachment = pdfBuffer ? [{
    content: pdfBuffer.toString('base64'),
    filename: `Solar_Quote_${data.quoteId.substring(0, 8)}.pdf`,
    type: 'application/pdf',
    disposition: 'attachment'
  }] : []

  const msg = {
    to: data.customerEmail,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `Your Solar Quote from Ghawdex Engineering - ${data.systemSize.toFixed(1)}kW System`,
    text: `Dear ${data.customerName},\n\nYour solar quote is ready! We've prepared a comprehensive analysis for your property at ${data.address}.\n\nSystem Size: ${data.systemSize.toFixed(1)} kW\nPanels: ${data.panelCount}\nAnnual Generation: ${Math.round(data.yearlyGeneration).toLocaleString()} kWh\n\nOption 1 (With Grant): €${data.withGrantCost.toLocaleString()}\nOption 2 (Without Grant): €${data.withoutGrantCost.toLocaleString()}\n\nPlease see the attached PDF for full details.\n\nBest regards,\nGhawdex Engineering Team`,
    html: customerEmailHTML,
    attachments: attachment
  }

  try {
    await sgMail.send(msg)
    console.log(`[EMAIL] Customer quote email sent to ${data.customerEmail}`)
  } catch (error) {
    console.error('[EMAIL] Failed to send customer email:', error)
    throw error
  }
}

export async function sendTeamNotificationEmail(data: QuoteEmailData, metadata: any): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn('[EMAIL] SendGrid API key not configured, skipping team notification')
    return
  }

  const teamEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #111827; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #6b7280; display: inline-block; width: 150px; }
    .value { color: #111827; }
    .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🔔 New Quote Request</h2>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Quote ID: ${data.quoteId.substring(0, 8)}</p>
    </div>

    <div class="content">
      <div class="urgent">
        <strong>⏱️ Action Required:</strong> Customer expects contact within 3 hours
      </div>

      <h3>Customer Details</h3>
      <div class="info-row">
        <span class="label">Name:</span>
        <span class="value">${data.customerName}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span class="value"><a href="tel:${data.customerPhone}">${data.customerPhone}</a></span>
      </div>
      <div class="info-row">
        <span class="label">Address:</span>
        <span class="value">${data.address}</span>
      </div>

      <h3 style="margin-top: 20px;">System Details</h3>
      <div class="info-row">
        <span class="label">System Size:</span>
        <span class="value">${data.systemSize.toFixed(1)} kW</span>
      </div>
      <div class="info-row">
        <span class="label">Panel Count:</span>
        <span class="value">${data.panelCount} panels</span>
      </div>
      <div class="info-row">
        <span class="label">Annual Generation:</span>
        <span class="value">${Math.round(data.yearlyGeneration).toLocaleString()} kWh</span>
      </div>
      <div class="info-row">
        <span class="label">With Grant Cost:</span>
        <span class="value">€${data.withGrantCost.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <span class="label">Without Grant Cost:</span>
        <span class="value">€${data.withoutGrantCost.toLocaleString()}</span>
      </div>

      ${metadata ? `
      <h3 style="margin-top: 20px;">Additional Information</h3>
      ${metadata.roofType ? `<div class="info-row"><span class="label">Roof Type:</span><span class="value">${metadata.roofType}</span></div>` : ''}
      ${metadata.propertyType ? `<div class="info-row"><span class="label">Property Type:</span><span class="value">${metadata.propertyType}</span></div>` : ''}
      ${metadata.budget ? `<div class="info-row"><span class="label">Budget:</span><span class="value">${metadata.budget}</span></div>` : ''}
      ${metadata.timeline ? `<div class="info-row"><span class="label">Timeline:</span><span class="value">${metadata.timeline}</span></div>` : ''}
      ${metadata.electricityBill ? `<div class="info-row"><span class="label">Monthly Bill:</span><span class="value">${metadata.electricityBill}</span></div>` : ''}
      ${metadata.notes ? `<div class="info-row" style="border-bottom: none;"><span class="label">Notes:</span><span class="value">${metadata.notes}</span></div>` : ''}
      ` : ''}

      <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 4px;">
        <strong>📋 Next Steps:</strong><br>
        1. Contact customer within 3 hours<br>
        2. Schedule site visit if needed<br>
        3. Assist with grant application process<br>
        4. Follow up on quote acceptance
      </div>
    </div>
  </div>
</body>
</html>
  `

  const msg = {
    to: TEAM_EMAIL,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `🔔 New Quote Request - ${data.customerName} - ${data.systemSize.toFixed(1)}kW`,
    text: `New Quote Request\n\nCustomer: ${data.customerName}\nEmail: ${data.customerEmail}\nPhone: ${data.customerPhone}\nAddress: ${data.address}\n\nSystem: ${data.systemSize.toFixed(1)}kW (${data.panelCount} panels)\nWith Grant: €${data.withGrantCost.toLocaleString()}\nWithout Grant: €${data.withoutGrantCost.toLocaleString()}\n\nACTION REQUIRED: Contact within 3 hours`,
    html: teamEmailHTML
  }

  try {
    await sgMail.send(msg)
    console.log(`[EMAIL] Team notification sent for quote ${data.quoteId}`)
  } catch (error) {
    console.error('[EMAIL] Failed to send team notification:', error)
    // Don't throw - team notification is not critical
  }
}
