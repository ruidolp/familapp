'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations()
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
  const handleSelectSuggestion = async (subcategoria: Subcategoria) => {
    // Si la marca ya pertenece a esta categoría, solo notificar
    if (subcategoria.categoria_id === categoriaId) {
      notify.info(`Marca "${subcategoria.nombre}" ya existe en esta categoría`)
      setInputValue('')
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Si la marca pertenece a otra categoría, crear una nueva con el mismo nombre
    await crearYAgregarSubcategoria(subcategoria.nombre)
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
      // Si existe, usar la misma lógica de handleSelectSuggestion
      await handleSelectSuggestion(existe)
    } else {
      // Si no existe, la creamos como NUEVA
      await crearYAgregarSubcategoria(trimmedValue)
      setInputValue('')
      setSuggestions([])
      setShowSuggestions(false)
      inputRef.current?.focus()
    }
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
      notify.error(t('categorias.edit.nameRequired'))
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
          <DrawerTitle>{t('categorias.edit.title')}</DrawerTitle>
          <DrawerDescription>
            {t('categorias.edit.description')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-4">
            {/* Nombre de categoría */}
            <div className="space-y-2">
              <Label htmlFor="nombre">{t('categorias.edit.nameLabel')}</Label>
              <Input
                id="nombre"
                type="text"
                placeholder={t('categorias.edit.namePlaceholder')}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-4" />

            {/* Texto descriptivo */}
            <div className="space-y-1">
              <Label>{t('categorias.edit.whereShop')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('categorias.edit.brandsHelp')}
              </p>
            </div>

            {/* Marcas agregadas - Mostrar arriba */}
            {selectedSubcategorias.length > 0 && (
              <div className="space-y-2">
                <Label>{t('categorias.edit.addedBrands')}</Label>
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
              <Label htmlFor="marca">{t('categorias.edit.searchOrCreate')}</Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="marca"
                  type="text"
                  placeholder={t('categorias.edit.brandPlaceholder')}
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
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-base"
                        type="button"
                      >
                        <span className="text-green-600">{t('categorias.edit.checkmark')}</span>
                        <span>{sub.emoji && `${sub.emoji} `}</span>
                        <span>{sub.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={async () => {
                  if (inputValue.trim()) {
                    await handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any)
                  }
                }}
                disabled={!inputValue.trim() || loading}
                className="w-full"
                size="sm"
              >
                {loading ? t('common.loading') : t('categorias.edit.addBrand')}
              </Button>
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleGuardar}
            disabled={loading || !nombre.trim()}
            className="w-full"
          >
            {loading ? t('categorias.edit.saving') : t('categorias.edit.submit')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full mb-4">
              {t('common.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
