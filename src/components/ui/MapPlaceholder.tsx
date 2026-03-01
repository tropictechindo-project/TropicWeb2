'use client';

import React from 'react';

export default function MapPlaceholder() {
    return (
        <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-3xl overflow-hidden shadow-inner relative flex items-center justify-center">
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126214.37255476607!2d115.08581335!3d-8.6704581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd2409b0e5e80b9%3A0x5030bfbca831100!2sBadung%20Regency%2C%20Bali!5e0!3m2!1sen!2sid!4v1709400000000!5m2!1sen!2sid"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 z-10 w-full h-full"
                title="Tropic Tech Bali Location"
            />
            {/* Fallback Skeleton behind the iframe to prevent layout shift */}
            <div className="absolute inset-0 bg-blue-50/50 flex flex-col items-center justify-center text-center p-8 z-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-blue-300 animate-pulse">Loading Map...</h3>
            </div>
        </div>
    );
}
