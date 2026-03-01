'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const AffiliateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(5, 'Phone number is required'),
    company: z.string().optional(),
    website: z.string().optional(),
    message: z.string().min(10, 'Please tell us how you plan to promote Tropic Tech'),
    source: z.string().default('affiliate_page'),
    bot_trap: z.string().optional(),
});

export async function submitAffiliateForm(formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: (formData.get('phone') as string) || '',
            company: (formData.get('company') as string) || '',
            website: (formData.get('website') as string) || '',
            message: formData.get('message') as string,
            source: 'affiliate_page',
            bot_trap: formData.get('bot_trap') as string,
        };

        if (rawData.bot_trap) {
            return { success: true, message: 'Application submitted successfully.' };
        }

        const validatedData = AffiliateSchema.parse(rawData);

        // Save to database as a contact message but with origin 'affiliate_page'
        await db.contactMessage.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone || null,
                subject: `Affiliate Application: ${validatedData.company || validatedData.name}`,
                message: `Company: ${validatedData.company}\nWebsite/Socials: ${validatedData.website}\n\nPitch:\n${validatedData.message}`,
                source: validatedData.source,
            },
        });

        // Send Email via existing infrastructure
        try {
            await sendEmail({
                to: 'tropictechindo@gmail.com',
                subject: `🔥 New Affiliate Application from ${validatedData.name}`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px;">
                      <h2 style="color: #1e3a8a;">New Affiliate Program Application</h2>
                      <p><strong>Name:</strong> ${validatedData.name}</p>
                      <p><strong>Email:</strong> ${validatedData.email}</p>
                      <p><strong>Phone:</strong> ${validatedData.phone}</p>
                      <p><strong>Company/Agency:</strong> ${validatedData.company || 'N/A'}</p>
                      <p><strong>Website/Social Media:</strong> ${validatedData.website || 'N/A'}</p>
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                      <p><strong>Message / Promotional Pitch:</strong></p>
                      <p style="white-space: pre-wrap; background: #f3f4f6; padding: 15px; border-radius: 8px;">${validatedData.message}</p>
                  </div>
                `,
            });

            return { success: true, message: 'Application submitted successfully!' };
        } catch (emailError) {
            console.error('Failed to send email via primary transport:', emailError);

            // Fallback to Formspree if primary email fails
            const formspreeData = new FormData();
            Object.keys(validatedData).forEach(key => {
                if (key !== 'bot_trap') {
                    formspreeData.append(key, (validatedData as any)[key]);
                }
            });

            const response = await fetch('https://formspree.io/f/mwvnjbly', {
                method: 'POST',
                body: formspreeData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Fallback failed as well.');
            }

            return { success: true, message: 'Application submitted successfully via fallback route.', isFallback: true };
        }

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation failed', details: error.issues };
        }
        console.error('Affiliate form submission error:', error);
        return { success: false, error: 'Failed to submit application. Please try again.' };
    }
}
