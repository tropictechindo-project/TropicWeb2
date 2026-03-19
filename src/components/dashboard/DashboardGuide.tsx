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
    <ul className="list-disc pl-4 space-y-1 text-xs">
        <li><strong>Invoice:</strong> Financial source of truth. Created during checkout or manually. Standardizes the payment lifecycle.</li>
        <li><strong>Order:</strong> Created automatically AFTER invoice is paid or confirmed. Triggers fulfillment workflows.</li>
        <li><strong>OrderItem:</strong> Specific snapshot of items in an order. Normalizes historical price and name independently of current Product catalogs.</li>
        <li><strong>InventoryUnit:</strong> Individual discrete asset unit assigned for asset tracking (passive ROI layer).</li>
        <li><strong>ProductUnit:</strong> Core system allocation stock buffer defining available rental buffers for oversell guards.</li>
        <li><strong>Delivery:</strong> Scheduled courier workflow logistics associated with orders.</li>
        <li><strong>Tracking:</strong> Live telemetry status defining asset waypoint states accurately.</li>
        <li><strong>ROI:</strong> Return on Investment tracking assigned to standalone InventoryUnits discretely.</li>
    </ul>
)

const SYSTEM_TRUTH_CONTENT = (
    <div className="space-y-2 text-xs border-l-4 border-red-500 bg-red-500/5 p-2 rounded">
        <p className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> HOW THIS SYSTEM ACTUALLY WORKS:</p>
        <ul className="list-disc pl-4 space-y-1">
            <li><strong>Invoice-First:</strong> Invoices are the absolute financial source of truth.</li>
            <li><strong>Order Lifecycle:</strong> Orders are created ONLY AFTER payment verification.</li>
            <li><strong>Optional Tracking:</strong> Inventory tracking is OPTIONAL and depends on manual assignment.</li>
            <li><strong>Partial ROI:</strong> ROI calculations are based ONLY on linked inventory units.</li>
            <li><strong>Custom Orders:</strong> Not all business actions (manual invoices) appear in ROI.</li>
        </ul>
    </div>
)

const DATA_LIMITATIONS_CONTENT = (
    <div className="space-y-2 text-xs border-l-4 border-yellow-500 bg-yellow-500/5 p-2 rounded">
        <p className="font-bold text-yellow-600 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> DATA LIMITATIONS & INTERPRETATION:</p>
        <ul className="list-disc pl-4 space-y-1">
            <li>Not all orders are linked to inventory units.</li>
            <li>ROI metrics ONLY include tracked assets, not the entire business performance.</li>
            <li>Manual invoices may not be represented in asset tracking.</li>
            <li>Dashboard summaries are <strong>PARTIAL visibility</strong>, not absolute business profit.</li>
        </ul>
    </div>
)

