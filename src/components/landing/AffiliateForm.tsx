'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { submitAffiliateForm } from '@/app/actions/affiliate';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

export default function AffiliateForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    async function actionHandler(formData: FormData) {
        setIsSubmitting(true);
        try {
            const result = await submitAffiliateForm(formData);

            if (result.success) {
                setIsSuccess(true);
                toast.success('Your affiliate application has been submitted successfully!');
            } else {
                toast.error(result.error || 'Failed to submit application.');
                if (result.details) {
                    result.details.forEach((err: any) => {
                        toast.error(`${err.path.join('.')}: ${err.message}`);
                    });
                }
            }
        } catch (error) {
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-2xl border border-green-100 min-h-[400px]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Application Received!</h3>
                <p className="text-green-700 max-w-sm">
                    Thank you for applying to the Tropic Tech Affiliate Program. Our team will review your application and get back to you within 2-3 business days.
                </p>
                <Button
                    className="mt-8 bg-green-600 hover:bg-green-700 rounded-full"
                    onClick={() => setIsSuccess(false)}
                >
                    Submit Another Application
                </Button>
            </div>
        );
    }

    return (
        <form action={actionHandler} className="space-y-6">
            <input type="text" name="bot_trap" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="name" name="name" placeholder="John Doe" required className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" required className="rounded-xl h-12" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone / WhatsApp <span className="text-red-500">*</span></Label>
                    <Input id="phone" name="phone" placeholder="+62 812 3456 7890" required className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company">Company / Agency Name</Label>
                    <Input id="company" name="company" placeholder="Optional" className="rounded-xl h-12" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="website">Website / Main Social Media Link</Label>
                <Input id="website" name="website" placeholder="https://instagram.com/yourprofile" className="rounded-xl h-12" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="message">How do you plan to promote Tropic Tech? <span className="text-red-500">*</span></Label>
                <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your audience and how you intend to share our rental services..."
                    rows={5}
                    required
                    className="rounded-xl resize-none"
                />
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-full text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting Application...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5 mr-2" />
                        Apply For Affiliate Program
                    </>
                )}
            </Button>
        </form>
    );
}
