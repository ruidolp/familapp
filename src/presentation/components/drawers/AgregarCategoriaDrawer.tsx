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
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { notify } from '@/infrastructure/lib/notifications'

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
  const [selectedCategories, setSelectedCategories] = useState<Categoria[]>([])
  const [inputCategoria, setInputCategoria] = useState('')
  const [inputMarcaPorCategoria, setInputMarcaPorCategoria] = useState<Record<string, string>>({})
  const [suggestionsCategoria, setSuggestionsCategoria] = useState<Categoria[]>([])
  const [suggestionsMarcaPorCategoria, setSuggestionsMarcaPorCategoria] = useState<Record<string, Marca[]>>({})
  const [showSuggestionsCategoria, setShowSuggestionsCategoria] = useState(false)
  const [showSuggestionsMarcaPorCategoria, setShowSuggestionsMarcaPorCategoria] = useState<Record<string, boolean>>({})
  const [expandedEmpresas, setExpandedEmpresas] = useState(false)
  const inputCategoriaRef = useRef<HTMLInputElement>(null)

  // Cargar categorías cuando se abre el drawer
  useEffect(() => {
    if (open) {
      fetchCategorias()
      fetchMarcas()
      setSelectedCategories([])
      setInputCategoria('')
      setInputMarcaPorCategoria({})
      setSuggestionsCategoria([])
      setSuggestionsMarcaPorCategoria({})
      setShowSuggestionsCategoria(false)
      setShowSuggestionsMarcaPorCategoria({})
      setExpandedEmpresas(false)
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
      const response = await fetch('/api/subcategorias')
      if (response.ok) {
        const data = await response.json()
        setMarcas(data.subcategorias || [])
      }
    } catch (error) {
      console.error('Error al cargar marcas:', error)
    }
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
    setSelectedCategories([...selectedCategories, categoria])
    setInputCategoria('')
    setSuggestionsCategoria([])
    setShowSuggestionsCategoria(false)
    inputCategoriaRef.current?.focus()
  }

  // Remover categoría
  const handleRemoveCategoria = (categoriaId: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c.id !== categoriaId))
    // Limpiar datos de marcas para esta categoría
    const newInputMarcas = { ...inputMarcaPorCategoria }
    const newShowMarcas = { ...showSuggestionsMarcaPorCategoria }
    const newSuggestionsMarcas = { ...suggestionsMarcaPorCategoria }
    delete newInputMarcas[categoriaId]
    delete newShowMarcas[categoriaId]
    delete newSuggestionsMarcas[categoriaId]
    setInputMarcaPorCategoria(newInputMarcas)
    setShowSuggestionsMarcaPorCategoria(newShowMarcas)
    setSuggestionsMarcaPorCategoria(newSuggestionsMarcas)
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

    const filtered = marcas.filter((marca) => {
      const coincideConBusqueda = marca.nombre.toLowerCase().includes(value.toLowerCase())
      return coincideConBusqueda
    })

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
  const handleSelectMarcaPorCategoria = async (categoriaId: string, marca: Marca) => {
    // Si la marca ya pertenece a esta categoría, solo notificar
    if (marca.categoria_id === categoriaId) {
      notify.info(`Marca "${marca.nombre}" ya existe en esta categoría`)
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
      return
    }

    // Si la marca pertenece a otra categoría, crear una nueva con el mismo nombre
    await crearYAgregarMarcaPorCategoria(categoriaId, marca.nombre)
  }

  // ENTER en input de categoría
  const handleKeyDownCategoria = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmedValue = inputCategoria.trim()
    if (!trimmedValue) return

    const existe = categorias.find((c) => c.nombre.toLowerCase() === trimmedValue.toLowerCase())

    if (existe) {
      const yaEstaSeleccionada = selectedCategories.some((s) => s.id === existe.id)
      if (!yaEstaSeleccionada) {
        setSelectedCategories([...selectedCategories, existe])
      }
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
        body: JSON.stringify({ nombre }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear categoría')
      }

      const data = await response.json()
      const nuevaCategoria = data.categoria

      setCategorias([...categorias, nuevaCategoria])
      setSelectedCategories([...selectedCategories, nuevaCategoria])
      notify.success(`Categoría "${nombre}" creada`)
    } catch (error: any) {
      notify.error(error.message || 'Error al crear categoría')
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva marca para una categoría específica
  const crearYAgregarMarcaPorCategoria = async (categoriaId: string, nombre: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/subcategorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          categoriaId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear marca')
      }

      const data = await response.json()
      const nuevaMarca = data.subcategoria

      setMarcas([...marcas, nuevaMarca])
      notify.success(`Marca "${nombre}" creada`)
      setInputMarcaPorCategoria({
        ...inputMarcaPorCategoria,
        [categoriaId]: '',
      })
      setSuggestionsMarcaPorCategoria({
        ...suggestionsMarcaPorCategoria,
        [categoriaId]: [],
      })
    } catch (error: any) {
      notify.error(error.message || 'Error al crear marca')
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
        throw new Error(error.error || 'Error al agregar categorías')
      }

      notify.success(`${selectedCategories.length} categoría(s) agregada(s)`)
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      notify.error(error.message || 'Error al agregar categorías')
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
            <div className="space-y-2">
              <Label htmlFor="categoria" className="font-medium">
                Categorías
              </Label>
              <div className="relative">
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
                  className="text-base"
                />

                {showSuggestionsCategoria && suggestionsCategoria.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                    {suggestionsCategoria.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategoria(cat)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-base"
                        type="button"
                      >
                        <span className="text-green-600">{t('categorias.add.checkmark')}</span>
                        {cat.emoji && <span>{cat.emoji}</span>}
                        <span>{cat.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <Badge key={cat.id} variant="default" className="gap-1 pl-2">
                      {cat.emoji && <span>{cat.emoji}</span>}
                      <span>{cat.nombre}</span>
                      <button
                        onClick={() => handleRemoveCategoria(cat.id)}
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

            {/* SEPARADOR */}
            <div className="border-t" />

            {/* SECCIÓN 2: AGREGA EMPRESAS POR CADA CATEGORÍA (EXPANDIBLE) */}
            {selectedCategories.length > 0 && (
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => setExpandedEmpresas(!expandedEmpresas)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition"
                >
                  <span className="font-medium">{t('categorias.add.brands')}</span>
                  {expandedEmpresas ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {expandedEmpresas && (
                  <div className="border-t border-border p-4 space-y-4 bg-muted/30">
                    {selectedCategories.map((categoria) => {
                      const marcasDelCategoria = marcas.filter((m) => m.categoria_id === categoria.id)
                      const inputValue = inputMarcaPorCategoria[categoria.id] || ''
                      const suggestions = suggestionsMarcaPorCategoria[categoria.id] || []
                      const showSuggestions = showSuggestionsMarcaPorCategoria[categoria.id] || false

                      return (
                        <Card key={categoria.id} className="p-3 space-y-3">
                          <div>
                            <p className="text-base font-medium">
                              {categoria.emoji && <span className="mr-1">{categoria.emoji}</span>}
                              {categoria.nombre}
                            </p>
                          </div>

                          {/* Empresas agregadas */}
                          {marcasDelCategoria.length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-sm">{t('categorias.add.added')}</Label>
                              <div className="flex flex-wrap gap-1">
                                {marcasDelCategoria.map((marca) => (
                                  <Badge key={marca.id} variant="secondary" className="text-sm">
                                    {marca.emoji && <span className="mr-1">{marca.emoji}</span>}
                                    {marca.nombre}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Input para buscar/crear empresa */}
                          <div className="space-y-2">
                            <Label htmlFor={`marca-${categoria.id}`} className="text-sm">
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
                                className="text-base"
                              />

                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                                  {suggestions.map((marca) => (
                                    <button
                                      key={marca.id}
                                      onClick={() => handleSelectMarcaPorCategoria(categoria.id, marca)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-base"
                                      type="button"
                                    >
                                      <span className="text-green-600">{t('categorias.add.checkmark')}</span>
                                      {marca.emoji && <span>{marca.emoji}</span>}
                                      <span>{marca.nombre}</span>
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
                )}
              </div>
            )}

            {selectedCategories.length === 0 && (
              <Alert>
                <AlertDescription>
                  {t('categorias.add.selectAtLeastOne')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleGuardar}
            disabled={loading || selectedCategories.length === 0}
            className="w-full"
          >
            {loading ? t('categorias.add.saving') : t('categorias.add.submit')}
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
