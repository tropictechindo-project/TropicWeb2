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
            title: "🔴 1. System Engine Room (How it Works)",
            content: (
                <div className="space-y-2 text-xs border-l-4 border-amber-600 bg-amber-500/5 p-2 rounded">
                    <p className="font-bold text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> THE RULES OF THE RIG:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Invoice First:</strong> The bill is the source of truth, mate. No payment, no play.</li>
                        <li><strong>Order Lifecycle:</strong> We only start the clock once the money is in the bank and verified.</li>
                        <li><strong>Asset Tracking:</strong> Every piece of gear has its own tag. We know exactly where the rig is at all times.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "2. G'day Mate! Admin Command (AU)",
            content: (
                <div className="space-y-2 text-xs">
                    <p>Listen up, legend! Here's how you run this show:</p>
                    <p>• <b>Verify the Loot:</b> When a customer sends a receipt, check it twice before hitting confirm. No free rides!</p>
                    <p>• <b>Dispatch the Boys:</b> Once the payment's sweet, the system kicks off the delivery. Keep an eye on the tracker to make sure they're not slackin'.</p>
                    <p>• <b>Keep 'em Happy:</b> Use the Email Audit to make sure the customers get their invoices. No one likes a missing bill, cheers.</p>
                </div>
            )
        },
        {
            title: "3. Action Consequences (The Sharp End)",
            content: (
                <div className="space-y-4 text-xs">
                    <div>
                        <p className="font-bold text-primary">Confirming Payment:</p>
                        <p className="pl-3 text-muted-foreground">This kicks off the whole delivery chain. Once you click it, the gear starts movin'.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3 italic">Don't muck it up, mate. It's hard to roll back once the boys are on the road.</p>
                    </div>
                </div>
            )
        }
    ],
    OPERATOR: [
        {
            title: "🔴 1. Alur Operasional (Panduan Indonesia)",
            content: (
                <div className="space-y-2 text-xs border-l-4 border-emerald-600 bg-emerald-500/5 p-2 rounded">
                    <p className="font-bold text-emerald-600 flex items-center gap-1"><Info className="h-3.5 w-3.5" /> ATURAN MAIN OPERATOR:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><b>Prioritas Invoice:</b> Pantau invoice yang baru masuk dan bantu Admin verifikasi jika perlu.</li>
                        <li><b>Antrean Pengiriman:</b> Pastikan semua pesanan yang sudah lunas (PAID) segera mendapatkan kurir/worker.</li>
                        <li><b>Manajemen Armada:</b> Selalu cek ketersediaan unit di gudang sebelum menjanjikan pengiriman cepat.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "2. Tugas & Tanggung Jawab",
            content: (
                <div className="space-y-2 text-xs">
                    <p>Halo Operator! Tugas utama Anda adalah menjaga kelancaran lapangan:</p>
                    <p>• <b>Penugasan Kurir:</b> Pilih worker yang paling dekat atau yang sedang kosong untuk menghemat waktu.</p>
                    <p>• <b>Verifikasi Selesai:</b> Pastikan worker mengunggah foto bukti yang jelas sebelum Anda menutup tugas tersebut.</p>
                    <p>• <b>Komunikasi:</b> Gunakan fitur chat untuk koordinasi cepat jika ada alamat yang susah ditemukan.</p>
                </div>
            )
        }
    ],
    WORKER: [
        {
            title: "🔵 1. Panduan Misi Lapangan (Indonesia)",
            content: (
                <div className="space-y-2 text-xs border-l-4 border-blue-600 bg-blue-500/5 p-2 rounded">
                    <p className="font-bold text-blue-600 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> PROTOKOL WORKER:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><b>Klaim Tugas:</b> Ambil tugas di 'Delivery Pool'. Satu mobil bisa bawa sampai 5 pesanan sekaligus.</li>
                        <li><b>Start Mission:</b> Wajib tekan tombol mulai saat berangkat agar GPS aktif dan pelanggan bisa melacak Anda.</li>
                        <li><b>Upload Bukti:</b> Jangan lupa foto barang di lokasi! Tanpa foto, tugas tidak bisa dianggap selesai.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "2. Tips Navigasi & Keamanan",
            content: (
                <div className="space-y-2 text-xs">
                    <p>• Gunakan tombol <b>"Search Map"</b> untuk bantuan rute Google Maps secara otomatis.</p>
                    <p>• Jika status kendaraan <b>"RETURNING"</b>, artinya Anda sedang dalam perjalanan kembali ke kantor untuk tugas berikutnya.</p>
                    <p>• Jaga komunikasi dengan Operator via chat jika ada kendala di jalan (macet/ban bocor).</p>
                </div>
            )
        }
    ],
    USER: [
        {
            title: "🔴 1. How to Rent",
            content: (
                <div className="space-y-2 text-xs">
                    <p>1. Choose your gear and duration.</p>
                    <p>2. Complete the invoice payment.</p>
                    <p>3. Wait for our team to verify and dispatch your items.</p>
                </div>
            )
        }
    ]
}

export function DashboardGuide({ role }: { role: Role }) {
    const sections = GUIDES[role] || []

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest gap-2 bg-white/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all shadow-sm">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    {role === 'ADMIN' ? "System Guide (AU)" : "Panduan Sistem (ID)"}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-l-primary/10">
                <SheetHeader className="pb-6 border-b border-primary/10">
                    <SheetTitle className="text-2xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                        <Info className="h-6 w-6" />
                        {role === 'ADMIN' ? "Rig Command Guide" : "Panduan Kendali Sistem"}
                    </SheetTitle>
                    <SheetDescription className="text-sm font-medium italic opacity-70">
                        {role === 'ADMIN' 
                            ? "Operational manual for the engine room, cheers mate!" 
                            : "Manual operasional untuk tim lapangan dan operator."}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {sections.map((sec, i) => (
                            <AccordionItem key={i} value={`sec-${i}`} className="border rounded-xl px-4 bg-muted/20 border-primary/5">
                                <AccordionTrigger className="text-xs font-black uppercase tracking-wider py-4 hover:no-underline hover:text-primary transition-colors">
                                    {sec.title}
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 text-sm text-muted-foreground leading-relaxed">
                                    {sec.content}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-[11px] font-medium text-primary/80 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p>
                            {role === 'ADMIN'
                                ? "This guide reflects the live system state. Follow the rules and the whole rig runs smooth as silk. Good on ya!"
                                : "Panduan ini mencerminkan kondisi sistem saat ini. Ikuti aturan agar operasional berjalan lancar dan aman."}
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
