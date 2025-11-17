'use client'

import { useState, useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adjustQty, isValidQuantity } from '@/infrastructure/utils/quantity'

interface ProductQuantityInputProps {
  onAddProduct: (productName: string, quantity: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ProductQuantityInput({
  onAddProduct,
  placeholder = 'Escribe el nombre del producto...',
  disabled = false,
}: ProductQuantityInputProps) {
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleQuantityDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuantity(prev => adjustQty(prev, 'down'))
  }

  const handleQuantityUp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuantity(prev => adjustQty(prev, 'up'))
  }

  const handleAddProduct = () => {
    const trimmedName = productName.trim()
    if (!trimmedName) return

    if (!isValidQuantity(quantity)) {
      setQuantity('1')
    }

    onAddProduct(trimmedName, quantity)

    // Reset form
    setProductName('')
    setQuantity('1')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddProduct()
    }
  }

  return (
    <div className="flex gap-2 w-full">
      {/* Input container with quantity controls */}
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pr-24"
          aria-label="Nombre del producto"
        />

        {/* Quantity controls - absolute positioned */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleQuantityDown}
            disabled={disabled}
            aria-label="Disminuir cantidad"
            title="Disminuir cantidad"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <span className="text-xs font-semibold min-w-8 text-center">
            {quantity}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleQuantityUp}
            disabled={disabled}
            aria-label="Aumentar cantidad"
            title="Aumentar cantidad"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Add button */}
      <Button
        onClick={handleAddProduct}
        disabled={disabled || !productName.trim()}
        className="px-6"
      >
        Agregar
      </Button>
    </div>
  )
}
