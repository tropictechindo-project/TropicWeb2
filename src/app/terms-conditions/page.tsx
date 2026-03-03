import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions | PT Tropic Tech International',
    description: 'Terms and Conditions for renting enterprise IT and office equipment from PT Tropic Tech International in Bali.',
    alternates: {
        canonical: 'https://tropictech.online/terms-conditions'
    }
};

export default function TermsConditionsPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            {/* Hero Section */}
            <section className="bg-gray-900 text-white py-24 px-6 relative overflow-hidden shrink-0 mt-[64px] md:mt-[80px]">
                <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-gray-900 to-black" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">Legal & Compliance</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                        Terms & Conditions
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                        The rules and guidelines for using Tropic Tech Bali services.
                    </p>
                    <p className="text-sm text-gray-400 mt-6">Last Updated: March 2026</p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16 px-6 max-w-4xl mx-auto w-full flex-grow">
                <div className="prose prose-blue dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-blue-600 dark:prose-a:text-blue-400">
                    <h2>1. General Provisions</h2>
                    <p>
                        Welcome to Tropic Tech Bali, operated by PT Tropic Tech International. These Terms and Conditions (&quot;Terms&quot;)
                        govern your access to and use of our website (tropictech.online) and our IT equipment rental services in Bali, Indonesia.
                        By creating an order, registering an account, or interacting with our platform, you agree to be bound by these Terms.
                    </p>

                    <h2>2. Rental Agreements & Orders</h2>
                    <ul>
                        <li><strong>Order Creation:</strong> All orders placed on our website are considered requests to rent equipment. An order is not confirmed until a formal Invoice is generated, and payment is verified by our administrative team.</li>
                        <li><strong>Equipment Use:</strong> Leased equipment remains the sole property of PT Tropic Tech International. You agree to use the equipment only in a careful and proper manner. Modification or sub-leasing of any hardware is strictly prohibited.</li>
                        <li><strong>Rental Period:</strong> The rental period begins on the day of delivery/handover and continues until the agreed-upon return date. Late returns not authorized in writing may incur additional daily charges.</li>
                    </ul>

                    <h2>3. Payment Terms & Invoicing</h2>
                    <p>
                        We strive for transparent and structured payment processes:
                    </p>
                    <ul>
                        <li><strong>Pricing:</strong> All prices are displayed in IDR, subject to a standard 2% product tax and dynamic delivery fees based on distance (e.g., IDR 10,000 per km). </li>
                        <li><strong>Verification:</strong> Payments made must be accompanied by proof of payment uploaded to the user dashboard unless processed via an automated provider. Orders remain in the &quot;Awaiting Payment&quot; status until verified by our Admin.</li>
                        <li><strong>Currency:</strong> While we provide real-time currency previews (USD, EUR, AUD, SGD), the official transaction currency is IDR.</li>
                    </ul>

                    <h2>4. Delivery & Logistics</h2>
                    <p>
                        We operate a professional internal dispatch system to ensure secure equipment handling:
                    </p>
                    <ul>
                        <li><strong>Delivery Execution:</strong> Deliveries and returns are routed via our native Field Worker Application. We guarantee delivery timelines based on the scheduled slots selected during checkout.</li>
                        <li><strong>Location Accuracy:</strong> It is the renter&apos;s responsibility to provide precise GPS coordinates or accurate addresses. Failed deliveries due to incorrect location data may be subject to redelivery fees.</li>
                        <li><strong>Asset Condition:</strong> Before accepting delivery, the renter or their representative must inspect the equipment. Our workers log the &quot;Delivered&quot; condition in our Sync Log. Any pre-existing damage must be reported immediately upon receipt.</li>
                    </ul>

                    <h2>5. Damage, Loss, and Maintenance</h2>
                    <p>
                        Our mission is to provide stress-free hardware, but renters hold specific responsibilities during the rental period:
                    </p>
                    <ul>
                        <li><strong>Liability:</strong> The renter assumes full responsibility for the equipment from the time of handover until return. This includes damage beyond normal wear and tear, theft, or loss.</li>
                        <li><strong>Repair Costs:</strong> If equipment is returned damaged, we reserve the right to assess repair or replacement costs based on the serial-tracked unit&apos;s logged condition.</li>
                        <li><strong>Hardware Swap SLA:</strong> If hardware fails due to inherent defects (not user-caused damage), we provide a 24-hour hardware swap SLA within our primary Bali coverage areas.</li>
                    </ul>

                    <h2>6. Account Security</h2>
                    <p>
                        If you create an account, you are responsible for maintaining its security and confidentiality. Our platform employs NextAuth and Supabase for robust authentication, but you must promptly notify us of any unauthorized use of your account.
                    </p>

                    <h2>7. System Integrity & Operations</h2>
                    <p>
                        Tropic Tech utilizes advanced systems including real-time polling, inventory conflict detection, and AI orchestration. Attempting to bypass, manipulate, or exploit our internal APIs, payment verifications, or scheduling systems will result in immediate termination of services and potential legal action.
                    </p>

                    <h2>8. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Bali.
                    </p>

                    <h2>9. Contact Information</h2>
                    <p>
                        For legal inquiries regarding these Terms and Conditions:
                    </p>
                    <p>
                        <strong>PT Tropic Tech International</strong><br />
                        Email: contact@tropictech.online<br />
                        Phone: +62 822 6657 4860
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
}
