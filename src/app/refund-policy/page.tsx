import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Refund Policy | PT Tropic Tech International',
    description: 'Read the comprehensive Refund and Cancellation Policy for PT Tropic Tech International IT and office equipment rentals in Bali.',
    alternates: {
        canonical: 'https://tropictech.online/refund-policy'
    }
};

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            {/* Hero Section */}
            <section className="bg-gray-900 text-white py-24 px-6 relative overflow-hidden shrink-0 mt-[64px] md:mt-[80px]">
                <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-gray-900 to-black" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">Legal & Compliance</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                        Refund Policy
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                        Clear guidelines for cancellations, modifications, and refunds.
                    </p>
                    <p className="text-sm text-gray-400 mt-6">Last Updated: March 2026</p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16 px-6 max-w-4xl mx-auto w-full flex-grow">
                <div className="prose prose-blue dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-blue-600 dark:prose-a:text-blue-400">
                    <h2>1. Overview</h2>
                    <p>
                        At PT Tropic Tech International, we recognize that plans change, especially for dynamic digital squads and remote workers operating in Bali.
                        Our refund policy is designed to be fair to our clients while protecting our operational dispatch and inventory allocation systems.
                    </p>

                    <h2>2. Cancellation Timelines</h2>
                    <p>The eligibility for a refund depends on when the cancellation request is made relative to the scheduled delivery date:</p>
                    <ul>
                        <li><strong>More than 48 hours before delivery:</strong> 100% Full Refund. We can re-allocate the inventory without disruption to our field workers.</li>
                        <li><strong>24 to 48 hours before delivery:</strong> 50% Refund of the rental subtotal. Delivery fees (if applicable) will be fully refunded as the dispatch has not been executed.</li>
                        <li><strong>Less than 24 hours before delivery / At the door:</strong> No refund on the rental subtotal. The equipment has already been prepped, locked in our inventory sync pool, and dispatched. Delivery fees are non-refundable at this stage.</li>
                    </ul>

                    <h2>3. Early Returns</h2>
                    <p>
                        If you choose to return the rented equipment before the end of your original scheduled rental period (e.g., returning a monitor after 1 week instead of 1 month), <strong>we do not offer pro-rated refunds for the unused time.</strong>
                        Our pricing models are strictly structured around the initial committed duration.
                    </p>

                    <h2>4. Faulty Equipment & Guarantees</h2>
                    <p>
                        We deploy premium, serialized assets. However, hardware faults occasionally occur:
                    </p>
                    <ul>
                        <li><strong>Hardware Swap SLA:</strong> If the delivered equipment is faulty upon arrival or breaks down during use (due to inherent manufacturer defects, not user damage), we guarantee a replacement swap within 24 hours.</li>
                        <li><strong>Service Failure Refund:</strong> If we fail to meet our 24-hour swap SLA and subsequent use of the equipment is impossible, we will offer a pro-rated refund for the days the equipment was unusable or a full refund if the rental just commenced.</li>
                        <li><strong>Notification:</strong> You must immediately notify our support team (support@tropictech.online or via WhatsApp) the moment you encounter a hardware issue.</li>
                    </ul>

                    <h2>5. Modification of Orders</h2>
                    <p>
                        If you wish to upgrade or downgrade your requested equipment before delivery, we will adjust your invoice accordingly. Subject to our 48-hour timeline rules above, refunds for downgrades will be processed minus any applicable transaction fees.
                    </p>

                    <h2>6. Refund Processing Time</h2>
                    <p>
                        Once approved by our Central Admin, refunds are processed back to the original method of payment (or via secure bank transfer if the original method is unavailable). Please allow <strong>5-10 business days</strong> for the funds to appear in your account, depending on your financial institution&apos;s processing times.
                    </p>

                    <h2>7. How to Request a Refund</h2>
                    <p>
                        To initiate a cancellation and request a refund:
                    </p>
                    <ol>
                        <li>Log in to your Tropic Tech <Link href="/dashboard">User Dashboard</Link>.</li>
                        <li>Locate the specific Order or Invoice under your history.</li>
                        <li>Contact our team immediately referring to your Order ID to halt the dispatch process.</li>
                    </ol>
                    <br />
                    <p>
                        <strong>Direct Contact Details for Cancellations:</strong><br />
                        Email: support@tropictech.online<br />
                        WhatsApp/Phone: +62 822 6657 4860
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
}
