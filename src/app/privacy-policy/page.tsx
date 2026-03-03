import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | PT Tropic Tech International',
    description: 'Privacy Policy for PT Tropic Tech International, governing data collection, usage, and protection for our enterprise IT and office equipment rental services.',
    alternates: {
        canonical: 'https://tropictech.online/privacy-policy'
    }
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            {/* Hero Section */}
            <section className="bg-gray-900 text-white py-24 px-6 relative overflow-hidden shrink-0 mt-[64px] md:mt-[80px]">
                <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-gray-900 to-black" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">Legal & Compliance</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                        Privacy Policy
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                        How PT Tropic Tech International collects, uses, and protects your information.
                    </p>
                    <p className="text-sm text-gray-400 mt-6">Last Updated: March 2026</p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16 px-6 max-w-4xl mx-auto w-full flex-grow">
                <div className="prose prose-blue dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-blue-600 dark:prose-a:text-blue-400">
                    <h2>1. Introduction</h2>
                    <p>
                        PT Tropic Tech International (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates <strong>Tropic Tech Bali</strong> (tropictech.online).
                        We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard
                        your information when you visit our website, use our rental management services, or interact with our operations.
                    </p>

                    <h2>2. Information We Collect</h2>
                    <p>We collect data to operate effectively and provide you the best experiences with our rental services. We collect the following types of information:</p>
                    <ul>
                        <li><strong>Personal Information:</strong> Name, email address, phone number (WhatsApp), and billing/delivery addresses.</li>
                        <li><strong>Account Data:</strong> Information required to maintain your user or corporate account on our platform.</li>
                        <li><strong>Transaction Data:</strong> Rental history, invoice records, and payment confirmations. <em>Note: We do not store raw credit card details; all payments go through secure third-party processors.</em></li>
                        <li><strong>Location Data:</strong> To facilitate precision deliveries, our system may request GPS coordinates via the browser&apos;s Location API during checkout or delivery.</li>
                        <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, operating system, and platform used to access our website.</li>
                    </ul>

                    <h2>3. How We Use Your Information</h2>
                    <p>We use the information we collect primarily to provide, maintain, and improve our services:</p>
                    <ul>
                        <li><strong>Service Delivery:</strong> To process your orders, schedule deliveries, and manage asset inventory seamlessly via our internal dispatch and driver systems.</li>
                        <li><strong>Communication:</strong> To send you transactional notifications (e.g., invoices, delivery ETAs, hardware updates) and respond to your customer service requests via email (contact@tropictech.online) or WhatsApp.</li>
                        <li><strong>System Operations:</strong> To administer our website, conduct data analysis, testing, and system maintenance.</li>
                        <li><strong>Security & Fraud Prevention:</strong> To protect our assets equipped with serial trackers and prevent fraudulent rental activity.</li>
                    </ul>

                    <h2>4. Data Sharing and Disclosure</h2>
                    <p>
                        We do not sell your personal data. We may share your information with trusted third parties strictly for the purpose of fulfilling our operational requirements:
                    </p>
                    <ul>
                        <li><strong>Service Providers:</strong> For payment processing, email delivery (Resend.com), and cloud hosting (Supabase).</li>
                        <li><strong>Logistics Partners:</strong> Delivery details provided to internal Field Workers or external couriers (Gojek/Grab) to execute equipment handovers.</li>
                        <li><strong>Legal Obligations:</strong> If required by Indonesian law, law enforcement, or regulatory bodies.</li>
                    </ul>

                    <h2>5. Data Security & Storage</h2>
                    <p>
                        We have implemented rigorous technical and organizational measures to secure your data. Our backend architecture utilizes automated synchronization protocols and secure database indexing (PostgreSQL via Prisma ORM) bounded by strict Row Level Security (RLS) policies.
                        Your profile access is protected by modern NextAuth authentication standards.
                    </p>

                    <h2>6. Your Rights</h2>
                    <p>
                        Depending on your jurisdiction, you may have the right to access, correct, or delete the personal data we hold about you.
                        If you wish to exercise these rights, or if you have any questions regarding how your data is handled, please contact us.
                    </p>

                    <h2>7. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time to reflect changes in our operational procedures or compliance requirements.
                        Any significant changes will be communicated via your registered email or highlighted on our website.
                    </p>

                    <h2>8. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact our administrative team:
                    </p>
                    <ul>
                        <li><strong>Company:</strong> PT Tropic Tech International</li>
                        <li><strong>Email:</strong> contact@tropictech.online</li>
                        <li><strong>Phone/WhatsApp:</strong> +62 822 6657 4860</li>
                        <li><strong>Address:</strong> Jl. Tunjungsari No.8, Bali 80117, Indonesia</li>
                    </ul>
                </div>
            </section>

            <Footer />
        </div>
    );
}
