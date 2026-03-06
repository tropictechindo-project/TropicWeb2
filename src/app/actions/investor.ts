'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const InvestorSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(5, 'Phone number is required'),
    company: z.string().min(2, 'Company name is required'),
    investmentRange: z.string().min(1, 'Please select an investment range'),
    message: z.string().min(10, 'Please tell us about your investment interest'),
    source: z.string().default('investor_section'),
    bot_trap: z.string().optional(),
});

export async function submitInvestorForm(formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: (formData.get('phone') as string) || '',
            company: (formData.get('company') as string) || '',
            investmentRange: (formData.get('investmentRange') as string) || '',
            message: formData.get('message') as string,
            source: 'investor_section',
            bot_trap: formData.get('bot_trap') as string,
        };

        if (rawData.bot_trap) {
            return { success: true, message: 'Message sent successfully.' };
        }

        const validatedData = InvestorSchema.parse(rawData);

        // Save to database as a contact message but with specific subject and source
        await db.contactMessage.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone || null,
                subject: `[INVESTOR INTEREST] ${validatedData.company} - ${validatedData.investmentRange}`,
                message: `Company: ${validatedData.company}\nInvestment Range: ${validatedData.investmentRange}\n\nMessage:\n${validatedData.message}`,
                source: validatedData.source,
            },
        });

        // Send Email directly to CEO
        try {
            await sendEmail({
                to: 'ceo@tropictech.online',
                subject: `💎 NEW INVESTOR INQUIRY: ${validatedData.company}`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px;">
              <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">Investor Opportunity</h2>
              <p><strong>Investor Name:</strong> ${validatedData.name}</p>
              <p><strong>Company:</strong> ${validatedData.company}</p>
              <p><strong>Email:</strong> ${validatedData.email}</p>
              <p><strong>Phone:</strong> ${validatedData.phone}</p>
              <p><strong>Investment Interest:</strong> <span style="color: #059669; font-weight: bold;">${validatedData.investmentRange}</span></p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p><strong>Message / Proposal:</strong></p>
              <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #1e3a8a;">${validatedData.message}</p>
              <p style="font-size: 11px; color: #64748b; margin-top: 30px;">This inquiry was submitted via the Investor Section on Tropic Tech.</p>
          </div>
        `,
            });

            return { success: true, message: 'Your investment inquiry has been sent to our CEO. We will contact you shortly.' };
        } catch (emailError) {
            console.error('Failed to send investor email:', emailError);
            // Fallback is handled by the generic contact logic if we want, but for investors, let's just log it.
            // We already saved it to DB, so it's not lost.
            return { success: true, message: 'Your inquiry was saved. Our executive team will reach out.' };
        }

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation failed', details: error.issues };
        }
        console.error('Investor form submission error:', error);
        return { success: false, error: 'Failed to submit inquiry. Please try again.' };
    }
}
