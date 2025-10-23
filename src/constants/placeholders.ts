// Emlak türlerine göre placeholder görseller
export const PROPERTY_PLACEHOLDERS = {
  Daire: [
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
  ],
  Müstakil: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop',
  ],
  Villa: [
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=1200&auto=format&fit=crop',
  ],
  Arsa: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop',
  ],
  Dükkan: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
  ],
  default: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1200&auto=format&fit=crop',
  ]
}

export function getPlaceholderImage(propertyType?: string | null): string {
  const type = propertyType as keyof typeof PROPERTY_PLACEHOLDERS
  const images = PROPERTY_PLACEHOLDERS[type] || PROPERTY_PLACEHOLDERS.default
  return images[Math.floor(Math.random() * images.length)]
}

// İlan yaşını hesaplama
export function isNewListing(createdAt: string | Date): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}
