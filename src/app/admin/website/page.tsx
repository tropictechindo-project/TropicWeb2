'use client'

import { useEffect, useState } from 'react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'

export default function WebsiteSettingsPage() {
    const { settings, loading, updateSetting, refresh } = useSiteSettings()
    const [saving, setSaving] = useState(false)

    // Local state for form inputs to allow editing before saving
    const [formData, setFormData] = useState<Record<string, any>>({})

    // Default FAQs matching the landing page
    const DEFAULT_FAQS = [
        {
            question: 'How do I rent equipment?',
            answer: 'Simply browse our products, select the duration, and click Order. You\'ll be guided through the checkout process with multiple payment options available.',
        },
        {
            question: 'What is the minimum rental period?',
            answer: 'Our minimum rental period is 1 day. You can rent equipment for as long as you need - from daily to monthly rentals.',
        },
        {
            question: 'Do you offer delivery services?',
            answer: 'Yes, we offer fast delivery across Bali. Delivery fees may apply depending on your location.',
        },
        {
            question: 'What happens if equipment is damaged?',
            answer: 'Minor wear and tear is expected. For significant damage, please contact us immediately. We offer protection plans for additional peace of mind.',
        },
        {
            question: 'Can I extend my rental period?',
            answer: 'Yes! You can extend your rental anytime through your dashboard or by contacting our support team.',
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept PayPal, credit/debit cards, Stripe, cryptocurrency, cash, and WhatsApp orders.',
        },
    ]

    useEffect(() => {
        if (settings) {
            setFormData(prev => ({
                ...prev,
                // Ensure defaults are populated if settings are missing
                faq_title: settings.faq_title || 'Frequently Asked Questions',
                faq_text: settings.faq_text || 'Find answers to common questions...',
                faq_data: settings.faq_data || DEFAULT_FAQS,
                ...settings
            }))
        }
    }, [settings])

    const handleInputChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size too large (max 5MB)')
            return
        }

        const toastId = toast.loading('Uploading image...')
        const formData = new FormData()
        formData.append('file', file)

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const data = await response.json()
            handleInputChange('hero_image', data.url)
            toast.success('Image uploaded successfully', { id: toastId })
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload image', { id: toastId })
        }
    }

    const handleSave = async (section: string) => {
        setSaving(true)
        let successCount = 0
        let failCount = 0

        const sectionKeys = Object.keys(formData).filter(key => {
            // Simple heuristic: keys for this section. 
            // Realistically we shoud store metadata about keys.
            // For now, we save ALL modified keys that match the section prefix
            if (section === 'hero') return key.startsWith('hero_')
            if (section === 'sections') return !key.startsWith('hero_')
            return false
        })

        // Actually, we can just save everything in formData that belongs to the 'section' argument context
        // But since the loop is fast, let's just save specific keys we know exist in the form

        const keysToSave = section === 'hero'
            ? ['hero_title', 'hero_subtitle', 'hero_subtitle2', 'hero_opacity_default', 'hero_show_slider', 'hero_image']
            : ['faq_title', 'faq_text', 'faq_data']

        for (const key of keysToSave) {
            if (formData[key] !== undefined) {
                let valueToSave = formData[key]

                // Special handling for JSON keys
                if (key === 'faq_data') {
                    if (typeof valueToSave === 'string') {
                        try {
                            const parsed = JSON.parse(valueToSave)
                            valueToSave = parsed
                        } catch (e) {
                            toast.error(`Invalid JSON for ${key}`)
                            setSaving(false)
                            return
                        }
                    }
                }

                const success = await updateSetting(key, valueToSave, section)
                if (success) successCount++
                else failCount++
            }
        }

        setSaving(false)
        if (failCount === 0) {
            toast.success('Settings saved successfully')
            refresh()
        } else {
            toast.error(`Saved ${successCount} settings, failed ${failCount}`)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Website Settings</h2>
                <p className="text-muted-foreground">
                    Manage dynamic content and configuration for the landing page.
                </p>
            </div>

            <Tabs defaultValue="hero" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hero">Hero Section</TabsTrigger>
                    <TabsTrigger value="faq">FAQ Content</TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hero Configuration</CardTitle>
                            <CardDescription>
                                Customize the main banner, text, and opacity behavior.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hero_title">Hero Title</Label>
                                    <Input
                                        id="hero_title"
                                        value={formData.hero_title || ''}
                                        onChange={(e) => handleInputChange('hero_title', e.target.value)}
                                        placeholder="e.g. Tropic Tech"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_subtitle">Subtitle Line 1</Label>
                                    <Input
                                        id="hero_subtitle"
                                        value={formData.hero_subtitle || ''}
                                        onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                                        placeholder="e.g. Workstation Rental Company"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_subtitle2">Subtitle Line 2</Label>
                                    <Input
                                        id="hero_subtitle2"
                                        value={formData.hero_subtitle2 || ''}
                                        onChange={(e) => handleInputChange('hero_subtitle2', e.target.value)}
                                        placeholder="e.g. 5+ Years in Bali and Leading the Industry"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_image">Hero Image URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="hero_image"
                                            value={formData.hero_image || ''}
                                            onChange={(e) => handleInputChange('hero_image', e.target.value)}
                                            placeholder="https://..."
                                        />
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="hero-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={() => document.getElementById('hero-upload')?.click()}
                                            >
                                                Upload
                                            </Button>
                                        </div>
                                    </div>
                                    {formData.hero_image && (
                                        <div className="mt-2 aspect-video w-full max-w-sm relative rounded-lg overflow-hidden border">
                                            <img
                                                src={formData.hero_image}
                                                alt="Hero Preview"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_opacity_default">Default Opacity ({formData.hero_opacity_default || 70}%)</Label>
                                    <Input
                                        id="hero_opacity_default"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.hero_opacity_default || 70}
                                        onChange={(e) => handleInputChange('hero_opacity_default', Number(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        0 = Crystal Clear, 100 = Solid Background.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_image">Hero Image URL</Label>
                                    <Input
                                        id="hero_image"
                                        value={formData.hero_image || ''}
                                        onChange={(e) => handleInputChange('hero_image', e.target.value)}
                                        placeholder="/images/hero.webp or https://..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Path to image in public folder or external URL.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Show Opacity Slider</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow visitors to adjust opacity manually.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.hero_show_slider !== false} // Default to true
                                        onCheckedChange={(checked) => handleInputChange('hero_show_slider', checked)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={() => handleSave('hero')} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sections" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Section Content</CardTitle>
                            <CardDescription>
                                Update the text for various sections of the landing page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* About Us */}
                            <div className="space-y-2 border-b pb-4">
                                <Label className="text-lg font-semibold">About Us</Label>
                                <div className="grid gap-3">
                                    <Label htmlFor="about_title">Title</Label>
                                    <Input
                                        id="about_title"
                                        value={formData.about_title || ''}
                                        onChange={(e) => handleInputChange('about_title', e.target.value)}
                                        placeholder="About Us"
                                    />
                                    <Label htmlFor="about_text">Description</Label>
                                    <Textarea
                                        id="about_text"
                                        value={formData.about_text || ''}
                                        onChange={(e) => handleInputChange('about_text', e.target.value)}
                                        placeholder="We provide..."
                                    />
                                </div>
                            </div>

                            {/* Services */}
                            <div className="space-y-2 border-b pb-4">
                                <Label className="text-lg font-semibold">Services</Label>
                                <div className="grid gap-3">
                                    <Label htmlFor="services_title">Title</Label>
                                    <Input
                                        id="services_title"
                                        value={formData.services_title || ''}
                                        onChange={(e) => handleInputChange('services_title', e.target.value)}
                                        placeholder="Our Services"
                                    />
                                    <Label htmlFor="services_text">Description</Label>
                                    <Textarea
                                        id="services_text"
                                        value={formData.services_text || ''}
                                        onChange={(e) => handleInputChange('services_text', e.target.value)}
                                        placeholder="High quality..."
                                    />
                                </div>
                            </div>

                            {/* Reviews */}
                            <div className="space-y-2">
                                <Label className="text-lg font-semibold">Reviews</Label>
                                <div className="grid gap-3">
                                    <Label htmlFor="reviews_title">Title</Label>
                                    <Input
                                        id="reviews_title"
                                        value={formData.reviews_title || ''}
                                        onChange={(e) => handleInputChange('reviews_title', e.target.value)}
                                        placeholder="Customer Reviews"
                                    />
                                    <Label htmlFor="reviews_text">Description</Label>
                                    <Textarea
                                        id="reviews_text"
                                        value={formData.reviews_text || ''}
                                        onChange={(e) => handleInputChange('reviews_text', e.target.value)}
                                        placeholder="What our clients say..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <Label className="text-lg font-semibold">Advanced Data (JSON)</Label>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Edit the raw data for lists. Be careful to maintain valid JSON format.
                                </p>

                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="about_stats">About Us Stats (JSON)</Label>
                                        <Textarea
                                            id="about_stats"
                                            className="font-mono text-xs min-h-[150px]"
                                            value={typeof formData.about_stats === 'string' ? formData.about_stats : JSON.stringify(formData.about_stats || [], null, 2)}
                                            onChange={(e) => handleInputChange('about_stats', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="services_data">Services List (JSON)</Label>
                                        <Textarea
                                            id="services_data"
                                            className="font-mono text-xs min-h-[200px]"
                                            value={typeof formData.services_data === 'string' ? formData.services_data : JSON.stringify(formData.services_data || [], null, 2)}
                                            onChange={(e) => handleInputChange('services_data', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reviews_data">Reviews List (JSON)</Label>
                                        <Textarea
                                            id="reviews_data"
                                            className="font-mono text-xs min-h-[200px]"
                                            value={typeof formData.reviews_data === 'string' ? formData.reviews_data : JSON.stringify(formData.reviews_data || [], null, 2)}
                                            onChange={(e) => handleInputChange('reviews_data', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={() => handleSave('sections')} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="faq" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>FAQ Management</CardTitle>
                            <CardDescription>
                                Manage the Frequently Asked Questions displayed on the landing page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="faq_title">Section Title</Label>
                                <Input
                                    id="faq_title"
                                    value={formData.faq_title || ''}
                                    onChange={(e) => handleInputChange('faq_title', e.target.value)}
                                    placeholder="Frequently Asked Questions"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="faq_text">Section Description</Label>
                                <Textarea
                                    id="faq_text"
                                    value={formData.faq_text || ''}
                                    onChange={(e) => handleInputChange('faq_text', e.target.value)}
                                    placeholder="Find answers to common questions..."
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-lg font-semibold">Questions & Answers</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const currentFaqs = Array.isArray(formData.faq_data) ? formData.faq_data : []
                                            handleInputChange('faq_data', [...currentFaqs, { question: '', answer: '' }])
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add FAQ
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {(Array.isArray(formData.faq_data) ? formData.faq_data : []).map((faq: any, index: number) => (
                                        <div key={index} className="grid gap-4 p-4 border rounded-lg relative bg-muted/20">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                                onClick={() => {
                                                    const newFaqs = [...(formData.faq_data || [])]
                                                    newFaqs.splice(index, 1)
                                                    handleInputChange('faq_data', newFaqs)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>

                                            <div className="space-y-2">
                                                <Label>Question {index + 1}</Label>
                                                <Input
                                                    value={faq.question}
                                                    onChange={(e) => {
                                                        const newFaqs = [...(formData.faq_data || [])]
                                                        newFaqs[index] = { ...newFaqs[index], question: e.target.value }
                                                        handleInputChange('faq_data', newFaqs)
                                                    }}
                                                    placeholder="e.g. How do I rent?"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Answer</Label>
                                                <Textarea
                                                    value={faq.answer}
                                                    onChange={(e) => {
                                                        const newFaqs = [...(formData.faq_data || [])]
                                                        newFaqs[index] = { ...newFaqs[index], answer: e.target.value }
                                                        handleInputChange('faq_data', newFaqs)
                                                    }}
                                                    placeholder="e.g. Simply browse our products..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {(!formData.faq_data || formData.faq_data.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                            No FAQs added yet. Click "Add FAQ" to start.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={() => handleSave('faq')} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
