'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAddProduct = () => {
    const trimmedName = productName.trim()
    if (!trimmedName) return

    // Add with default quantity of 1
    onAddProduct(trimmedName, '1')

    // Reset form
    setProductName('')
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
      {/* Text input only */}
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Nombre del producto"
        className="flex-1"
      />

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
