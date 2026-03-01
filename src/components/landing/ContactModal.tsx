'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'

// Using the Formspree fallback method from the Affiliate form for reliability,
// or direct mailto if preferred.
export function ContactModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { t } = useLanguage()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        email: '',
        notes: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Reusing the robust Formspree fallback from Affiliate form for pure client-side submission
            const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqkenrdw'

            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    source: 'Header Contact Modal',
                    subject: `New Inquiry from ${formData.name}`
                })
            })

            if (response.ok) {
                toast.success('Your message has been sent successfully! Our team will reach out to you shortly.', { duration: 5000 })
                setFormData({ name: '', whatsapp: '', email: '', notes: '' })
                onClose()
            } else {
                throw new Error('Failed to send message')
            }

        } catch (error) {
            console.error('Submission error:', error)
            toast.error('Failed to send message. Please try again or contact us directly on WhatsApp.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleWhatsApp = () => {
        window.open('https://wa.me/6282266574860', '_blank', 'noopener,noreferrer')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
                <div className="bg-primary/5 p-6 border-b border-primary/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-primary tracking-tight">Contact Tropic Tech</DialogTitle>
                        <DialogDescription className="text-base font-medium text-muted-foreground">
                            Leave us a message or chat with us instantly on WhatsApp.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <button
                        type="button"
                        onClick={handleWhatsApp}
                        className="w-full h-14 mb-8 flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-green-500/25 transition-all outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                        </svg>
                        <span className="font-bold text-lg">Chat on WhatsApp</span>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                            <span className="bg-white px-3 text-muted-foreground font-mono">Or send us an email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="contact-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</Label>
                            <Input
                                id="contact-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your full name"
                                required
                                disabled={isLoading}
                                className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="contact-wa" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Number</Label>
                                <Input
                                    id="contact-wa"
                                    type="tel"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    placeholder="+62 8..."
                                    required
                                    disabled={isLoading}
                                    className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="contact-email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                                <Input
                                    id="contact-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                    className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 pb-2">
                            <Label htmlFor="contact-notes" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes / Questions</Label>
                            <Textarea
                                id="contact-notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="How can we help you?"
                                required
                                disabled={isLoading}
                                rows={3}
                                className="resize-none bg-muted/50 border-0 focus-visible:ring-1"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-14 text-base font-bold shadow-lg mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Submit Inquiry
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
