'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import PackageCard from './PackageCard'


interface PackagesProps {
  initialPackages?: any[]
}

export default function Packages({ initialPackages = [] }: PackagesProps) {
  const { t } = useLanguage()
  const [packages, setPackages] = useState<any[]>(initialPackages)

  useEffect(() => {
    if (initialPackages.length === 0) {
      fetchPackages()
    }
  }, [initialPackages])

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/packages')
      if (res.ok) {
        const data = await res.json()
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    }
  }


  return (
    <section id="packages" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">{t('packages')}</h2>

        {packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No packages found</p>
          </div>
        )}
      </div>
    </section>
  )
}
