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
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Categoria[]>([])
  const [inputCategoria, setInputCategoria] = useState('')
  const [inputMarca, setInputMarca] = useState('')
  const [suggestionsCategoria, setSuggestionsCategoria] = useState<Categoria[]>([])
  const [suggestionsMarca, setSuggestionsMarca] = useState<Marca[]>([])
  const [showSuggestionsCategoria, setShowSuggestionsCategoria] = useState(false)
  const [showSuggestionsMarca, setShowSuggestionsMarca] = useState(false)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null)
  const inputCategoriaRef = useRef<HTMLInputElement>(null)
  const inputMarcaRef = useRef<HTMLInputElement>(null)

  // Cargar categorías cuando se abre el drawer
  useEffect(() => {
    if (open) {
      fetchCategorias()
      fetchMarcas()
      setSelectedCategories([])
      setInputCategoria('')
      setInputMarca('')
      setSuggestionsCategoria([])
      setSuggestionsMarca([])
      setShowSuggestionsCategoria(false)
      setShowSuggestionsMarca(false)
      setCategoriaSeleccionada(null)
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

  // Manejar cambios en input de marca
  const handleInputMarcaChange = (value: string) => {
    setInputMarca(value)

    if (!value.trim() || !categoriaSeleccionada) {
      setSuggestionsMarca([])
      setShowSuggestionsMarca(false)
      return
    }

    const filtered = marcas.filter((marca) => {
      const perteneceeACategoriaSeleccionada = marca.categoria_id === categoriaSeleccionada.id
      const coincideConBusqueda = marca.nombre.toLowerCase().includes(value.toLowerCase())
      return perteneceeACategoriaSeleccionada && coincideConBusqueda
    })

    setSuggestionsMarca(filtered)
    setShowSuggestionsMarca(filtered.length > 0)
  }

  // Click en sugerencia de categoría
  const handleSelectCategoria = (categoria: Categoria) => {
    setSelectedCategories([...selectedCategories, categoria])
    setInputCategoria('')
    setSuggestionsCategoria([])
    setShowSuggestionsCategoria(false)
    setCategoriaSeleccionada(null)
    setInputMarca('')
    setSuggestionsMarca([])
    inputCategoriaRef.current?.focus()
  }

  // Remover categoría
  const handleRemoveCategoria = (categoriaId: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c.id !== categoriaId))
    if (categoriaSeleccionada?.id === categoriaId) {
      setCategoriaSeleccionada(null)
      setInputMarca('')
      setSuggestionsMarca([])
    }
  }

  // Click en sugerencia de marca
  const handleSelectMarca = (marca: Marca) => {
    // Aquí simplemente mostramos que la marca fue seleccionada
    // En CrearGastoDrawer será donde se seleccione realmente
    notify.info(`Marca "${marca.nombre}" seleccionada`)
    setInputMarca('')
    setSuggestionsMarca([])
    setShowSuggestionsMarca(false)
    inputMarcaRef.current?.focus()
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
    setCategoriaSeleccionada(null)
    inputCategoriaRef.current?.focus()
  }

  // ENTER en input de marca
  const handleKeyDownMarca = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmedValue = inputMarca.trim()
    if (!trimmedValue || !categoriaSeleccionada) return

    const existe = marcas.find((m) => m.nombre.toLowerCase() === trimmedValue.toLowerCase())

    if (existe) {
      handleSelectMarca(existe)
    } else {
      await crearYAgregarMarca(trimmedValue)
    }

    setInputMarca('')
    setSuggestionsMarca([])
    setShowSuggestionsMarca(false)
    inputMarcaRef.current?.focus()
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

  // Crear nueva marca
  const crearYAgregarMarca = async (nombre: string) => {
    if (!categoriaSeleccionada) return

    setLoading(true)
    try {
      const response = await fetch('/api/subcategorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          categoriaId: categoriaSeleccionada.id,
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
      setInputMarca('')
      setSuggestionsMarca([])
      inputMarcaRef.current?.focus()
    } catch (error: any) {
      notify.error(error.message || 'Error al crear marca')
    } finally {
      setLoading(false)
    }
  }

  // Guardar categorías en el sobre
  const handleGuardar = async () => {
    if (selectedCategories.length === 0) {
      notify.error('Selecciona al menos una categoría')
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

  const marcasDelCategoria = categoriaSeleccionada
    ? marcas.filter((m) => m.categoria_id === categoriaSeleccionada.id)
    : []

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar Categoría</DrawerTitle>
          <DrawerDescription>
            Agrega categorías y marcas al sobre &quot;{sobreName}&quot;
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-6">
            {/* SECCIÓN 1: NOMBRE DE CATEGORÍA */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Nombre</Label>
              <div className="relative">
                <Input
                  ref={inputCategoriaRef}
                  id="categoria"
                  type="text"
                  placeholder="Escribe categoría (Ej: Alimentación)"
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
                />

                {showSuggestionsCategoria && suggestionsCategoria.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                    {suggestionsCategoria.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategoria(cat)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-sm"
                        type="button"
                      >
                        <span className="text-green-600">✓</span>
                        {cat.emoji && <span>{cat.emoji}</span>}
                        <span>{cat.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Presiona <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">ENTER</kbd> para crear nueva
              </p>
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

            {/* SECCIÓN 2: DONDE COMPRAS? (MARCAS) */}
            {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium">¿Donde compras?</h3>
                  <p className="text-xs text-muted-foreground">
                    Agrega las marcas de estas categorías para conocer cuánto gastas en ellas
                  </p>
                </div>

                {/* Card de marcas */}
                <Card className="p-4 space-y-3">
                  {/* Marcas agregadas (scroll si hay muchas) */}
                  {marcasDelCategoria.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">Marcas agregadas</Label>
                      <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1">
                        {marcasDelCategoria.map((marca) => (
                          <Badge key={marca.id} variant="secondary" className="text-xs">
                            {marca.emoji && <span className="mr-1">{marca.emoji}</span>}
                            {marca.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input para buscar/crear marcas */}
                  <div className="space-y-2">
                    <Label htmlFor="marca" className="text-xs">
                      Marcas con campo de texto
                    </Label>
                    <div className="relative">
                      <Input
                        ref={inputMarcaRef}
                        id="marca"
                        type="text"
                        placeholder="Busca o crea marca..."
                        value={inputMarca}
                        onChange={(e) => handleInputMarcaChange(e.target.value)}
                        onKeyDown={handleKeyDownMarca}
                        onFocus={() => {
                          if (inputMarca && suggestionsMarca.length > 0) {
                            setShowSuggestionsMarca(true)
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestionsMarca(false), 200)
                        }}
                        disabled={!categoriaSeleccionada}
                      />

                      {showSuggestionsMarca && suggestionsMarca.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                          {suggestionsMarca.map((marca) => (
                            <button
                              key={marca.id}
                              onClick={() => handleSelectMarca(marca)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-sm"
                              type="button"
                            >
                              <span className="text-green-600">✓</span>
                              {marca.emoji && <span>{marca.emoji}</span>}
                              <span>{marca.nombre}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Presiona <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">ENTER</kbd> para crear nueva marca
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {selectedCategories.length === 0 && (
              <Alert>
                <AlertDescription>
                  Selecciona una categoría para agregar marcas
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
