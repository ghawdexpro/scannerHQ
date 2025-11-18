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
    <form onSubmit={handleManualSubmit} className="w-full max-w-2xl mx-auto address-input-wrapper">
      <div id="address-input-container" className="relative" style={{ overflow: 'visible' }}>
        <div className="relative" style={{ overflow: 'visible' }}>
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <input
            ref={inputRef}
            id="address-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your property address in Malta or Gozo..."
            className="w-full pl-12 pr-32 py-4 text-lg border-2 border-gray-200 rounded-full focus:border-blue-500 focus:outline-none transition-colors"
            disabled={isProcessing}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 z-10"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isLoading ? 'Analyzing...' : 'Validating...'}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-sm text-gray-500">
          <p>Examples: "Triq il-Kbira, Mosta" or "Pjazza San Ġorġ, Victoria, Gozo"</p>
        </div>
      </div>
    </form>
  )
}