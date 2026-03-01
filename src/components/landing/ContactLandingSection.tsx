import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContactLandingSection() {
    return (
        <section className="bg-gray-50 py-24 px-6 md:px-12 w-full border-t border-gray-200">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center justify-between">
                <div className="md:w-1/2">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Ready to upgrade your workspace?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-lg">
                        Whether you need a single monitor for a week or fifty laptops for a corporate retreat, PT Tropic Tech International provides seamless deployment across Bali.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Email</h4>
                                <a href="mailto:contact@tropictech.online" className="text-blue-600 hover:underline">contact@tropictech.online</a>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.012.477 1.185.564c.173.087.289.129.332.202.043.073.043.423-.101.827z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">WhatsApp</h4>
                                <a target="_blank" rel="noopener noreferrer" href="https://wa.me/6282266574860" className="text-green-600 hover:underline">+62 822 6657 4860</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col items-center text-center">
                    <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transform -rotate-3 border border-blue-100">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Send us a direct request</h3>
                    <p className="text-gray-500 mb-8 w-full max-w-sm mx-auto">Skip the chat and send a formal request to our dispatch team for a custom quote or tech support.</p>
                    <Button asChild size="lg" className="w-full font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                        <Link href="/contact">
                            Open Contact Form
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
