import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Info, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react"

type Role = 'ADMIN' | 'OPERATOR' | 'WORKER' | 'USER'

interface GuideSection {
    title: string
    content: React.ReactNode
}

const COMMON_TERMINOLOGY = (
    <ul className="list-dash pl-4 space-y-2 text-xs">
        <li>
            <p><strong>Invoice:</strong> Financial source of truth. Created during checkout or manually. Standardizes the payment lifecycle.</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Sumber kebenaran finansial. Dibuat saat checkout atau manual. Menstandarkan siklus pembayaran.</p>
        </li>
        <li>
            <p><strong>Order:</strong> Created automatically AFTER invoice is paid or confirmed. Triggers fulfillment workflows.</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Dibuat otomatis SESUDAH invoice dibayar atau dikonfirmasi. Memicu alur pengiriman.</p>
        </li>
        <li>
            <p><strong>OrderItem:</strong> Specific snapshot of items in an order. Normalizes historical price and name independently of current Product catalogs.</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Snapshot item spesifik dalam pesanan. Menormalkan harga/nama sejarah tanpa tergantung katalog saat ini.</p>
        </li>
        <li>
            <p><strong>InventoryUnit:</strong> Individual discrete asset unit assigned for asset tracking (passive ROI layer).</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Unit aset individu yang ditugaskan untuk pelacakan ROI pasif.</p>
        </li>
        <li>
            <p><strong>ProductUnit:</strong> Core system allocation stock buffer defining available rental buffers for oversell guards.</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Buffer stok alokasi sistem inti yang mendefinisikan batas sewa untuk mencegah oversell.</p>
        </li>
        <li>
            <p><strong>Delivery:</strong> Scheduled courier workflow logistics associated with orders.</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Logistik alur kerja kurir terjadwal yang terkait dengan pesanan.</p>
        </li>
        <li>
            <p><strong>Tracking:</strong> Live telemetry status defining asset waypoint states accurately.</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Status telemetri live yang mendefinisikan titik jalur aset secara akurat.</p>
        </li>
        <li>
            <p><strong>ROI:</strong> Return on Investment tracking assigned to standalone InventoryUnits discretely.</p>
            <p className="text-muted-foreground"><strong>ID:</strong> Pelacakan Pengembalian Investasi yang ditugaskan ke unit aset mandiri.</p>
        </li>
    </ul>
)

const SYSTEM_TRUTH_CONTENT = (
    <div className="space-y-2 text-xs border-l-4 border-red-500 bg-red-500/5 p-2 rounded">
        <p className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> HOW THIS SYSTEM WORKS / BAGAIMANA SISTEM INI BEKERJA:</p>
        <ul className="list-disc pl-4 space-y-1">
            <li>
                <p><strong>Invoice-First:</strong> Invoices are absolute financial source of truth.</p>
                <p className="text-muted-foreground"><strong>ID:</strong> Invoice adalah sumber kebenaran finansial absolut.</p>
            </li>
            <li>
                <p><strong>Order Lifecycle:</strong> Orders created ONLY AFTER payment verification.</p>
                <p className="text-muted-foreground"><strong>ID:</strong> Pesanan dibuat HANYA SESUDAH verifikasi pembayaran.</p>
            </li>
            <li>
                <p><strong>Asset Tracking:</strong> Every product is tracked as discrete physical asset with ID (e.g. TT-CHAIR-01).</p>
                <p className="text-muted-foreground"><strong>ID:</strong> Setiap produk dilacak sebagai aset fisik diskrit dengan ID unik.</p>
            </li>
            <li>
                <p><strong>Real-time ROI:</strong> System automatically calculates profitability based on Buy Price vs Rental.</p>
                <p className="text-muted-foreground"><strong>ID:</strong> Sistem otomatis menghitung profit profit berdasarkan Harga Beli vs Sewa.</p>
            </li>
        </ul>
    </div>
)

const DATA_LIMITATIONS_CONTENT = (
    <div className="space-y-2 text-xs border-l-4 border-yellow-500 bg-yellow-500/5 p-2 rounded">
        <p className="font-bold text-yellow-600 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> DATA LIMITATIONS / BATASAN DATA:</p>
        <ul className="list-disc pl-4 space-y-1">
            <li>
                <p><strong>EN:</strong> Not all orders are linked to inventory units.</p>
                <p className="text-muted-foreground"><strong>ID:</strong> Tidak semua pesanan terhubung ke unit inventaris.</p>
            </li>
            <li>
                <p><strong>EN:</strong> ROI metrics ONLY include tracked assets, not entire business performance.</p>
                <p className="text-muted-foreground"><strong>ID:</strong> Metrik ROI HANYA termasuk aset yang dilacak, bukan seluruh bisnis.</p>
            </li>
            <li>
                <p><strong>EN:</strong> Manual invoices may not be represented in asset tracking.</p>
                <p className="text-muted-foreground"><strong>ID:</strong> Invoice manual mungkin tidak terwakili dalam pelacakan aset.</p>
            </li>
        </ul>
    </div>
)

