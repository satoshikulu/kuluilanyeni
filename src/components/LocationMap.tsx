import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Leaflet marker icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LocationMapProps {
  latitude: number
  longitude: number
  address?: string
  title?: string
  height?: string
}

export default function LocationMap({
  latitude,
  longitude,
  address,
  title,
  height = '300px',
}: LocationMapProps) {
  const position: [number, number] = [latitude, longitude]

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
  }

  const openInAppleMaps = () => {
    window.open(`https://maps.apple.com/?q=${latitude},${longitude}`, '_blank')
  }

  return (
    <div className="space-y-3">
      {/* Harita */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height, width: '100%' }}
          className="z-0"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            {(title || address) && (
              <Popup>
                <div className="text-sm">
                  {title && <p className="font-semibold mb-1">{title}</p>}
                  {address && <p className="text-gray-600">{address}</p>}
                </div>
              </Popup>
            )}
          </Marker>
        </MapContainer>
      </div>

      {/* Adres ve Navigasyon Butonları */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{address}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openInGoogleMaps}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Google Maps'te Aç
          </button>
          <button
            onClick={openInAppleMaps}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Apple Maps'te Aç
          </button>
        </div>

        <p className="text-xs text-gray-500">
          📍 Koordinatlar: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      </div>
    </div>
  )
}
