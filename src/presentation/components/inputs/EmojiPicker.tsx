'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  required?: boolean
}

// Emojis más comunes organizados por categorías
const EMOJI_CATEGORIES = {
  'Comida': ['🍎', '🥕', '🍞', '🥛', '🧀', '🥩', '🍗', '🍕', '🍝', '🍜', '🍱', '🍛', '🍲', '🥗', '🍿', '🧁', '🍰', '🍪', '🍫', '🍬'],
  'Compras': ['🛒', '🛍️', '💳', '💰', '🏪', '🏬', '🏢', '🏭', '🏗️', '🎁', '📦', '🔖', '🏷️', '💎', '👕', '👗', '👠', '👞', '🎒', '💼'],
  'Transporte': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '✈️', '🚂'],
  'Salud': ['💊', '💉', '🩺', '🩹', '🏥', '⚕️', '🧬', '🔬', '🧪', '🦷', '👁️', '🧠', '❤️', '🫀', '🫁', '💪', '🧘', '🏃', '🤸', '🧖'],
  'Hogar': ['🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏢', '🏬', '🏭', '🏛️', '⛪', '🕌', '🏩', '🏨', '🏪', '🏫', '🏦', '🏤', '🪑', '🛏️', '🚪'],
  'Tecnología': ['💻', '🖥️', '⌨️', '🖱️', '🖨️', '📱', '☎️', '📞', '📟', '📠', '📺', '📻', '🎥', '📷', '📹', '🔌', '💡', '🔦', '🕯️', '🪔'],
  'Educación': ['📚', '📖', '📝', '✏️', '✒️', '🖊️', '🖍️', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '📃', '📜', '📄', '📰', '🗞️', '🎓'],
  'Entretenimiento': ['🎮', '🎯', '🎲', '🎰', '🎳', '🎸', '🎹', '🎺', '🎻', '🥁', '🎬', '🎤', '🎧', '🎨', '🎭', '🎪', '🎡', '🎢', '🎠', '🎟️'],
  'Símbolos': ['✅', '❌', '⭐', '🌟', '💫', '✨', '🔥', '💧', '⚡', '☀️', '🌙', '⭐', '🌈', '☁️', '⛅', '🌤️', '⛈️', '🌩️', '❄️', '☃️'],
  'Otros': ['📅', '📆', '🗓️', '📋', '📌', '📍', '📎', '🔗', '📏', '📐', '✂️', '🗑️', '🔒', '🔓', '🔑', '🔨', '⚒️', '🛠️', '⚙️', '🔧'],
}

export function EmojiPicker({
  value,
  onChange,
  required = false,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasEmoji = Boolean(value)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className="flex items-center gap-1 relative" ref={containerRef}>
      {/* Botón para abrir selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'h-10 w-10 rounded-lg text-2xl text-center p-0 cursor-pointer transition-colors flex items-center justify-center flex-shrink-0 font-semibold',
          hasEmoji
            ? 'border border-input bg-card hover:bg-card/80'
            : 'border-2 border-dashed border-muted-foreground/50 bg-card/50 text-muted-foreground',
        ].join(' ')}
        title="Haz click para seleccionar emoji"
      >
        {hasEmoji ? value : ''}
      </button>

      {/* Botón limpiar (solo si hay emoji diferente al default) */}
      {value && (
        <Button
          type="button"
          onClick={handleClear}
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 p-0"
          title="Limpiar emoji"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {required && <span className="text-destructive typography-body-sm">*</span>}

      {/* Dropdown con emojis */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-3">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category}>
                <p className="typography-caption text-muted-foreground mb-2">{category}</p>
                <div className="grid grid-cols-10 gap-1">
                  {emojis.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-2xl hover:bg-muted rounded p-1 transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
