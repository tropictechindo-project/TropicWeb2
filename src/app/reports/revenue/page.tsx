'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Download, FileText, Package, Monitor, Calculator } from 'lucide-react'

export default function RevenueChartPage() {
  const { user, isAuthenticated } = useAuth()

  // Sample revenue data - in real app, fetch from API
  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', revenue: 15000000, orders: 32, tax: 1200000, deliveryFees: 1200000 },
    { month: 'Feb', revenue: 18000000, orders: 38, tax: 1440000, deliveryFees: 1800000 },
    { month: 'Mar', revenue: 22000000, orders: 45, tax: 1760000, deliveryFees: 2200000 },
    { month: 'Apr', revenue: 19500000, orders: 42, tax: 1560000, deliveryFees: 1950000 },
    { month: 'May', revenue: 28000000, orders: 55, tax: 2240000, deliveryFees: 2800000 },
    { month: 'Jun', revenue: 32000000, orders: 48, tax: 2560000, deliveryFees: 3200000 },
    { month: 'Jul', revenue: 29000000, orders: 40, tax: 2320000, deliveryFees: 2900000 },
    { month: 'Aug', revenue: 25000000, orders: 35, tax: 2000000, deliveryFees: 2500000 },
    { month: 'Sep', revenue: 35000000, orders: 62, tax: 2800000, deliveryFees: 3500000 },
    { month: 'Oct', revenue: 38000000, orders: 70, tax: 3040000, deliveryFees: 3800000 },
    { month: 'Nov', revenue: 42000000, orders: 58, tax: 3360000, deliveryFees: 4200000 },
    { month: 'Dec', revenue: 45000000, orders: 52, tax: 3600000, deliveryFees: 4500000 },
  ])

  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Sample invoice data
  const [invoices, setInvoices] = useState([
    { id: 1, number: 'INV-2024-000001', date: 'Dec 1, 2024', customer: 'John Doe', items: ['Standing Desk x 2', 'Monitor x 1'], subtotal: 3000000, tax: 60000, deliveryFee: 100000, total: 3160000, currency: 'IDR' },
    { id: 2, number: 'INV-2024-000002', date: 'Dec 3, 2024', customer: 'Jane Smith', items: ['Ergonomic Chair x 2', 'Keyboard Set'], subtotal: 2500000, tax: 50000, deliveryFee: 100000, total: 2650000, currency: 'IDR' },
    { id: 3, number: 'INV-2024-000003', date: 'Dec 5, 2024', customer: 'Mike Johnson', items: ['Full Workstation Package'], subtotal: 5000000, tax: 100000, deliveryFee: 200000, total: 5300000, currency: 'IDR' },
    { id: 4, number: 'INV-2024-000004', date: 'Dec 10, 2024', customer: 'Sarah Lee', items: ['Monitor x 2', 'Chair x 2'], subtotal: 4000000, tax: 80000, deliveryFee: 200000, total: 4280000, currency: 'IDR' },
    { id: 5, number: 'INV-2024-000005', date: 'Dec 15, 2024', customer: 'Tom Wilson', items: ['Desk Package x 2'], subtotal: 6000000, tax: 120000, deliveryFee: 200000, total: 6320000, currency: 'IDR' },
  ])

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login'
    }
  }, [isAuthenticated, user])

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0)
  const totalOrders = revenueData.reduce((sum, item) => sum + item.orders, 0)
  const totalTax = revenueData.reduce((sum, item) => sum + item.tax, 0)
  const totalDeliveryFees = revenueData.reduce((sum, item) => sum + item.deliveryFees, 0)
  const averageRevenue = totalRevenue / revenueData.length
  const averageOrders = totalOrders / revenueData.length

  const handleDownloadPDF = () => {
    alert('Downloading Revenue Report PDF...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Revenue Report</h1>
            <p className="text-muted-foreground">Track your business income and order trends (Confidential)</p>
          </div>
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Monthly Average</p>
              <p className="text-3xl font-bold text-blue-600">
                Rp {averageRevenue.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-purple-600">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Monthly Average</p>
              <p className="text-3xl font-bold text-orange-600">
                {averageOrders.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tax Accumulation Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Tax Accumulation (2%)
            </CardTitle>
            <CardDescription>Monthly tax collection for easy tax management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Month</th>
                    <th className="text-right p-3">Revenue</th>
                    <th className="text-right p-3">Orders</th>
                    <th className="text-right p-3">Tax (2%)</th>
                    <th className="text-right p-3">Running Total</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((item, index) => (
                    <tr key={item.month} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{item.month}</td>
                      <td className="p-3 text-right">Rp {item.revenue.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center">{item.orders}</td>
                      <td className="p-3 text-right text-blue-600">Rp {item.tax.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right font-bold text-green-600">
                        Rp {revenueData.slice(0, index + 1).reduce((sum, i) => sum + i.tax, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-primary/5">
                  <tr className="font-bold">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right">Rp {totalRevenue.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center">{totalOrders}</td>
                    <td className="p-3 text-right text-blue-600">Rp {totalTax.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right text-green-600">Rp {totalTax.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Bar Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue Trend (2024)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative h-64">
                {revenueData.map((item, index) => {
                  const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
                  const percentage = (item.revenue / maxRevenue) * 100
                  const barWidth = Math.max(percentage * 0.6, 5)
                  const left = (index * 8.33) + (100 - (index * 8.33))
                  
                  return (
                    <div key={item.month} className="absolute top-1/2 bottom-0 h-6 flex items-center">
                      <div 
                        className="h-full rounded-t-md transition-all duration-300"
                        style={{
                          left: `${left}%`,
                          width: `${barWidth}%`,
                          backgroundColor: index % 2 === 0 ? '#3b82f6' : '#8b5cf6',
                        }}
                      ></div>
                      <span className="absolute -top-2 text-xs text-muted-foreground w-12 text-center">
                        {item.month}
                      </span>
                    </div>
                  )
                })}

                {/* Y-axis Grid */}
                <div className="absolute inset-0 flex justify-between pl-8 text-xs text-muted-foreground">
                  <div>0</div>
                  <div>10000000</div>
                  <div>20000000</div>
                  <div>30000000</div>
                  <div>40000000</div>
                  <div>50000000</div>
                </div>

                {/* X-axis Labels */}
                <div className="absolute bottom-0 w-full flex justify-between pl-8 text-xs text-muted-foreground pr-2">
                  {revenueData.map((item, index) => {
                    const left = (index * 8.33) + (100 - (index * 8.33))
                    return (
                      <span key={index} className={`text-center ${index % 2 === 0 ? 'text-blue-600' : 'text-purple-600'}`} style={{ left: `${left}%` }}>
                        {item.month}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Bar Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Volume (2024)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative h-64">
                {revenueData.map((item, index) => {
                  const maxOrders = Math.max(...revenueData.map(d => d.orders))
                  const percentage = (item.orders / maxOrders) * 100
                  const barWidth = Math.max(percentage * 0.7, 10)
                  const left = (index * 8.33) + (100 - (index * 8.33))
                  
                  return (
                    <div key={item.month} className="absolute top-1/2 bottom-0 h-6 flex items-center">
                      <div 
                        className="h-full rounded-t-full transition-all duration-300"
                        style={{
                          left: `${left}%`,
                          width: `${barWidth}%`,
                          backgroundColor: index % 2 === 0 ? '#8b5cf6' : '#ec4899',
                        }}
                      ></div>
                      <span className="absolute -top-2 text-xs text-muted-foreground w-12 text-center">
                        {item.orders}
                      </span>
                    </div>
                  )
                })}

                {/* Y-axis Grid */}
                <div className="absolute inset-0 flex justify-between pl-8 text-xs text-muted-foreground">
                  <div>0</div>
                  <div>25</div>
                  <div>50</div>
                  <div>75</div>
                  <div>100</div>
                </div>

                {/* X-axis Labels */}
                <div className="absolute bottom-0 w-full flex justify-between pl-8 text-xs text-muted-foreground pr-2">
                  {revenueData.map((item, index) => {
                    const left = (index * 8.33) + (100 - (index * 8.33))
                    return (
                      <span key={index} className={`text-center ${index % 2 === 0 ? 'text-purple-600' : 'text-orange-600'}`} style={{ left: `${left}%` }}>
                        {item.month}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products & Invoices Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Products and Invoices
            </CardTitle>
            <CardDescription>Detailed breakdown of products and invoice data with Tax (2%) and Delivery Fee (Rp 100,000)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Invoice #</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Products</th>
                    <th className="text-right p-3">Subtotal</th>
                    <th className="text-right p-3">Tax (2%)</th>
                    <th className="text-right p-3">Delivery Fee</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{invoice.number}</td>
                      <td className="p-3">{invoice.date}</td>
                      <td className="p-3">{invoice.customer}</td>
                      <td className="p-3">
                        {invoice.items.map((item, i) => (
                          <div key={i} className="text-sm">- {item}</div>
                        ))}
                      </td>
                      <td className="p-3 text-right">Rp {invoice.subtotal.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right text-blue-600">Rp {invoice.tax.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right text-orange-600">Rp {invoice.deliveryFee.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right font-bold text-green-600">
                        Rp {invoice.total.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-center">
                        <Button size="sm" variant="outline" onClick={() => alert(`Downloading Invoice ${invoice.number}`)}>
                          <FileText className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-primary/5">
                  <tr className="font-bold">
                    <td className="p-3">Total</td>
                    <td colSpan={3}></td>
                    <td className="p-3 text-right">Rp {invoices.reduce((sum, i) => sum + i.subtotal, 0).toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right text-blue-600">Rp {invoices.reduce((sum, i) => sum + i.tax, 0).toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right text-orange-600">Rp {invoices.reduce((sum, i) => sum + i.deliveryFee, 0).toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right text-green-600">Rp {invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString('id-ID')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* What I've Done */}
        <Card>
          <CardHeader>
            <CardTitle>What I've Done</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Work Flow Report</p>
                  <p className="text-sm text-muted-foreground">
                    Order status flow chart with summary statistics, financial breakdown, recent activity table with PDF download
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Revenue Report</p>
                  <p className="text-sm text-muted-foreground">
                    Income tracking, order volume charts, tax accumulation table (2%), products & invoices breakdown with delivery fees
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Database Schema</p>
                  <p className="text-sm text-muted-foreground">
                    Users, Products, Packages, Orders, Invoices with proper relationships and role-based access
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Authentication System</p>
                  <p className="text-sm text-muted-foreground">
                    JWT-based with role management (User, Worker, Admin) and secure token generation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Role-Based Dashboards</p>
                  <p className="text-sm text-muted-foreground">
                    User: Rentals, Invoices, Payments, Profile<br/>
                    Worker: Job Schedule, Delivery Reports, Stock Updates<br/>
                    Admin: Products, Users, Orders, Revenue Management, Reports
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">PDF Invoice Generation</p>
                  <p className="text-sm text-muted-foreground">
                    Automatic invoice creation on every order with 2% tax and Rp 100,000 delivery fee, downloadable PDFs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Multi-Language Support</p>
                  <p className="text-sm text-muted-foreground">
                    9 languages: English, Chinese, Hindi, Spanish, Arabic, French, Portuguese, Russian, Indonesian, Indonesian
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Currency Conversion</p>
                  <p className="text-sm text-muted-foreground">
                    9 currencies (USD, GBP, EUR, AUD, KWD, BHD, CNY, INR, RUB) with live conversion in order popup
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Order System</p>
                  <p className="text-sm text-muted-foreground">
                    Multiple payment methods (PayPal, Stripe, WhatsApp, Formspree, Cash) with guest checkout support
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">SEO Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Gold standard: Meta tags, robots.txt, sitemap.xml, JSON-LD structured data, canonical URLs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Mobile & Desktop Friendly</p>
                  <p className="text-sm text-muted-foreground">
                    Fully responsive with touch-friendly design, product slider adjusts to screen size
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Email Updated</p>
                  <p className="text-sm text-muted-foreground">
                    Changed to tropictechindo@gmail.com across all components (Footer, Invoice PDF)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Admin Access Only</p>
                  <p className="text-sm text-muted-foreground">
                    Reports pages (Work Flow, Revenue) accessible only through Admin Dashboard - Confidential
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>© 2024 PT Tropic Tech International. All Rights Reserved.</p>
          <p className="mt-2">Design by <span className="text-primary font-semibold">indodesign.website</span> | indonesianvisas.com | balihelp.id | mybisnis.app</p>
        </div>
      </div>
    </div>
  )
}
