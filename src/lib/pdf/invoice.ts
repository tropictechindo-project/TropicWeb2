import jsPDF from 'jspdf'

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  customerEmail: string
  customerWhatsApp?: string
  customerAddress?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  tax: number
  total: number
  currency: string
  orderNumber: string
  startDate: string
  endDate: string
  isRegistered?: boolean
  status?: string
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 20

  // Colors
  const primaryColor: [number, number, number] = [102, 102, 255] // Primary color
  const grayColor: [number, number, number] = [128, 128, 128]

  // Header - Company Name
  doc.setFontSize(24)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('TROPIC TECH', pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('PT Tropic Tech International', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setTextColor(...grayColor)
  doc.text('Workstation Rental Company - Bali', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Invoice Title
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Invoice Details Box
  doc.setDrawColor(...primaryColor)
  doc.setFillColor(248, 248, 255)
  doc.roundedRect(20, y, pageWidth - 40, 35, 3, 0.5, 'FD')
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  doc.text(`Invoice Number: ${data.invoiceNumber}`, 25, y)
  y += 6
  doc.text(`Invoice Date: ${data.invoiceDate}`, 25, y)
  y += 6
  doc.text(`Order Number: ${data.orderNumber}`, 25, y)
  y += 20 // Increased from 15

  // Customer Details
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${data.customerName}`, 20, y)
  y += 6
  doc.text(`Email: ${data.customerEmail}`, 20, y)
  y += 6
  if (data.customerWhatsApp) {
    doc.text(`WhatsApp: ${data.customerWhatsApp}`, 20, y)
    y += 6
  }
  if (data.customerAddress) {
    doc.text(`Address: ${data.customerAddress}`, 20, y)
    y += 6
  }
  y += 10

  // Rental Period
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Rental Period:', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Start Date: ${data.startDate}`, 20, y)
  y += 6
  doc.text(`End Date: ${data.endDate}`, 20, y)
  y += 15

  // Adjusted column widths to fit 170mm usage (210mm page - 40mm margins)
  // Total: 10 + 70 + 20 + 35 + 35 = 170
  const colWidths = [10, 70, 20, 35, 35]
  const startX = 20

  doc.setFillColor(...primaryColor)
  doc.rect(startX, y, pageWidth - 40, 10, 'F')
  y += 7

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)

  let x = startX + 5
  doc.text('#', x, y)
  x += colWidths[0] // 10
  doc.text('Item Name', x, y)
  x += colWidths[1] // 70
  doc.text('Qty', x, y)
  x += colWidths[2] // 20
  doc.text('Unit Price', x, y)
  x += colWidths[3] // 35
  doc.text('Total', x, y)

  y += 8

  // Items Table Body
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFillColor(250, 250, 250)

  data.items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(startX, y - 5, pageWidth - 40, 8, 'F')
    }

    x = startX + 5
    doc.text(`${index + 1}`, x, y)
    x += colWidths[0]
    doc.text(item.name.substring(0, 35), x, y)
    x += colWidths[1]
    doc.text(item.quantity.toString(), x, y)
    x += colWidths[2]
    doc.text(`${data.currency} ${item.unitPrice.toLocaleString()}`, x, y)
    x += colWidths[3]
    doc.text(`${data.currency} ${item.totalPrice.toLocaleString()}`, x, y)
    y += 8
  })

  y += 10

  // Totals
  doc.setDrawColor(...primaryColor)
  doc.line(startX, y, pageWidth - 20, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const totalsX = pageWidth - 80

  doc.text(`Subtotal:`, totalsX, y)
  doc.text(`${data.currency} ${data.subtotal.toLocaleString()}`, pageWidth - 30, y)
  y += 7

  if (data.tax > 0) {
    doc.text(`Tax (${((data.tax / data.subtotal) * 100).toFixed(1)}%):`, totalsX, y)
    doc.text(`${data.currency} ${data.tax.toLocaleString()}`, pageWidth - 30, y)
    y += 7
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', totalsX, y)
  doc.text(`${data.currency} ${data.total.toLocaleString()}`, pageWidth - 30, y)
  y += 20

  // Confirmation & Approval Section
  y = pageHeight - 90
  doc.setDrawColor(200, 200, 200)
  doc.line(20, y, pageWidth - 20, y)
  y += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('APPROVAL & CONFIRMATION', 20, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Issued by Authority:', 20, y)

  // PIC Section
  const picX = pageWidth - 70
  doc.text('PIC / Manager:', picX, y)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('PT TROPIC TECH INTERNATIONAL', 20, y)

  // Status-based Signature
  if (data.status === 'PAID') {
    doc.setTextColor(34, 197, 94) // Green
    doc.setFont('helvetica', 'bolditalic')
    doc.setFontSize(14)
    doc.text('VERIFIED & PAID', picX, y + 8)
  } else {
    doc.setTextColor(...grayColor)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('(Waiting for Payment)', picX, y + 8)
  }

  y += 20
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Wahyudin Damopolii', picX, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('(PIC Approval)', picX, y + 4)

  // Footer - Payment Info
  y = pageHeight - 45
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Payment Info:', 20, y)
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text('• Cash | PayPal | Stripe | Bank Transfer', 20, y)
  y += 5
  doc.text('• Office: Jl. Tunjungsari No.8, Bali', 20, y)

  // Final Copyright
  y = pageHeight - 15
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text(
    '© 2026 PT Tropic Tech International. All Rights Reserved.',
    pageWidth / 2,
    y,
    { align: 'center' }
  )

  return doc
}
