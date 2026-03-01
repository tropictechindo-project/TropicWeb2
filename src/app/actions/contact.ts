'use server';

import { db } from '@/lib/db';
import { z } from 'zod';

// Using raw fetch for Resend to avoid installing unnecessary SDK if it doesn't exist
// User specified: "Supabase already integrated with Resend.com... Email system uses contact@tropictech.online"
// We will try to use the most generic HTTP approach if a global emailer isn't found.
import { sendEmail } from '@/lib/email';

const ContactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().min(10, 'Message must be at least 10 characters'),
    source: z.string().default('contact_page'),
    // Honeypot field
    bot_trap: z.string().optional(),
});

export async function submitContactForm(formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: (formData.get('phone') as string) || '',
            subject: (formData.get('subject') as string) || '',
            message: formData.get('message') as string,
            source: (formData.get('source') as string) || 'contact_page',
            bot_trap: formData.get('bot_trap') as string,
        };

        // 1. Validate honeypot (if bot filled it, silent reject)
        if (rawData.bot_trap) {
            return { success: true, message: 'Message sent successfully.' };
        }

        // 2. Validate input
        const validatedData = ContactSchema.parse(rawData);

        // 3. Save to database
        const contactMessage = await db.contactMessage.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone || null,
                subject: validatedData.subject || null,
                message: validatedData.message,
                source: validatedData.source,
            },
        });

        // 4. Send Email via existing infrastructure
        try {
            // Assuming src/lib/email has a sendEmail function (based on COMPREHANSIVE_DATA_UPDATE.md)
            await sendEmail({
                to: 'tropictechindo@gmail.com', // As requested: To TropicTechIndo
                subject: `[New Contact] ${validatedData.subject || 'Inquiry'} from ${validatedData.name}`,
                html: `
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${validatedData.name}</p>
          <p><strong>Email:</strong> ${validatedData.email}</p>
          <p><strong>Phone:</strong> ${validatedData.phone || 'N/A'}</p>
          <p><strong>Source:</strong> ${validatedData.source}</p>
          <hr/>
          <p><strong>Message:</strong></p>
          <p>${validatedData.message.replace(/\n/g, '<br/>')}</p>
        `,
                // The sender "From: contact@tropictech.online" should be handled inside sendEmail natively
            });

            return { success: true, message: 'Message sent successfully!' };
        } catch (emailError) {
            console.error('Failed to send email via primary transport:', emailError);

            // 5. Fallback to Formspree if primary email fails
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

            return { success: true, message: 'Message sent successfully via fallback route.', isFallback: true };
        }

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation failed', details: error.issues };
        }
        console.error('Contact form submission error:', error);
        return { success: false, error: 'Failed to submit form. Please try again.' };
    }
}
