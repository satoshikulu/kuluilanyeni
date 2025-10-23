import { lazy, Suspense } from 'react'
import { MapPin } from 'lucide-react'

// Lazy load LocationPicker to avoid SSR issues
const LocationPicker = lazy(() => import('./LocationPicker'))

interface LocationPickerWrapperProps {
  address?: string
  latitude?: number
  longitude?: number
  onLocationChange: (data: {
    address: string
    latitude: number
    longitude: number
    locationType: 'address' | 'coordinates'
  }) => void
}

export default function LocationPickerWrapper(props: LocationPickerWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Harita Yükleniyor...
            </h3>
            <p className="text-sm text-gray-600">
              Lütfen bekleyin, harita bileşeni yükleniyor.
            </p>
          </div>
        </div>
      }
    >
      <LocationPicker {...props} />
    </Suspense>
  )
}
