'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { initializeAutocomplete, validateMaltaAddress } from '@/lib/google/maps-service'
import { ERROR_MESSAGES } from '@/config/constants'
import toast from 'react-hot-toast'

interface AddressInputProps {
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  isLoading?: boolean
}

export default function AddressInput({ onAddressSelect, isLoading = false }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    const initAutocomplete = async () => {
      if (inputRef.current && !autocomplete) {
        try {
          const ac = await initializeAutocomplete(inputRef.current)

          ac.addListener('place_changed', async () => {
            const place = ac.getPlace()

            if (!place.geometry || !place.geometry.location) {
              toast.error('Please select a valid address from the suggestions')
              return
            }

            setIsValidating(true)
            const address = place.formatted_address || inputValue

            try {
              const validation = await validateMaltaAddress(address)

              if (!validation.isValid) {
                toast.error(ERROR_MESSAGES.INVALID_ADDRESS)
                setIsValidating(false)
                return
              }

              if (validation.isGozo) {
                toast.success('Gozo location detected - Using AI analysis')
              }

              if (validation.coordinates) {
                onAddressSelect(validation.formattedAddress || address, validation.coordinates)
              }
            } catch (error) {
              console.error('Validation error:', error)
              toast.error('Error validating address. Please try again.')
            } finally {
              setIsValidating(false)
            }
          })

          setAutocomplete(ac)
        } catch (error) {
          console.error('Failed to initialize autocomplete:', error)
          // Fallback to manual input if Google Maps fails to load
        }
      }
    }

    // Load Google Maps and initialize autocomplete
    if (typeof window !== 'undefined') {
      initAutocomplete()
    }
  }, [autocomplete, inputValue, onAddressSelect])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) {
      toast.error('Please enter an address')
      return
    }

    setIsValidating(true)

    try {
      const validation = await validateMaltaAddress(inputValue)

      if (!validation.isValid) {
        toast.error(ERROR_MESSAGES.INVALID_ADDRESS)
        return
      }

      if (validation.isGozo) {
        toast.success('Gozo location detected - Using AI analysis')
      }

      if (validation.coordinates) {
        onAddressSelect(validation.formattedAddress || inputValue, validation.coordinates)
      }
    } catch (error) {
      console.error('Address validation error:', error)
      toast.error('Error processing address. Please check your internet connection.')
    } finally {
      setIsValidating(false)
    }
  }

  const isProcessing = isLoading || isValidating

  return (
    <form onSubmit={handleManualSubmit} className="w-full max-w-2xl mx-auto address-input-wrapper px-4">
      <div id="address-input-container" className="relative" style={{ overflow: 'visible' }}>
        <div className="relative flex flex-col sm:flex-row gap-3" style={{ overflow: 'visible' }}>
          <div className="relative flex-1" style={{ overflow: 'visible' }}>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none z-10" />
            <input
              ref={inputRef}
              id="address-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter property address..."
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-200 rounded-full focus:border-blue-500 focus:outline-none transition-colors min-h-12"
              disabled={isProcessing}
              autoComplete="off"
              inputMode="search"
              aria-label="Property address input"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-12 sm:min-w-max flex-shrink-0"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">{isLoading ? 'Analyzing...' : 'Validating...'}</span>
                <span className="sm:hidden">{isLoading ? 'Analyzing' : 'Validating'}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Analyze</span>
              </>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-xs sm:text-sm text-gray-500">
          <p>Examples: "Triq il-Kbira, Mosta" or "Pjazza San Ġorġ, Victoria, Gozo"</p>
        </div>
      </div>
    </form>
  )
}