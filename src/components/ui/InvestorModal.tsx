'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { submitInvestorForm } from '@/app/actions/investor';
import { Landmark, TrendingUp, Sparkles } from 'lucide-react';

export function InvestorModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await submitInvestorForm(formData);

            if (result.success) {
                toast.success(result.message);
                setIsOpen(false);
            } else {
                toast.error(result.error || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to submit form. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto border-primary/20 bg-[#0a0a0a] text-white">
                <DialogHeader>
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase italic">
                        Invest in <span className="text-blue-500">Tropic Tech</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">
                        Secure your partnership with Bali's fastest-growing hardware network. Our executive team will review your inquiry within 24 hours.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Bot Trap */}
                    <input type="hidden" name="bot_trap" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs uppercase tracking-widest font-bold text-slate-500">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                placeholder="Investment Officer"
                                className="bg-white/5 border-white/10 focus:border-blue-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-xs uppercase tracking-widest font-bold text-slate-500">Company / Fund</Label>
                            <Input
                                id="company"
                                name="company"
                                required
                                placeholder="Venture Partners"
                                className="bg-white/5 border-white/10 focus:border-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-slate-500">Direct Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="name@fund.com"
                                className="bg-white/5 border-white/10 focus:border-blue-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs uppercase tracking-widest font-bold text-slate-500">Phone / WhatsApp</Label>
                            <Input
                                id="phone"
                                name="phone"
                                required
                                placeholder="+1 234 567 890"
                                className="bg-white/5 border-white/10 focus:border-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="investmentRange" className="text-xs uppercase tracking-widest font-bold text-slate-500">Target Investment Range (IDR)</Label>
                        <Select name="investmentRange" required>
                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-blue-500/50">
                                <SelectValue placeholder="Select interest level" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                <SelectItem value="Below 500M">Below 500M IDR</SelectItem>
                                <SelectItem value="500M - 2B">500M - 2B IDR</SelectItem>
                                <SelectItem value="2B - 5B">2B - 5B IDR</SelectItem>
                                <SelectItem value="Above 5B">Above 5B IDR (Institutional)</SelectItem>
                                <SelectItem value="Strategic Partnership">Strategic Partnership (Non-Equity)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-xs uppercase tracking-widest font-bold text-slate-500">Strategic Intent</Label>
                        <Textarea
                            id="message"
                            name="message"
                            required
                            placeholder="Tell us about your strategic goal or partnership preference..."
                            className="min-h-[120px] bg-white/5 border-white/10 focus:border-blue-500/50"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter text-lg transition-all"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                PROCESING...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                CONFIRM INTEREST
                            </div>
                        )}
                    </Button>

                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">
                        Strictly confidential communication
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