const GUIDES: Record<Role, GuideSection[]> = {
    ADMIN: [
        {
            title: "🔴 1. System Truth (How it Works)",
            content: SYSTEM_TRUTH_CONTENT
        },
        {
            title: "🟡 2. Data Limitations",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "🟠 3. Action Consequences",
            content: (
                <div className="space-y-2 text-xs">
                    <div>
                        <p className="font-bold text-primary">A. Confirming Payment:</p>
                        <p className="pl-3 text-muted-foreground">- Creates fully historical Order state.</p>
                        <p className="pl-3 text-muted-foreground">- Creates Snapshot OrderItems & schedules Delivery Dispatch.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3">- Action cannot be safely reversed.</p>
                    </div>
                    <div>
                        <p className="font-bold text-primary">B. Assigning Inventory Unit:</p>
                        <p className="pl-3 text-muted-foreground">- Adds item triggers into passive ROI summaries.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3">- Assignment is permanent & affects financial reports.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Role Definition (Tupoksi)",
            content: (
                <div className="space-y-2 text-xs">
                    <p><strong>Responsibilities:</strong> Absolute master control of financial validation, orders integrity, tracking overview, and asset ROI yields.</p>
                    <p><strong>Allowed:</strong> Confirm manual / online payments, assign or detach InventoryUnits optionally, adjust product configurations, and manage operators/workers.</p>
                    <p className="text-red-600 font-bold">MUST NOT DO: Confirm payments with un-audited receipts cascades; force-modify structural order templates without proper snapshot buffers.</p>
                </div>
            )
        },
        {
            title: "5. Real Workflow (Step-by-Step)",
            content: (
                <ol className="list-decimal pl-4 space-y-1 text-xs">
                    <li>Admin receives Stripe or uploaded receipt webhook manual confirmation requests.</li>
                    <li>Inside Dashboards invoices table, validates amounts corresponds with snapshot lineItems accurately.</li>
                    <li>Clicks <strong>"Confirm Payment"</strong> → Atomically creates Order, schedules Courier dispatching flows.</li>
                    <li>Optional: Enters Order item Dialog nodes expanding Snapshot maps row select → Assigns standard standalone InventoryUnit serials to update accurate passive ROI sums.</li>
                </ol>
            )
        },
        {
            title: "6. Inventory & ROI (Tracked vs Untracked)",
            content: (
                <div className="space-y-1 text-xs">
                    <p>Standard Inventory relies on core `ProductUnits` allocation locks inside deliveries loops to prevent oversells automatically.</p>
                    <p><strong>Discrete Tracking:</strong> `InventoryUnits` are individual passive identifiers assigned *after* layout execution builds. "Tracked" means linking an order item row triggers incremental ROIs summing over aggregates effortlessly. "Untracked" keeps item balances neutral offsets offsets.</p>
                </div>
            )
        },
        {
            title: "7. Warnings & Critical Mistakes",
            content: (
                <div className="space-y-2 text-xs">
                     <p className="border-l-4 border-red-500 pl-2 text-red-600 font-bold"><AlertTriangle className="h-3 w-3 inline mr-1"/> ABSOLUTE FINANCIAL CONTROL WARNING: Admin actions directly affect financial records. Incorrect invoice confirmation can create invalid orders.</p>
                     <p className="border-l-4 border-red-500 pl-2 text-red-600 font-bold"><AlertTriangle className="h-3 w-3 inline mr-1"/> ROI INTERPRETATION: ROI summary ONLY represents tracked units, NOT total business profit. Use it as a partial signal, not absolute truth.</p>
                </div>
            )
        },
        {
            title: "8. Terminology",
            content: COMMON_TERMINOLOGY
        }
    ],
    OPERATOR: [
        {
            title: "🔴 1. System Truth (How it Works)",
            content: SYSTEM_TRUTH_CONTENT
        },
        {
            title: "🟡 2. Data Limitations",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "🟠 3. Action Consequences",
            content: (
                <div className="space-y-2 text-xs">
                    <div>
                        <p className="font-bold text-primary">When you assign a delivery:</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> The worker becomes legally and operationally responsible for execution.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Pekerja (kurir) menjadi bertanggung jawab secara operasional atas eksekusi.</p>
                        
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> - Incorrect assignment may delay or fail delivery queue items.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> - Kesalahan penugasan dapat memperlambat atau menggagalkan antrian kiriman.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Role Definition (Tupoksi)",
            content: (
                <div className="space-y-2 text-xs">
                    <div>
                        <p><strong>EN: Responsibilities:</strong> Handling dispatch queues, Preparing delivery logistics, Assigning workers to scheduled orders.</p>
                        <p><strong>ID: Tanggung Jawab:</strong> Mengelola antrean pengiriman, Menyiapkan logistik, Menugaskan kurir untuk pesanan.</p>
                    </div>
                    <div>
                        <p><strong>EN: Allowed:</strong> Re-route dispatch triggers, assigning workers, monitoring live position telemetries offsets dashboards maps.</p>
                        <p><strong>ID: Di-izinkan:</strong> Membelokkan rute pengiriman, menugaskan kurir, memantau posisi live peta koordinat.</p>
                    </div>
                    <div className="text-red-600 font-bold border-l-2 border-red-500 pl-2">
                        <p><strong>EN: MUST NOT DO:</strong> Mark delivery completed before proper worker visual receipts are uploaded.</p>
                        <p><strong>ID: JANGAN LAKUKAN:</strong> Menandai selesai sebelum kurir mengunggah bukti visual lengkap.</p>
                    </div>
                </div>
            )
        },
        {
            title: "5. Real Workflow (Step-by-Step)",
            content: (
                <ol className="list-decimal pl-4 space-y-2 text-xs">
                    <li>
                        <p><strong>EN:</strong> Check Delivery pool aggregates for rows marked setup "Pending Assign".</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Periksa berkas antrean untuk baris berlabel "Menunggu Penugasan".</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Select eligible row → Trigger Worker Assign dropdown select.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Pilih baris layak → Gunakan dropdown pilih kurir.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Dispatches triggers push live notification alerts downwards safely.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Penugasan mendorong notifikasi live alarm kurir secara aman.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Oversee movement tracking benchmarks ensuring timeline accuracy.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Pantau pergerakan posisi melacak akurasi jadwal.</p>
                    </li>
                </ol>
            )
        },
        {
            title: "6. Warnings & Critical Mistakes",
            content: (
                <div className="space-y-1 text-xs border-l-4 border-red-500 bg-red-500/5 p-2 rounded">
                    <p className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> CRITICAL WARNING:</p>
                    <p><strong>EN:</strong> Mis-dispatching or assigning wrong worker location nodes creates overlap conflicts; enforce proper availability grids inspection early.</p>
                    <p><strong>ID:</strong> Kesalahan rute atau penugasan kurir salah titik membuat bentrok jadwal; periksa grid ketersediaan kurir lebih awal.</p>
                </div>
            )
        },
        {
            title: "7. Terminology",
            content: COMMON_TERMINOLOGY
        }
    ],
    WORKER: [
        {
            title: "🔴 1. System Truth (How it Works)",
            content: SYSTEM_TRUTH_CONTENT
        },
        {
            title: "🟡 2. Data Limitations",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "🟠 3. Action Consequences",
            content: (
                <div className="space-y-2 text-xs">
                    <div>
                        <p className="font-bold text-primary">A. Accepting a Job:</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> You are responsible for delivery completion. Your GPS updates power customer live tracking.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Anda bertanggung jawab atas kelengkapan pengiriman. Update GPS Anda menyalakan peta live pelanggan.</p>
                        
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> - Missing updates break tracking visibility.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> - Hilang pembaruan menghentikan pandangan peta pelanggan.</p>
                    </div>
                    <div>
                        <p className="font-bold text-primary">B. Uploading Proof:</p>
                        <p className="pl-3 text-muted-foreground"><strong>EN:</strong> Completes the delivery lifecycle.</p>
                        <p className="pl-3 text-muted-foreground"><strong>ID:</strong> Menyelesaikan hulu siklus pengiriman.</p>
                        
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>EN:</strong> - Missing proof results in incomplete system records audits.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3"><strong>ID:</strong> - Hilang foto membuat berkas gantung audit tidak selesai.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Worker Role Definition (Detailed)",
            content: (
                <div className="space-y-1 text-xs">
                    <p><strong>EN:</strong> Worker is responsible for visual physical execution of delivery drops. Actions directly affect tracking system state, customer experience, and completion statuses.</p>
                    <p><strong>ID:</strong> Kurir bertanggung jawab eksekusi fisik penyerahan barang. Tindakan langsung mempengaruhi status maps kelayakan sensor customer secara berkonsentrasi.</p>
                </div>
            )
        },
        {
            title: "5. Worker Responsibilities",
            content: (
                <ul className="list-disc pl-4 space-y-2 text-xs">
                    <li>
                        <p><strong>EN:</strong> Accept delivery jobs from the pool index.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Terima tugas berkas antrean kolam.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Navigate to destination safely.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Arahkan rute ke tujuan aman.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Update GPS location consistently.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Perbarui lokasi GPS secara konsisten.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Deliver items accurately to customers.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Serahkan barang secara akurat ke pelanggan.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Upload proof (photo) on arrival.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Unggah foto bukti kelengkapan tiba.</p>
                    </li>
                </ul>
            )
        },
        {
            title: "6. System Impact Details",
            content: (
                <ul className="list-disc pl-4 space-y-2 text-xs border-l-4 border-blue-500 bg-blue-500/5 p-2 rounded">
                    <li>
                        <p><strong>EN:</strong> GPS updates power real-time tracking pages.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Pembaruan GPS menyalakan peta waktu-nyata pelanggan.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Delivery completion depends on photographic upload.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Kelengkapan selesai tergantung 100% pada foto bukti.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Failure to update location breaks customer track visibilities.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Gagal perbarui merusak pantauan visibilitas pelanggan.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Incorrect drops affect whole system consistency loops.</p>
                        <p className="text-muted-foreground"><strong>ID:</strong> Kesalahan pengiriman merusak konsistensi rantai pasok.</p>
                    </li>
                </ul>
            )
        },
        {
            title: "7. Failure Cases (Operational Issues)",
            content: (
                <ul className="list-disc pl-4 space-y-2 text-xs text-red-600 font-bold">
                    <li>
                        <p><strong>EN:</strong> Not updating GPS → User cannot track delivery accurately.</p>
                        <p className="text-red-500"><strong>ID:</strong> Tidak perbarui GPS → Pelanggan tidak bisa melacak posisi akurat.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Not uploading proof → System considers job incomplete indefinitely.</p>
                        <p className="text-red-500"><strong>ID:</strong> Tidak unggah foto → Sistem anggap tugas gantung selamanya.</p>
                    </li>
                    <li>
                        <p><strong>EN:</strong> Accepting with idle delay → Operations bottleneck queues.</p>
                        <p className="text-red-500"><strong>ID:</strong> Menerima lambat → Hambatan operasional macet.</p>
                    </li>
                </ul>
            )
        },
        {
            title: "8. Terminology",
            content: COMMON_TERMINOLOGY
        }
    ],
    USER: [
        {
            title: "🔴 1. System Truth (How it Works)",
            content: SYSTEM_TRUTH_CONTENT
        },
        {
            title: "🟡 2. Data Limitations",
            content: DATA_LIMITATIONS_CONTENT
        },
        {
            title: "🟠 3. Action Consequences",
            content: (
                <div className="space-y-2 text-xs">
                    <div>
                        <p className="font-bold text-primary">When you submit payment:</p>
                        <p className="pl-3 text-muted-foreground">- Order will only be processed after confirmation.</p>
                        <p className="pl-3 text-red-600 font-bold ml-3">- Delivery will not start until payment is fully verified.</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Role Definition (Tupoksi)",
            content: (
                <div className="space-y-2 text-xs">
                    <p><strong>Responsibilities:</strong> Browse catalog, Create order bookings offsets, Upload legitimate receipt snaps aggregates for invoice audits forwards natively.</p>
                </div>
            )
        },
        {
            title: "5. Real Workflow (Step-by-Step)",
            content: (
                <ol className="list-decimal pl-4 space-y-1 text-xs">
                    <li>Browse products → Checkout creates Awaiting Payment Invoice structures index.</li>
                    <li>Provides uploaded transfers evidence triggers or triggers automated gateways safely.</li>
                    <li>Waits verification loops → Discovered order updates renders track maps overlays safely.</li>
                    <li>Accesses live path waypoints monitoring courier arrivals offsets forwards accurately.</li>
                </ol>
            )
        },
        {
            title: "6. Terminology",
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
