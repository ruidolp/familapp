'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { notify } from '@/infrastructure/lib/notifications'

interface Subcategoria {
  id: string
  nombre: string
  emoji?: string
  color?: string
  categoria_id: string
}

interface EditarCategoriaDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoriaId: string
  categoriaNombre: string
  onSuccess?: () => void
}

export function EditarCategoriaDrawer({
  open,
  onOpenChange,
  categoriaId,
  categoriaNombre,
  onSuccess,
}: EditarCategoriaDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [selectedSubcategorias, setSelectedSubcategorias] = useState<Subcategoria[]>([])
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Subcategoria[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar categoría y subcategorías cuando se abre
  useEffect(() => {
    if (open) {
      fetchData()
      setNombre(categoriaNombre)
      setInputValue('')
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [open, categoriaId, categoriaNombre])

  const fetchData = async () => {
    try {
      // Cargar todas las subcategorías del usuario (global)
      const subcategoriasResponse = await fetch('/api/subcategorias')
      if (subcategoriasResponse.ok) {
        const data = await subcategoriasResponse.json()
        setSubcategorias(data.subcategorias || [])
      }

      // Cargar subcategorías de esta categoría
      const categoriasResponse = await fetch(`/api/subcategorias?categoriaId=${categoriaId}`)
      if (categoriasResponse.ok) {
        const data = await categoriasResponse.json()
        setSelectedSubcategorias(data.subcategorias || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      notify.error('Error al cargar datos')
    }
  }

  // Manejar cambios en el input de subcategorías
  const handleInputChange = (value: string) => {
    setInputValue(value)

    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Filtrar subcategorías globales que no estén ya seleccionadas
    const filtered = subcategorias.filter((sub) => {
      const yaEstaSeleccionada = selectedSubcategorias.some((s) => s.id === sub.id)
      const coincideConBusqueda = sub.nombre.toLowerCase().includes(value.toLowerCase())
      return !yaEstaSeleccionada && coincideConBusqueda
    })

    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  // Click en sugerencia
  const handleSelectSuggestion = (subcategoria: Subcategoria) => {
    setSelectedSubcategorias([...selectedSubcategorias, subcategoria])
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Remover subcategoría seleccionada
  const handleRemoveSubcategoria = (subcategoriaId: string) => {
    setSelectedSubcategorias(selectedSubcategorias.filter((s) => s.id !== subcategoriaId))
  }

  // Manejar ENTER en el input
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmedValue = inputValue.trim()
    if (!trimmedValue) return

    // Buscar si ya existe una subcategoría con ese nombre exacto
    const existe = subcategorias.find((s) => s.nombre.toLowerCase() === trimmedValue.toLowerCase())

    if (existe) {
      // Si existe, simplemente la agregamos
      const yaEstaSeleccionada = selectedSubcategorias.some((s) => s.id === existe.id)
      if (!yaEstaSeleccionada) {
        setSelectedSubcategorias([...selectedSubcategorias, existe])
      }
    } else {
      // Si no existe, la creamos como NUEVA
      await crearYAgregarSubcategoria(trimmedValue)
    }

    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Crear nueva subcategoría
  const crearYAgregarSubcategoria = async (nombre: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/subcategorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, categoriaId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear subcategoría')
      }

      const data = await response.json()
      const nuevaSubcategoria = data.subcategoria

      // Agregar a la lista global
      setSubcategorias([...subcategorias, nuevaSubcategoria])

      // Agregar a seleccionadas
      setSelectedSubcategorias([...selectedSubcategorias, nuevaSubcategoria])

      notify.success(`Marca "${nombre}" creada`)
    } catch (error: any) {
      notify.error(error.message || 'Error al crear marca')
    } finally {
      setLoading(false)
    }
  }

  // Guardar cambios
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      notify.error('El nombre es obligatorio')
      return
    }

    setLoading(true)
    try {
      // Actualizar nombre de categoría
      if (nombre !== categoriaNombre) {
        const response = await fetch(`/api/categorias/${categoriaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al actualizar categoría')
        }
      }

      notify.success('Categoría actualizada correctamente')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      notify.error(error.message || 'Error al actualizar categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar Categoría</DrawerTitle>
          <DrawerDescription>
            Modifica el nombre y agrega marcas/empresas
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-4">
            {/* Nombre de categoría */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Ej: Alimentación"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-4" />

            {/* Texto descriptivo */}
            <div className="space-y-1">
              <Label>¿Dónde compras?</Label>
              <p className="text-xs text-muted-foreground">
                Agrega tus marcas recurrentes para que puedas medir tus gastos
              </p>
            </div>

            {/* Marcas agregadas - Mostrar arriba */}
            {selectedSubcategorias.length > 0 && (
              <div className="space-y-2">
                <Label>Marcas agregadas</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSubcategorias.map((sub) => (
                    <Badge
                      key={sub.id}
                      variant="default"
                      className="cursor-pointer gap-1 pl-2"
                    >
                      {sub.emoji && <span>{sub.emoji}</span>}
                      <span>{sub.nombre}</span>
                      <button
                        onClick={() => handleRemoveSubcategoria(sub.id)}
                        className="ml-1 hover:opacity-70"
                        type="button"
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de búsqueda/creación - Abajo */}
            <div className="space-y-2">
              <Label htmlFor="marca">Buscar o crear marca</Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="marca"
                  type="text"
                  placeholder="Escribe nombre de marca (Ej: Walmart)"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (inputValue && suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay para permitir click en sugerencia
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                />

                {/* Sugerencias */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                    {suggestions.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectSuggestion(sub)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-sm"
                        type="button"
                      >
                        <span className="text-green-600">✓</span>
                        <span>{sub.emoji && `${sub.emoji} `}</span>
                        <span>{sub.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Presiona <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">ENTER</kbd> para crear nueva
              </p>
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleGuardar}
            disabled={loading || !nombre.trim()}
            className="w-full"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full mb-4">
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
