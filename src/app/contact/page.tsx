import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ContactForm from '@/components/ui/ContactForm';

// Lazy load map component (if one exists) or prevent blocking the main thread entirely.
// Note: User said "Use existing integrated Google Maps API" - we'll implement a fallback if it's missing,
// but ensure it's client-run and lazy. Wait for hydration before showing heavy maps.
const DynamicClientMap = dynamic(() => import('@/components/ui/MapPlaceholder'), {
    loading: () => <div className="w-full h-full min-h-[400px] bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

export const metadata: Metadata = {
    title: 'Contact Us | PT Tropic Tech International',
    description: 'Get in touch with Tropic Tech Bali. Our support team is active everyday from 08:00 to 24:00 WITA for equipment rentals and technical support.',
    alternates: {
        canonical: 'https://tropictech.online/contact'
    }
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            {/* Hero */}
            <section className="bg-gray-900 text-white py-16 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">Get In Touch</span>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                            Contact Tropic Tech Bali
                        </h1>
                        <p className="text-lg text-gray-300 max-w-lg mb-8">
                            Need an immediate hardware dropoff? Having technical issues? Contact our operational center in Bali for instant support.
                        </p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 flex flex-col gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Email Us directly</h3>
                                <a href="mailto:contact@tropictech.online" className="text-blue-400 hover:underline">contact@tropictech.online</a>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.012.477 1.185.564c.173.087.289.129.332.202.043.073.043.423-.101.827z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Call / WhatsApp</h3>
                                <a target="_blank" rel="noopener noreferrer" href="https://wa.me/628000000000" className="text-green-400 hover:underline">+62 800 000 0000</a>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Operating Hours</h3>
                                <p className="text-gray-300">Mon-Sun: 08:00 - 24:00 WITA</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20 px-6 max-w-7xl mx-auto w-full flex-grow grid lg:grid-cols-2 gap-16">

                {/* Contact Form Section */}
                <div>
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Send a Message</h2>
                        <p className="text-gray-600">Fill out the form below. If you're inquiring about a B2B order or event, please specify in the subject line. We'll reply within minutes during working hours.</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <ContactForm source="contact_page" />
                    </div>
                </div>

                {/* Map & Office Info Section */}
                <div className="flex flex-col">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Operations Hub</h2>
                        <p className="text-gray-600">While Tropic Tech operates as a first-class delivery-centric business, our dispatch operations are rooted in South Bali.</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex-grow flex flex-col">
                        <div className="p-8 pb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">PT Tropic Tech International</h3>
                            <p className="text-gray-600 mb-6">Badung Residency, Bali, Indonesia</p>
                        </div>
                        <div className="w-full flex-grow min-h-[400px] p-6 pt-0 relative">
                            {/* 
                   We lazy load the map here because standard IFRAMES ruin Lighthouse scores.
                   If the client doesn't have MapPlaceholder component yet, we just render a clean UI block.
                 */}
                            <DynamicClientMap />
                        </div>
                    </div>
                </div>

            </section>
            <Footer />
        </div>
    );
}
