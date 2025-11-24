'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { notify } from '@/infrastructure/lib/notifications'
import { EmojiPicker } from '@/components/inputs/EmojiPicker'
import {
  getMarcasCombinadas,
  filterMarcas,
  updateMarcasCache,
} from '@/infrastructure/utils/marcas-storage'

const DEFAULT_CATEGORY_EMOJI = '📁'

interface Categoria {
  id: string
  nombre: string
  emoji?: string
  color?: string
}

interface Marca {
  id: string
  nombre: string
  emoji?: string
  categoria_id: string
}

interface AgregarCategoriaDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  userId: string
  onSuccess?: () => void
}

export function AgregarCategoriaDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
  userId,
  onSuccess,
}: AgregarCategoriaDrawerProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [marcasGlobales, setMarcasGlobales] = useState<any[]>([])
  const [marcasVersion, setMarcasVersion] = useState<string>('')
  const [pais, setPais] = useState<string>('CL')
  const [selectedCategories, setSelectedCategories] = useState<Categoria[]>([])
  const [inputCategoria, setInputCategoria] = useState('')
  const [emojiCategoria, setEmojiCategoria] = useState(DEFAULT_CATEGORY_EMOJI)
  const [inputMarcaPorCategoria, setInputMarcaPorCategoria] = useState<Record<string, string>>({})
  const [suggestionsCategoria, setSuggestionsCategoria] = useState<Categoria[]>([])
  const [suggestionsMarcaPorCategoria, setSuggestionsMarcaPorCategoria] = useState<Record<string, any[]>>({})
  const [showSuggestionsCategoria, setShowSuggestionsCategoria] = useState(false)
  const [showSuggestionsMarcaPorCategoria, setShowSuggestionsMarcaPorCategoria] = useState<Record<string, boolean>>({})
  const inputCategoriaRef = useRef<HTMLInputElement>(null)

  // Cargar categorías cuando se abre el drawer
  useEffect(() => {
    if (open) {
      fetchCategorias()
      fetchMarcas()
      setSelectedCategories([])
      setInputCategoria('')
      setEmojiCategoria(DEFAULT_CATEGORY_EMOJI)
      setInputMarcaPorCategoria({})
      setSuggestionsCategoria([])
      setSuggestionsMarcaPorCategoria({})
      setShowSuggestionsCategoria(false)
      setShowSuggestionsMarcaPorCategoria({})
    }
  }, [open])

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.categorias || [])
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const fetchMarcas = async () => {
    try {
      const [marcasRes, configRes] = await Promise.all([
        fetch('/api/subcategorias'),
        fetch('/api/user/config'),
      ])

      if (marcasRes.ok) {
        const data = await marcasRes.json()
        setMarcas(data.subcategorias || [])
      }

      if (configRes.ok) {
        const configData = await configRes.json()
        const paisCode = configData.config?.pais || configData.config?.locale?.split('-')[1]?.toUpperCase() || 'CL'
        setPais(paisCode)
        setMarcasVersion(configData.marcasGlobalesVersion || '')
      }
    } catch (error) {
      console.error('Error al cargar marcas:', error)
    }
  }

  // Cargar marcas globales cuando se necesitan
  useEffect(() => {
    if (open && marcasVersion && pais) {
      loadMarcasGlobales()
    }
  }, [open, marcasVersion, pais, marcas])

  const loadMarcasGlobales = async () => {
    try {
      const { globales } = await getMarcasCombinadas(pais, marcasVersion, marcas)
      setMarcasGlobales(globales)
    } catch (error) {
      console.error('Error al cargar marcas globales:', error)
    }
  }

  const renderEmojiBox = (emoji?: string, size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'sm' ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg'
    return (
      <span
        className={`flex items-center justify-center rounded-md border border-border/70 bg-background leading-none ${sizeClasses}`}
      >
        {emoji}
      </span>
    )
  }

  // Manejar cambios en input de categoría
  const handleInputCategoriaChange = (value: string) => {
    setInputCategoria(value)

    if (!value.trim()) {
      setSuggestionsCategoria([])
      setShowSuggestionsCategoria(false)
      return
    }

    const filtered = categorias.filter((cat) => {
      const yaEstaSeleccionada = selectedCategories.some((s) => s.id === cat.id)
      const coincideConBusqueda = cat.nombre.toLowerCase().includes(value.toLowerCase())
      return !yaEstaSeleccionada && coincideConBusqueda
    })

    setSuggestionsCategoria(filtered)
    setShowSuggestionsCategoria(filtered.length > 0)
  }

  // Click en sugerencia de categoría
  const handleSelectCategoria = (categoria: Categoria) => {
    const alreadySelected = selectedCategories.some((c) => c.id === categoria.id)
    let updated = selectedCategories

    if (alreadySelected) {
      updated = selectedCategories.filter((c) => c.id !== categoria.id)
      const newInputMarcas = { ...inputMarcaPorCategoria }
      const newShowMarcas = { ...showSuggestionsMarcaPorCategoria }
      const newSuggestionsMarcas = { ...suggestionsMarcaPorCategoria }
      delete newInputMarcas[categoria.id]
      delete newShowMarcas[categoria.id]
      delete newSuggestionsMarcas[categoria.id]
      setInputMarcaPorCategoria(newInputMarcas)
      setShowSuggestionsMarcaPorCategoria(newShowMarcas)
      setSuggestionsMarcaPorCategoria(newSuggestionsMarcas)
    } else {
      updated = [...selectedCategories, categoria]
    }

    setSelectedCategories(updated)
    setInputCategoria('')
    setSuggestionsCategoria([])
    setShowSuggestionsCategoria(false)
    inputCategoriaRef.current?.focus()
  }

  // Manejar cambios en input de marca para una categoría específica
  const handleInputMarcaChangePorCategoria = (categoriaId: string, value: string) => {
    setInputMarcaPorCategoria({
      ...inputMarcaPorCategoria,
      [categoriaId]: value,
    })

    if (!value.trim()) {
      setSuggestionsMarcaPorCategoria({
        ...suggestionsMarcaPorCategoria,
        [categoriaId]: [],
      })
      setShowSuggestionsMarcaPorCategoria({
        ...showSuggestionsMarcaPorCategoria,
        [categoriaId]: false,
      })
      return
    }

    // Filtrar solo marcas globales (no las que el usuario ya tiene)
    const filtered = filterMarcas(value, marcas, marcasGlobales, categoriaId)

    setSuggestionsMarcaPorCategoria({
      ...suggestionsMarcaPorCategoria,
      [categoriaId]: filtered,
    })
    setShowSuggestionsMarcaPorCategoria({
      ...showSuggestionsMarcaPorCategoria,
      [categoriaId]: filtered.length > 0,
    })
  }

  // Click en sugerencia de marca para una categoría
  const handleSelectMarcaPorCategoria = async (categoriaId: string, marca: any) => {
    // Si es marca global, crear copia en tabla personal
    if (marca.isGlobal) {
      await crearYAgregarMarcaPorCategoria(categoriaId, marca.nombre, marca.emoji)
    } else {
      // Si es marca personal pero de otra categoría, crear nueva con mismo nombre
      await crearYAgregarMarcaPorCategoria(categoriaId, marca.nombre, marca.emoji)
    }

    // Limpiar input
    setInputMarcaPorCategoria({
      ...inputMarcaPorCategoria,
      [categoriaId]: '',
    })
    setSuggestionsMarcaPorCategoria({
      ...suggestionsMarcaPorCategoria,
      [categoriaId]: [],
    })
    setShowSuggestionsMarcaPorCategoria({
      ...showSuggestionsMarcaPorCategoria,
      [categoriaId]: false,
    })
  }

  // ENTER en input de categoría
  const handleKeyDownCategoria = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmedValue = inputCategoria.trim()
    if (!trimmedValue) return

    const existe = categorias.find((c) => c.nombre.toLowerCase() === trimmedValue.toLowerCase())

    if (existe) {
      handleSelectCategoria(existe)
    } else {
      await crearYAgregarCategoria(trimmedValue)
    }

    setInputCategoria('')
    setSuggestionsCategoria([])
    setShowSuggestionsCategoria(false)
    inputCategoriaRef.current?.focus()
  }

  // ENTER en input de marca para una categoría específica
  const handleKeyDownMarcaPorCategoria = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    categoriaId: string
  ) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmedValue = (inputMarcaPorCategoria[categoriaId] || '').trim()
    if (!trimmedValue) return

    const existe = marcas.find((m) => m.nombre.toLowerCase() === trimmedValue.toLowerCase())

    if (existe) {
      handleSelectMarcaPorCategoria(categoriaId, existe)
    } else {
      await crearYAgregarMarcaPorCategoria(categoriaId, trimmedValue)
    }
  }

  // Crear nueva categoría
  const crearYAgregarCategoria = async (nombre: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          ...(emojiCategoria && { emoji: emojiCategoria }),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('categorias.add.notifications.categoryCreateError'))
      }

      const data = await response.json()
      const nuevaCategoria = data.categoria

      setCategorias([...categorias, nuevaCategoria])
      setSelectedCategories([...selectedCategories, nuevaCategoria])
      notify.success(t('categorias.add.notifications.categoryCreated', { name: nombre }))
      setEmojiCategoria(DEFAULT_CATEGORY_EMOJI)
    } catch (error: any) {
      notify.error(error.message || t('categorias.add.notifications.categoryCreateError'))
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva marca para una categoría específica
  const crearYAgregarMarcaPorCategoria = async (categoriaId: string, nombre: string, emoji?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/subcategorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          categoriaId,
          emoji,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('categorias.add.notifications.brandCreateError'))
      }

      const data = await response.json()
      const nuevaMarca = data.subcategoria

      const nuevasMarcas = [...marcas, nuevaMarca]
      setMarcas(nuevasMarcas)

      // Actualizar cache de IndexedDB
      await updateMarcasCache(marcasGlobales, nuevasMarcas, marcasVersion, pais)

      notify.success(t('categorias.add.notifications.brandCreated', { name: nombre }))
      setInputMarcaPorCategoria({
        ...inputMarcaPorCategoria,
        [categoriaId]: '',
      })
      setSuggestionsMarcaPorCategoria({
        ...suggestionsMarcaPorCategoria,
        [categoriaId]: [],
      })
    } catch (error: any) {
      notify.error(error.message || t('categorias.add.notifications.brandCreateError'))
    } finally {
      setLoading(false)
    }
  }

  // Guardar categorías en el sobre
  const handleGuardar = async () => {
    if (selectedCategories.length === 0) {
      notify.error(t('categorias.add.selectAtLeastOne'))
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/sobres/${sobreId}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoriaIds: selectedCategories.map((c) => c.id),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('categorias.add.notifications.linkError'))
      }

      notify.success(t('categorias.add.notifications.linkSuccess', { count: selectedCategories.length }))
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      notify.error(error.message || t('categorias.add.notifications.linkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('categorias.add.title')}</DrawerTitle>
          <DrawerDescription>
            {t('categorias.add.description', { sobreName })}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-6">
            {/* SECCIÓN 1: AGREGAR CATEGORÍAS */}
            <div className="space-y-3">
              <Label htmlFor="categoria" className="font-medium">
                {t('categorias.add.categories')}
              </Label>

              {/* Nombre con Emoji Picker */}
              <div className="flex gap-2 items-center">
                <EmojiPicker
                  value={emojiCategoria}
                  onChange={setEmojiCategoria}
                />
                <div className="relative flex-1">
                  <Input
                    ref={inputCategoriaRef}
                    id="categoria"
                    type="text"
                    placeholder={t('categorias.add.namePlaceholder')}
                    value={inputCategoria}
                    onChange={(e) => handleInputCategoriaChange(e.target.value)}
                    onKeyDown={handleKeyDownCategoria}
                    onFocus={() => {
                      if (inputCategoria && suggestionsCategoria.length > 0) {
                        setShowSuggestionsCategoria(true)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestionsCategoria(false), 200)
                    }}
                    className="typography-body"
                  />

                  {showSuggestionsCategoria && suggestionsCategoria.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-lg z-10">
                      {suggestionsCategoria.map((cat) => {
                        const isSelected = selectedCategories.some((c) => c.id === cat.id)
                        return (
                          <button
                            key={cat.id}
                            onClick={() => handleSelectCategoria(cat)}
                            className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 typography-body"
                            type="button"
                          >
                            <span className={isSelected ? 'text-green-600' : 'text-muted-foreground'}>
                              {t('categorias.add.checkmark')}
                            </span>
                            <span>{renderEmojiBox(cat.emoji, 'sm')}</span>
                            <span>{cat.nombre}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={async () => {
                  if (inputCategoria.trim()) {
                    await handleKeyDownCategoria({ key: 'Enter', preventDefault: () => {} } as any)
                  }
                }}
                disabled={!inputCategoria.trim() || loading}
                className="w-full"
                size="sm"
              >
                {loading ? t('common.loading') : t('categorias.add.addCategory')}
              </Button>
            </div>

            {/* Categorías seleccionadas */}
            {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {selectedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategoria(cat)}
                      className="h-10 w-full rounded-lg px-3 typography-label flex items-center gap-2 border border-border bg-muted/60 text-foreground hover:bg-muted transition-colors"
                      type="button"
                    >
                      <span>{renderEmojiBox(cat.emoji, 'sm')}</span>
                      <span className="truncate">{cat.nombre}</span>
                      <span className="ml-auto text-[11px] uppercase tracking-wide text-muted-foreground">
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 2: AGREGA EMPRESAS POR CADA CATEGORÍA */}
            {selectedCategories.length > 0 && (
              <div className="space-y-4">
                <div className="font-medium">{t('categorias.add.brands')}</div>

                <div className="space-y-3">
                  {selectedCategories.map((categoria) => {
                    const marcasDelCategoria = marcas.filter((m) => m.categoria_id === categoria.id)
                    const inputValue = inputMarcaPorCategoria[categoria.id] || ''
                    const suggestions = suggestionsMarcaPorCategoria[categoria.id] || []
                    const showSuggestions = showSuggestionsMarcaPorCategoria[categoria.id] || false

                    return (
                      <Card
                        key={categoria.id}
                        className="p-3 space-y-3 border border-border bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <p className="typography-label-lg text-foreground flex items-center gap-2">
                            {renderEmojiBox(categoria.emoji, 'sm')}
                            <span>{categoria.nombre}</span>
                          </p>
                        </div>

                        {/* Empresas agregadas */}
                        {marcasDelCategoria.length > 0 && (
                          <div className="space-y-2">
                            <Label className="typography-body-sm text-muted-foreground">{t('categorias.add.added')}</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {marcasDelCategoria.map((marca) => (
                              <button
                                key={marca.id}
                                type="button"
                                className="h-9 w-full rounded-lg px-3 typography-caption flex items-center gap-2 border border-border bg-background text-foreground"
                              >
                                <span>{renderEmojiBox(marca.emoji, 'sm')}</span>
                                <span className="truncate">{marca.nombre}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        )}

                        {/* Input para buscar/crear empresa */}
                        <div className="space-y-2">
                          <Label htmlFor={`marca-${categoria.id}`} className="typography-body-sm">
                            {t('categorias.add.addBrand')}
                          </Label>
                          <div className="relative">
                            <Input
                              id={`marca-${categoria.id}`}
                              type="text"
                              placeholder={t('categorias.add.brandSearch')}
                              value={inputValue}
                              onChange={(e) => handleInputMarcaChangePorCategoria(categoria.id, e.target.value)}
                              onKeyDown={(e) => handleKeyDownMarcaPorCategoria(e, categoria.id)}
                              onFocus={() => {
                                if (inputValue && suggestions.length > 0) {
                                  setShowSuggestionsMarcaPorCategoria({
                                    ...showSuggestionsMarcaPorCategoria,
                                    [categoria.id]: true,
                                  })
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  setShowSuggestionsMarcaPorCategoria({
                                    ...showSuggestionsMarcaPorCategoria,
                                    [categoria.id]: false,
                                  })
                                }, 200)
                              }}
                              enterKeyHint="go"
                              className="typography-body"
                            />

                            {showSuggestions && suggestions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-lg z-10">
                                {suggestions.map((marca, idx) => (
                                  <button
                                    key={`${marca.id}-${idx}`}
                                    onClick={() => handleSelectMarcaPorCategoria(categoria.id, marca)}
                                    className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 typography-body"
                                    type="button"
                                  >
                                    <span>{renderEmojiBox(marca.emoji, 'sm')}</span>
                                    <span className="flex-1">{marca.nombre}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={async () => {
                              if (inputValue.trim()) {
                                await handleKeyDownMarcaPorCategoria({ key: 'Enter', preventDefault: () => {} } as any, categoria.id)
                              }
                            }}
                            disabled={!inputValue.trim() || loading}
                            className="w-full"
                            size="sm"
                          >
                            {loading ? t('common.loading') : t('categorias.add.addBrand')}
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedCategories.length === 0 && (
              <Alert>
                <AlertDescription>
                  {t('categorias.add.selectAtLeastOne')}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2 space-y-3">
              <Button
                onClick={handleGuardar}
                disabled={loading || selectedCategories.length === 0}
                className="w-full"
              >
                {loading ? t('categorias.add.saving') : t('categorias.add.submit')}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" disabled={loading} className="w-full">
                  {t('common.cancel')}
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
