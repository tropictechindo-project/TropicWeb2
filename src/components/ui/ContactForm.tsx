'use client';

import React, { useState } from 'react';
import { submitContactForm } from '@/app/actions/contact';
import { Button } from '@/components/ui/button';

export default function ContactForm({ source = 'contact_page' }: { source?: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Force Turbopack recompile
    console.log("ContactForm initialized with Button:", !!Button);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');
        setErrorMessage('');

        const formData = new FormData(e.currentTarget);
        formData.append('source', source); // explicitly pass source

        try {
            const result = await submitContactForm(formData);

            if (result.success) {
                setStatus('success');
                (e.target as HTMLFormElement).reset();
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'Something went wrong. Please try again.');
                console.error("Form error:", result);
            }
        } catch (err) {
            console.error("Submission exception:", err);
            setStatus('error');
            setErrorMessage('Failed to submit the form due to a network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent Successfully!</h3>
                <p className="text-green-700 mb-6">Thank you for reaching out. Our team will get back to you shortly.</p>
                <Button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2 rounded-full font-bold bg-green-600 hover:bg-green-700 text-white"
                >
                    Send Another Message
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field - visually hidden, blocks bots */}
            <div className="hidden" aria-hidden="true">
                <label htmlFor="bot_trap">Do not fill this out if you are human</label>
                <input type="text" name="bot_trap" id="bot_trap" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        minLength={2}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                        placeholder="john@example.com"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone / WhatsApp</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                        placeholder="+62 812 3456 7890"
                    />
                </div>
                <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <select
                        id="subject"
                        name="subject"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
                    >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Rental Quote">Request a Rental Quote</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="B2B / Event Equipment">B2B / Event Equipment</option>
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    minLength={10}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition resize-none"
                    placeholder="How can we help you today?"
                ></textarea>
            </div>

            {status === 'error' && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold py-6 rounded-xl flex justify-center items-center text-lg"
            >
                {isSubmitting ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Message...
                    </>
                ) : (
                    'Send Message'
                )}
            </Button>
        </form>
    );
}
