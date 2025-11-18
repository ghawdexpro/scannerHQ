import { jsPDF } from 'jspdf'

interface QuoteData {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  systemSize: number
  panelCount: number
  roofArea: number
  yearlyGeneration: number
  withGrant: {
    installationCost: number
    grantAmount: number
    upfrontCost: number
    feedInTariff: number
    yearlyRevenue: number
    roiYears: number
    twentyYearSavings: number
  }
  withoutGrant: {
    installationCost: number
    upfrontCost: number
    feedInTariff: number
    yearlyRevenue: number
    roiYears: number
    twentyYearSavings: number
  }
  carbonOffset: number
  analysisType: string
  quoteId: string
  createdAt: string
  expiresAt: string
}

export async function generateQuotePDF(data: QuoteData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const primaryColor: [number, number, number] = [37, 99, 235] // Blue-600
  const secondaryColor: [number, number, number] = [16, 185, 129] // Green-600
  const textColor: [number, number, number] = [31, 41, 55] // Gray-800
  const lightGray: [number, number, number] = [243, 244, 246] // Gray-100

  let yPos = 20

  // Header - Company Logo & Branding
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('GHAWDEX ENGINEERING', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Solar & Smart Energy Solutions', 105, 28, { align: 'center' })
  doc.text('Malta & Gozo', 105, 34, { align: 'center' })

  yPos = 55

  // Quote Title
  doc.setTextColor(...textColor)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Solar Installation Quote', 20, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Quote #${data.quoteId.substring(0, 8).toUpperCase()}`, 20, yPos)
  doc.text(`Generated: ${new Date(data.createdAt).toLocaleDateString('en-GB')}`, 20, yPos + 5)
  doc.text(`Valid until: ${new Date(data.expiresAt).toLocaleDateString('en-GB')}`, 20, yPos + 10)

  yPos += 20

  // Customer Information Box
  doc.setFillColor(...lightGray)
  doc.roundedRect(20, yPos, 170, 25, 2, 2, 'F')

  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Customer Information', 25, yPos + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`${data.customerName}`, 25, yPos + 13)
  doc.text(`${data.customerEmail}`, 25, yPos + 17)
  doc.text(`${data.customerPhone}`, 25, yPos + 21)
  doc.text(`Property: ${data.address}`, 100, yPos + 17)

  yPos += 32

  // System Overview
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('System Overview', 20, yPos)

  yPos += 8
  doc.setLineWidth(0.5)
  doc.setDrawColor(...primaryColor)
  doc.line(20, yPos, 190, yPos)

  yPos += 8
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const specs = [
    ['System Size:', `${data.systemSize.toFixed(1)} kW`],
    ['Number of Panels:', `${data.panelCount} panels`],
    ['Roof Area Required:', `${data.roofArea.toFixed(0)} m²`],
    ['Annual Generation:', `${Math.round(data.yearlyGeneration).toLocaleString()} kWh`],
    ['Analysis Method:', data.analysisType === 'google_solar' ? 'Google Solar API' : 'AI Roof Detection'],
    ['CO₂ Offset (20 years):', `${data.carbonOffset.toFixed(1)} tons`]
  ]

  specs.forEach(([label, value]) => {
    doc.text(label, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(value, 120, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 6
  })

  yPos += 5

  // Scenario 1: With Government Grant
  doc.setFillColor(...secondaryColor)
  doc.rect(20, yPos, 170, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('OPTION 1: With Government Grant (€2,400 max)', 25, yPos + 5.5)

  yPos += 15
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const withGrantDetails: [string, string, boolean?][] = [
    ['Installation Cost:', `€${data.withGrant.installationCost.toLocaleString()}`],
    ['Government Grant:', `-€${data.withGrant.grantAmount.toLocaleString()}`, true],
    ['Your Investment:', `€${data.withGrant.upfrontCost.toLocaleString()}`, true],
    ['Feed-in Tariff:', `€${data.withGrant.feedInTariff.toFixed(3)}/kWh for 20 years`],
    ['Annual Revenue:', `€${Math.round(data.withGrant.yearlyRevenue).toLocaleString()}/year`],
    ['Return on Investment:', `${data.withGrant.roiYears} years`],
    ['20-Year Profit:', `€${Math.round(data.withGrant.twentyYearSavings).toLocaleString()}`, true]
  ]

  withGrantDetails.forEach(([label, value, isBold]: [string, string, boolean?]) => {
    doc.text(label, 25, yPos)
    if (isBold) doc.setFont('helvetica', 'bold')
    doc.text(value, 120, yPos)
    if (isBold) doc.setFont('helvetica', 'normal')
    yPos += 6
  })

  yPos += 5

  // Scenario 2: Without Grant
  doc.setFillColor(...primaryColor)
  doc.rect(20, yPos, 170, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('OPTION 2: Without Government Grant', 25, yPos + 5.5)

  yPos += 15
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const withoutGrantDetails: [string, string, boolean?][] = [
    ['Installation Cost:', `€${data.withoutGrant.installationCost.toLocaleString()}`],
    ['Your Investment:', `€${data.withoutGrant.upfrontCost.toLocaleString()}`, true],
    ['Feed-in Tariff:', `€${data.withoutGrant.feedInTariff.toFixed(3)}/kWh for 20 years`],
    ['Annual Revenue:', `€${Math.round(data.withoutGrant.yearlyRevenue).toLocaleString()}/year`],
    ['Return on Investment:', `${data.withoutGrant.roiYears} years`],
    ['20-Year Profit:', `€${Math.round(data.withoutGrant.twentyYearSavings).toLocaleString()}`, true]
  ]

  withoutGrantDetails.forEach(([label, value, isBold]: [string, string, boolean?]) => {
    doc.text(label, 25, yPos)
    if (isBold) doc.setFont('helvetica', 'bold')
    doc.text(value, 120, yPos)
    if (isBold) doc.setFont('helvetica', 'normal')
    yPos += 6
  })

  yPos += 10

  // Important Notes
  doc.setFillColor(255, 243, 205) // Yellow-100
  doc.roundedRect(20, yPos, 170, 25, 2, 2, 'F')

  doc.setTextColor(...textColor)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Important Notes:', 25, yPos + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const notes = [
    '• Feed-in tariffs are guaranteed by the government for 20 years',
    '• Government grant eligibility and amount subject to approval',
    '• System includes panels, inverter, mounting, installation, and grid connection',
    '• Annual maintenance check recommended (not included in price)',
    '• ROI calculations based on current electricity prices and feed-in tariffs'
  ]

  let noteY = yPos + 10
  notes.forEach(note => {
    doc.text(note, 25, noteY)
    noteY += 4
  })

  // Footer
  yPos = 270
  doc.setFillColor(...lightGray)
  doc.rect(0, yPos, 210, 27, 'F')

  doc.setTextColor(...textColor)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Next Steps:', 20, yPos + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('1. Review this quote and select your preferred option', 20, yPos + 12)
  doc.text('2. Contact us to schedule a site visit and finalize details', 20, yPos + 16)
  doc.text('3. We\'ll assist with grant application and installation scheduling', 20, yPos + 20)

  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text('Ghawdex Engineering | www.ghawdex.pro | info@ghawdex.pro', 105, yPos + 25, { align: 'center' })

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}
