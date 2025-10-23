import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Search } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Leaflet marker icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Kulu merkez koordinatları
const KULU_CENTER: [number, number] = [39.0919, 33.0794]

interface LocationPickerProps {
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

function LocationMarker({ position, onPositionChange }: {
  position: [number, number]
  onPositionChange: (pos: [number, number]) => void
}) {
  const markerRef = useRef<L.Marker>(null)

  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    },
  })

  useEffect(() => {
    const marker = markerRef.current
    if (marker) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onPositionChange([pos.lat, pos.lng])
      })
    }
  }, [onPositionChange])

  return <Marker position={position} draggable ref={markerRef} />
}

export default function LocationPicker({
  address: initialAddress = '',
  latitude: initialLat,
  longitude: initialLng,
  onLocationChange,
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress)
  const [position, setPosition] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : KULU_CENTER
  )
  const [isSearching, setIsSearching] = useState(false)

  // Adres değiştiğinde parent'a bildir
  useEffect(() => {
    onLocationChange({
      address,
      latitude: position[0],
      longitude: position[1],
      locationType: address ? 'address' : 'coordinates',
    })
  }, [address, position])

  // Nominatim ile geocoding (adres -> koordinat)
  const searchAddress = async () => {
    if (!address.trim()) return

    setIsSearching(true)
    try {
      const query = `${address}, Kulu, Konya, Turkey`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setPosition([parseFloat(lat), parseFloat(lon)])
      } else {
        alert('Adres bulunamadı. Lütfen haritadan manuel olarak seçin.')
      }
    } catch (error) {
      console.error('Geocoding hatası:', error)
      alert('Adres aranırken bir hata oluştu.')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePositionChange = (newPos: [number, number]) => {
    setPosition(newPos)
  }

  return (
    <div className="space-y-4">
      {/* Adres Arama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adres veya Konum Bilgisi
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Örn: Cumhuriyet Mahallesi, Atatürk Caddesi No:15"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
          />
          <button
            type="button"
            onClick={searchAddress}
            disabled={isSearching || !address.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Ara
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Adres girin ve "Ara" butonuna tıklayın veya haritadan manuel olarak seçin
        </p>
      </div>

      {/* Harita */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '400px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      {/* Koordinat Bilgisi */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Seçili Konum</p>
            <p className="text-xs text-blue-700">
              Enlem: {position[0].toFixed(6)}, Boylam: {position[1].toFixed(6)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              💡 İşaretçiyi sürükleyerek veya haritaya tıklayarak konumu değiştirebilirsiniz
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
