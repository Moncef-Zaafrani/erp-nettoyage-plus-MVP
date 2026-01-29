import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Icon, LatLng } from 'leaflet'
import { MapPin, X, Navigation, Search, Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in React-Leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export interface LocationData {
  latitude: number
  longitude: number
  address?: string
  city?: string
  postalCode?: string
  country?: string
  displayName?: string
}

interface LocationPickerProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  onAddressSelect?: (data: { address: string; city: string; postalCode: string; country: string }) => void
  defaultCenter?: { lat: number; lng: number }
  defaultZoom?: number
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to recenter map
function MapController({ center, shouldCenter }: { center: LatLng | null; shouldCenter: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (center && shouldCenter) {
      map.setView(center, 15)
    }
  }, [center, shouldCenter, map])
  
  return null
}

export function LocationPickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  onAddressSelect,
  defaultCenter = { lat: 48.8566, lng: 2.3522 }, // Paris
  defaultZoom = 12,
}: LocationPickerProps & { isOpen: boolean; onClose: () => void }) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.latitude, lng: value.longitude } : null
  )
  const [addressSearch, setAddressSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [reverseGeocoding, setReverseGeocoding] = useState(false)
  const [locationDetails, setLocationDetails] = useState<LocationData | null>(value || null)
  const [shouldCenterMap, setShouldCenterMap] = useState(false)

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setReverseGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await response.json()
      
      if (data && data.address) {
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: data.address.road 
            ? `${data.address.house_number ? data.address.house_number + ' ' : ''}${data.address.road}`
            : data.display_name?.split(',')[0] || '',
          city: data.address.city || data.address.town || data.address.village || data.address.municipality || '',
          postalCode: data.address.postcode || '',
          country: data.address.country || '',
          displayName: data.display_name || '',
        }
        setLocationDetails(locationData)
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err)
    } finally {
      setReverseGeocoding(false)
    }
  }, [])

  // Search for address
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await response.json()
      setSearchResults(data || [])
    } catch (err) {
      console.error('Address search failed:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressSearch.trim()) {
        searchAddress(addressSearch)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [addressSearch, searchAddress])

  // Handle location selection on map
  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setShouldCenterMap(false)
    // Set basic location data immediately so confirm button works
    setLocationDetails({
      latitude: lat,
      longitude: lng,
      address: '',
      city: '',
      postalCode: '',
      country: '',
    })
    // Then fetch full address details
    reverseGeocode(lat, lng)
  }

  // Handle search result selection
  const handleSearchResultSelect = (result: any) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setSelectedLocation({ lat, lng })
    setShouldCenterMap(true)
    setSearchResults([])
    setAddressSearch('')
    
    const locationData: LocationData = {
      latitude: lat,
      longitude: lng,
      address: result.address?.road
        ? `${result.address.house_number ? result.address.house_number + ' ' : ''}${result.address.road}`
        : result.display_name?.split(',')[0] || '',
      city: result.address?.city || result.address?.town || result.address?.village || result.address?.municipality || '',
      postalCode: result.address?.postcode || '',
      country: result.address?.country || '',
      displayName: result.display_name || '',
    }
    setLocationDetails(locationData)
  }

  // Get current location
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setSelectedLocation({ lat, lng })
          setShouldCenterMap(true)
          // Set basic location data immediately so confirm button works
          setLocationDetails({
            latitude: lat,
            longitude: lng,
            address: '',
            city: '',
            postalCode: '',
            country: '',
          })
          // Then fetch full address details
          reverseGeocode(lat, lng)
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Could not get your location. Please allow location access or select manually on the map.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser')
    }
  }

  // Confirm selection
  const handleConfirm = () => {
    if (locationDetails) {
      onChange(locationDetails)
      if (onAddressSelect) {
        onAddressSelect({
          address: locationDetails.address || '',
          city: locationDetails.city || '',
          postalCode: locationDetails.postalCode || '',
          country: locationDetails.country || '',
        })
      }
    }
    onClose()
  }

  if (!isOpen) return null

  const mapCenter = selectedLocation 
    ? new LatLng(selectedLocation.lat, selectedLocation.lng)
    : new LatLng(defaultCenter.lat, defaultCenter.lng)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Location
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click on the map or search for an address
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-shrink-0 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder="Search for an address..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {result.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={getCurrentLocation}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">My Location</span>
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0 relative">
          <MapContainer
            center={[defaultCenter.lat, defaultCenter.lng]}
            zoom={defaultZoom}
            className="absolute inset-0"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <MapController center={mapCenter} shouldCenter={shouldCenterMap} />
            {selectedLocation && (
              <Marker 
                position={[selectedLocation.lat, selectedLocation.lng]} 
                icon={defaultIcon}
              />
            )}
          </MapContainer>
          
          {reverseGeocoding && (
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Getting address...</span>
            </div>
          )}
        </div>

        {/* Selected Location Info */}
        {locationDetails && (
          <div className="flex-shrink-0 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {reverseGeocoding ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">Getting address...</span>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-emerald-900 dark:text-emerald-100">
                      {locationDetails.address || 'Location Selected'}
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {[locationDetails.city, locationDetails.postalCode, locationDetails.country]
                        .filter(Boolean)
                        .join(', ') || 'Address details loading...'}
                    </p>
                  </>
                )}
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Coordinates: {locationDetails.latitude.toFixed(6)}, {locationDetails.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!locationDetails || !selectedLocation}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {reverseGeocoding && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  )
}

// Compact trigger button component
export function LocationPickerTrigger({
  value,
  onClick,
  placeholder = 'Select location on map',
  error,
}: {
  value?: LocationData | null
  onClick: () => void
  placeholder?: string
  error?: string
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-left
          border rounded-lg transition-all duration-200
          bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900
          hover:from-emerald-50 hover:to-white dark:hover:from-emerald-900/20 dark:hover:to-gray-900
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-600'}
        `}
      >
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
          <MapPin className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          {value ? (
            <>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {value.address || 'Selected Location'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {[value.city, value.country].filter(Boolean).join(', ') || 
                  `${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-gray-500 dark:text-gray-400">{placeholder}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Click to open map</p>
            </>
          )}
        </div>
        <Navigation className="h-5 w-5 text-gray-400" />
      </button>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default LocationPickerModal
