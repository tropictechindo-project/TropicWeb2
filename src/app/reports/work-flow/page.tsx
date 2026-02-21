'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function WorkFlowChartPage() {
  const { user, isAuthenticated } = useAuth()

  // Sample data - in real app, fetch from API
  const [orders, setOrders] = useState([
    { id: 1, status: 'PENDING', date: 'Dec 1', count: 12, tax: 24000, deliveryFee: 100000, products: ['Standing Desk x 2', 'Monitor x 1'] },
    { id: 2, status: 'CONFIRMED', date: 'Dec 2', count: 8, tax: 16000, deliveryFee: 100000, products: ['Ergonomic Chair', 'Keyboard Set'] },
    { id: 3, status: 'ACTIVE', date: 'Dec 3', count: 15, tax: 30000, deliveryFee: 200000, products: ['Standing Desk x 3', 'Monitor x 2', 'Chair x 3'] },
    { id: 4, status: 'ACTIVE', date: 'Dec 4', count: 20, tax: 40000, deliveryFee: 300000, products: ['Full Package', 'Mouse Set', 'HDMI Cable'] },
    { id: 5, status: 'COMPLETED', date: 'Dec 5', count: 10, tax: 20000, deliveryFee: 100000, products: ['Laptop Stand', 'Webcam'] },
    { id: 6, status: 'COMPLETED', date: 'Dec 6', count: 18, tax: 36000, deliveryFee: 600000, products: ['Monitor x 3', 'Chair x 3', 'Desk x 2'] },
    { id: 7, status: 'CANCELLED', date: 'Dec 7', count: 2, tax: 4000, deliveryFee: 100000, products: ['Webcam'] },
  ])

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login'
    }
  }, [isAuthenticated, user])

  const totalOrders = orders.length
  const totalTax = orders.reduce((sum, order) => sum + order.tax, 0)
  const totalDeliveryFee = orders.reduce((sum, order) => sum + order.deliveryFee, 0)

  const handleDownloadPDF = () => {
    // In real app, generate and download PDF
    alert('Downloading Work Flow Report PDF...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with PDF Download */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Work Flow Report</h1>
            <p className="text-muted-foreground">Track order status through rental workflow (Confidential)</p>
          </div>
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{orders.filter(o => o.status === 'PENDING').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{orders.filter(o => o.status === 'CONFIRMED').length}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{orders.filter(o => o.status === 'ACTIVE').length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-500">{orders.filter(o => o.status === 'COMPLETED').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{orders.filter(o => o.status === 'CANCELLED').length}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalOrders}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Tax Collected (2%)</p>
                <p className="text-2xl font-bold text-green-600">Rp {totalTax.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Delivery Fees (100k/order)</p>
                <p className="text-2xl font-bold text-blue-600">Rp {totalDeliveryFee.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tax + Delivery</p>
                <p className="text-2xl font-bold text-purple-600">Rp {(totalTax + totalDeliveryFee).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Status Flow Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Chart Legend */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span>Cancelled</span>
                </div>
              </div>

              {/* Flow Chart */}
              <div className="border rounded-lg p-6 bg-white dark:bg-gray-900">
                <div className="flex flex-wrap justify-between gap-2">
                  {orders.map((order, index) => (
                    <div key={order.id} className="flex flex-col items-center">
                      {/* Status Indicator */}
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(order.status)}`}></div>
                      {/* Arrow */}
                      {index < orders.length - 1 && (
                        <div className="h-8 w-px bg-gray-300"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Count Labels */}
                <div className="flex justify-around text-center text-sm text-muted-foreground">
                  {orders.map((order) => (
                    <div key={order.id} className="px-4">
                      {order.count} orders
                    </div>
                  ))}
                </div>

                {/* Date Labels */}
                <div className="flex justify-around text-center text-xs text-muted-foreground">
                  {orders.map((order) => (
                    <div key={order.id} className="px-4">
                      {order.date}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Order Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Order ID</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Products</th>
                    <th className="text-right p-3">Tax (2%)</th>
                    <th className="text-right p-3">Delivery Fee</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">#{order.id}</td>
                      <td className="p-3">{order.date}, 2024</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBg(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {order.products.map((p, i) => (
                          <div key={i} className="text-sm">
                            - {p}
                          </div>
                        ))}
                      </td>
                      <td className="p-3 text-right">Rp {order.tax.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">Rp {order.deliveryFee.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right font-semibold">Rp {(order.count * 50000 + order.tax + order.deliveryFee).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    CONFIRMED: 'bg-blue-500',
    ACTIVE: 'bg-green-500',
    COMPLETED: 'bg-purple-500',
    CANCELLED: 'bg-red-500',
  }
  return colors[status] || 'bg-gray-500'
}

function getStatusBg(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
