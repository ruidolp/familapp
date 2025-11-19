'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Product {
  id: string
  nombre: string
  is_catalog?: boolean
}

interface ProductQuantityInputProps {
  onAddProduct: (productName: string, quantity: string) => void
  placeholder?: string
  disabled?: boolean
  // Available products for autocomplete (catalog + custom)
  availableProducts?: Product[]
}

export function ProductQuantityInput({
  onAddProduct,
  placeholder = 'Escribe el nombre del producto...',
  disabled = false,
  availableProducts = [],
}: ProductQuantityInputProps) {
  const [productName, setProductName] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter products based on input
  useEffect(() => {
    if (productName.trim().length < 1) {
      setFilteredProducts([])
      setShowSuggestions(false)
      setSelectedIndex(-1)
      return
    }

    const searchTerm = productName.toLowerCase().trim()
    const matches = availableProducts
      .filter((p) => p.nombre.toLowerCase().includes(searchTerm))
      .slice(0, 10) // Limit to 10 suggestions

    setFilteredProducts(matches)
    setShowSuggestions(matches.length > 0)
    setSelectedIndex(-1)
  }, [productName, availableProducts])

  const handleAddProduct = (name?: string) => {
    const finalName = name || productName.trim()
    if (!finalName) return

    // Add with default quantity of 1
    onAddProduct(finalName, '1')

    // Reset form
    setProductName('')
    setShowSuggestions(false)
    setFilteredProducts([])
    setSelectedIndex(-1)

    // Keep focus on input - use setTimeout to ensure it happens after React updates
    // This prevents the focus loss issue on mobile
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true })
      }
    }, 0)
  }

  const handleSelectSuggestion = (product: Product) => {
    handleAddProduct(product.nombre)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && selectedIndex >= 0 && filteredProducts[selectedIndex]) {
        handleSelectSuggestion(filteredProducts[selectedIndex])
      } else {
        handleAddProduct()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSuggestions && filteredProducts.length > 0) {
        setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSuggestions) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex gap-2 w-full relative">
      <div className="flex-1 relative">
        {/* Text input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Nombre del producto"
          className="w-full"
          autoComplete="off"
        />

        {/* Autocomplete suggestions - positioned ABOVE input */}
        {showSuggestions && filteredProducts.length > 0 && (
          <Card
            ref={suggestionsRef}
            className="absolute z-50 w-full bottom-full mb-1 max-h-60 overflow-y-auto shadow-lg"
          >
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleSelectSuggestion(product)}
                className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${
                  index === selectedIndex ? 'bg-muted' : ''
                }`}
              >
                <span className="text-sm">{product.nombre}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Add button */}
      <Button
        onClick={(e) => {
          e.preventDefault()
          handleAddProduct()
        }}
        disabled={disabled || !productName.trim()}
        className="px-6"
        type="button"
      >
        Agregar
      </Button>
    </div>
  )
}