const GUIDES: Record<Role, GuideSection[]> = {
    ADMIN: [
        {
            title: "🔴 1. System Truth (How it Works / Cara Kerja)",
            content: SYSTEM_TRUTH_CONTENT
        },
        {
            title: "🟡 2. Data Limitations (Batasan Data)",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "3. Action Consequences (Konsekuensi Tindakan)",
            content: (
                <div className="space-y-4 text-xs">
                    <div>
                        <p className="font-bold text-primary">A. Confirming Payment (Konfirmasi Pembayaran):</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> Creates historical Order state, Snapshot OrderItems, & schedules Delivery.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Membuat status Pesanan sejarah, Snapshot Item, & jadwal Pengiriman.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> Action cannot be safely reversed.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> Tindakan tidak dapat dibatalkan dengan aman.</p>
                    </div>
                    <div>
                        <p className="font-bold text-primary">B. Assigning Inventory Unit (Menugaskan Unit Inventaris):</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> Adds item triggers into passive ROI summaries.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Menambahkan pemicu item ke ringkasan ROI pasif.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> Affects financial reports and asset tracking sums.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> Mempengaruhi laporan keuangan dan jumlah pelacakan aset.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Role Definition (Tupoksi Admin)",
            content: (
                <div className="space-y-2 text-xs">
                    <div>
                        <p><strong>EN: Responsibilities:</strong> Absolute master control of financial validation, orders integrity, tracking overview, and asset ROI yields.</p>
                        <p><strong>ID: Tanggung Jawab:</strong> Kontrol master absolut atas validasi keuangan, integritas pesanan, ikhtisar pelacakan, dan hasil ROI aset.</p>
                    </div>
                    <div>
                        <p><strong>EN: Allowed:</strong> Confirm manual / online payments, assign units, adjust designs configs, manage operators/workers.</p>
                        <p><strong>ID: Di-izinkan:</strong> Mengkonfirmasi pembayaran manual/online, menugaskan unit, mengatur konfigurasi, mengelola operator/kurir.</p>
                    </div>
                    <div className="text-red-600 font-bold border-l-2 border-red-500 pl-2">
                        <p><strong>EN: MUST NOT DO:</strong> Confirm payments with un-audited receipts cascades; force-modify structural order templates.</p>
                        <p><strong>ID: JANGAN LAKUKAN:</strong> Mengkonfirmasi pembayaran tanpa audit tanda terima; mengubah paksa templat pesanan struktural.</p>
                    </div>
                </div>
            )
        },
        {
            title: "5. Real Workflow (Step-by-Step / Alur Kerja)",
            content: (
                <ol className="list-decimal pl-4 space-y-2 text-xs">
                    <li>
                        <p><strong>EN:</strong> Admin receives Stripe or uploaded receipt webhook requests.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Admin menerima permintaan konfirmasi manual dari Stripe atau bukti transfer.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Inside Invoices table, validate amounts corresponds with snapshot lineItems.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Di tabel Invoice, validasi jumlah sesuai dengan item snapshot.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Click <strong>"Confirm Payment"</strong> → Atomically creates Order, schedules Courier dispatching.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Klik <strong>"Confirm Payment"</strong> → Membuat Pesanan otomatis, menjadwalkan Kurir.</p>
                    </li>
                </ol>
            )
        },
        {
            title: "6. Inventory & Lifecycle Management (Pengelolaan Inventaris)",
            content: (
                <div className="space-y-2 text-xs">
                    <p><strong>EN:</strong> Every physical asset in your warehouse is tracked individually for maximum financial accuracy.</p>
                    <p><strong>ID:</strong> Setiap aset fisik di gudang Anda dilacak secara individu untuk akurasi finansial maksimum.</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>HEALTHY / SEHAT:</strong> Available for rent / Tersedia untuk disewa.</li>
                        <li><strong>OUT_OF_STOCK / KOSONG:</strong> No available units / Tidak ada unit tersedia.</li>
                        <li><strong>MAINTENANCE / PERBAIKAN:</strong> Unit is being repaired (removes from stock) / Sedang diperbaiki.</li>
                        <li><strong>LOST / HILANG:</strong> Unit is gone permanently / Unit hilang permanen.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "7. Warnings & Critical Mistakes (Peringatan)",
            content: (
                <div className="space-y-2 text-xs border-l-4 border-red-500 bg-red-500/5 p-2 rounded">
                    <p className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> CRITICAL WARNING / PERINGATAN KRITIS:</p>
                    <div>
                        <p><strong>EN:</strong> Incorrect invoice confirmation can create invalid orders. Admin actions affect real finances.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Konfirmasi invoice yang salah dapat membuat pesanan tidak valid. Tindakan admin berdampak keuangan nyata.</p>
                    </div>
                </div>
            )
        },
        {
            title: "8. Terminology (Istilah)",
            content: COMMON_TERMINOLOGY
        }
    ],
    OPERATOR: [
        {
            title: "🔴 1. System Truth (How it Works / Cara Kerja)",
            content: SYSTEM_TRUTH_CONTENT
        },
        {
            title: "🟡 2. Data Limitations (Batasan Data)",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "3. Action Consequences (Konsekuensi Tindakan)",
            content: (
                <div className="space-y-4 text-xs">
                    <div>
                        <p className="font-bold text-primary">A. Assigning Delivery (Menugaskan Pengiriman):</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> The worker becomes legally and operationally responsible for execution.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Kurir menjadi bertanggung jawab secara hukum dan operasional atas eksekusi.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> Incorrect assignment may delay or fail delivery queue items.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> Kesalahan penugasan dapat memperlambat atau menggagalkan pengiriman.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Role Definition (Tupoksi Operator)",
            content: (
                <div className="space-y-2 text-xs">
                    <div>
                        <p><strong>EN: Responsibilities:</strong> Managing dispatch queues, preparing logistics, assigning workers to orders.</p>
                        <p><strong>ID: Tanggung Jawab:</strong> Mengelola antrean pengiriman, menyiapkan logistik, menugaskan kurir.</p>
                    </div>
                    <div>
                        <p><strong>EN: Allowed:</strong> Re-route dispatch, assign workers, monitor live telemetry positions.</p>
                        <p><strong>ID: Di-izinkan:</strong> Mengatur rute, menugaskan kurir, memantau posisi telemetri live.</p>
                    </div>
                    <div className="text-red-600 font-bold border-l-2 border-red-500 pl-2">
                        <p><strong>EN: MUST NOT DO:</strong> Mark delivery completed before worker uploads visual proof.</p>
                        <p><strong>ID: JANGAN LAKUKAN:</strong> Menandai selesai sebelum kurir mengunggah bukti foto.</p>
                    </div>
                </div>
            )
        },
        {
            title: "5. Real Workflow (Step-by-Step / Alur Kerja)",
            content: (
                <ol className="list-decimal pl-4 space-y-2 text-xs">
                    <li>
                        <p><strong>EN:</strong> Check Delivery pool for items marked "Pending Assign".</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Periksa daftar pengiriman untuk item "Menunggu Penugasan".</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Select row → Trigger Worker Assign dropdown.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Pilih baris → Gunakan dropdown pilih kurir.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Dispatch triggers push live notification to worker.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Penugasan mengirim notifikasi live ke kurir.</p>
                    </li>
                </ol>
            )
        },
        {
            title: "6. Warnings & Critical Mistakes (Peringatan)",
            content: (
                <div className="space-y-2 text-xs border-l-4 border-red-500 bg-red-500/5 p-2 rounded">
                    <p className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> CRITICAL WARNING / PERINGATAN KRITIS:</p>
                    <div>
                        <p><strong>EN:</strong> Mis-dispatching creates overlap conflicts. Monitor grids early.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Kesalahan rute membuat bentrok jadwal. Pantau ketersediaan lebih awal.</p>
                    </div>
                </div>
            )
        },
        {
            title: "7. Terminology (Istilah)",
            content: COMMON_TERMINOLOGY
        }
    ],
    WORKER: [
        {
            title: "🔵 1. Sistem Utama (System Truth)",
            content: (
                <div className="space-y-2 text-xs">
                    {SYSTEM_TRUTH_CONTENT}
                    <div className="mt-2 p-2 bg-emerald-500/5 border-l-4 border-emerald-500 rounded">
                        <p className="font-bold text-emerald-600">PENTING: Alat Pelacakan / Tracking Device</p>
                        <p className="text-muted-foreground italic">Pastikan 'Sambungkan Perangkat' di header berwarna hijau. Ini mengaktifkan GPS dan notifikasi live agar pelanggan bisa melihat posisi Anda secara akurat di Global Tracker.</p>
                    </div>
                </div>
            )
        },
        {
            title: "🟡 2. Batasan Data (Data Limitations)",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "3. Konsekuensi Tindakan (Action Consequences)",
            content: (
                <div className="space-y-4 text-xs">
                    <div>
                        <p className="font-bold text-primary">A. Menerima Pekerjaan (Accepting a Job):</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> You are responsible for completion. GPS updates power live tracking.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Anda bertanggung jawab penuh atas penyelesaian tugas. Pembaruan GPS Anda adalah nyawa dari fitur pelacakan live pelanggan.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> Missing updates breaks tracking visibility.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> Jika GPS mati atau browser ditutup, pelanggan tidak bisa melihat posisi Anda dan akan menganggap pengiriman bermasalah.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Definisi Peran (Role Definition - Tupoksi Kurir)",
            content: (
                <div className="space-y-2 text-xs">
                    <p><strong>EN:</strong> Responsible for visual physical execution of delivery drops. GPS directly affects customer tracking.</p>
                    <p><strong>ID:</strong> Bertanggung jawab atas eksekusi fisik penyerahan barang di lapangan. Koordinasi GPS Anda sangat krusial bagi kepuasan pelanggan.</p>
                </div>
            )
        },
        {
            title: "5. Tanggung Jawab Utama (Responsibilities)",
            content: (
                <ul className="list-disc pl-4 space-y-2 text-xs">
                    <li>
                        <p><strong>EN:</strong> Accept delivery jobs from the pool.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Klaim tugas pengiriman dari 'Available Pool' segera setelah tersedia.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Update GPS location consistently.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Jaga status 'Sambungkan Perangkat' tetap AKTIF (Hijau) selama perjalanan.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Upload proof (photo) on arrival.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Ambil foto bukti penyerahan barang yang jelas saat tiba di lokasi pelanggan.</p>
                    </li>
                </ul>
            )
        },
        {
            title: "6. Peringatan Kritis (Warnings & Critical Mistakes)",
            content: (
                <div className="space-y-2 text-xs border-l-4 border-red-500 bg-red-500/5 p-2 rounded">
                    <p className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> PERINGATAN KRITIS:</p>
                    <div>
                        <p><strong>EN:</strong> Not uploading proof leaves job incomplete indefinitely.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Lupa mengunggah bukti foto akan membuat tugas dianggap 'Gantung' dan pembayaran Anda mungkin terhambat.</p>
                    </div>
                </div>
            )
        },
        {
            title: "7. Istilah Sistem (Terminology)",
            content: COMMON_TERMINOLOGY
        }
    ],
    USER: [
        {
            title: "🔴 1. System Truth (How it Works / Cara Kerja)",
            content: SYSTEM_TRUTH_CONTENT
        },
        {
            title: "🟡 2. Data Limitations (Batasan Data)",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "3. Action Consequences (Konsekuensi Tindakan)",
            content: (
                <div className="space-y-4 text-xs">
                    <div>
                        <p className="font-bold text-primary">When you submit payment (Saat Anda membayar):</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> Order is processed AFTER confirmation.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Pesanan diproses SETELAH konfirmasi.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> Delivery starts ONLY AFTER verification.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> Pengiriman dimulai HANYA SETELAH verifikasi.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Role Definition (Tupoksi Pelanggan)",
            content: (
                <div className="space-y-2 text-xs">
                    <p><strong>EN:</strong> Browse catalog, create bookings, upload receipt evidence accurately.</p>
                    <p><strong>ID:</strong> Telusuri katalog, buat pesanan sewa, unggah bukti transfer akurat.</p>
                </div>
            )
        },
        {
            title: "5. Real Workflow (Step-by-Step / Alur Kerja)",
            content: (
                <ol className="list-decimal pl-4 space-y-2 text-xs">
                    <li>
                        <p><strong>EN:</strong> Browse products → Checkout creates Invoice.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Cari produk → Checkout membuat Invoice.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Provide transfer evidence to speed up audits.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Unggah bukti transfer untuk audit cepat.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Wait for verification → Access live courier map.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Tunggu verifikasi → Pantau peta kurir live.</p>
                    </li>
                </ol>
            )
        },
        {
            title: "6. Terminology (Istilah)",
            content: COMMON_TERMINOLOGY
        }
    ]
}

export function DashboardGuide({ role }: { role: Role }) {
    const sections = GUIDES[role] || []

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 opacity-80 hover:opacity-100">
                    <HelpCircle className="h-3.5 w-3.5" />
                    System Guide
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-card backdrop-blur-md">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="text-xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        {role} Control Guide
                    </SheetTitle>
                    <SheetDescription className="text-xs italic">
                        Comprehensive operational guide based on real system architecture
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                    <Accordion type="single" collapsible className="w-full">
                        {sections.map((sec, i) => (
                            <AccordionItem key={i} value={`sec-${i}`}>
                                <AccordionTrigger className="text-xs font-black uppercase tracking-wider py-3">
                                    {sec.title}
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-muted-foreground leading-relaxed">
                                    {sec.content}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="p-3 bg-muted/40 rounded-xl border border-dashed text-[10px] text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                        <p>This document guides real-time state machines aggregates. Rules enforced strictly above transactional safeguards natively.</p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
