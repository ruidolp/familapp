'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { notify } from '@/infrastructure/lib/notifications'
import { EmojiPicker } from '@/components/inputs/EmojiPicker'
import { Loader2, X } from 'lucide-react'
import { getMarcasCombinadas, filterMarcas } from '@/infrastructure/utils/marcas-storage'

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
  categoriaId?: string
}

interface EditarCategoriasMarcasDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  userRole?: 'OWNER' | 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'
  onSuccess?: () => void
}

interface MarcaSuggestion {
  id: string
  nombre: string
  emoji?: string
  isGlobal?: boolean
}

const DEFAULT_CATEGORY_EMOJI = '📁'

export function EditarCategoriasMarcasDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
  userRole = 'OWNER',
  onSuccess,
}: EditarCategoriasMarcasDrawerProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(false)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [savingMarca, setSavingMarca] = useState<Record<string, boolean>>({})
  const [removingMarca, setRemovingMarca] = useState<Record<string, boolean>>({})
  const [removingCategoria, setRemovingCategoria] = useState<Record<string, boolean>>({})
  const [showCreateCategoria, setShowCreateCategoria] = useState(false)
  const [newCategoriaNombre, setNewCategoriaNombre] = useState('')
  const [newCategoriaEmoji, setNewCategoriaEmoji] = useState(DEFAULT_CATEGORY_EMOJI)
  const [creatingCategoria, setCreatingCategoria] = useState(false)
  const [marcasGlobales, setMarcasGlobales] = useState<any[]>([])
  const [marcasVersion, setMarcasVersion] = useState<string>('')
  const [pais, setPais] = useState<string>('CL')
  const [marcaSuggestions, setMarcaSuggestions] = useState<Record<string, MarcaSuggestion[]>>({})
  const [showSuggestionsMarca, setShowSuggestionsMarca] = useState<Record<string, boolean>>({})
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([])
  const [categoriaSuggestions, setCategoriaSuggestions] = useState<Categoria[]>([])
  const [showCategoriaSuggestions, setShowCategoriaSuggestions] = useState(false)

  // Permisos basados en rol
  const canEdit = userRole !== 'VIEWER'
  const canDelete = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'CONTRIBUTOR'

  const fetchData = useCallback(async () => {
    if (!open || !sobreId) return
    setLoading(true)

    try {
      const [categoriasRes, configRes, categoriasUsuarioRes] = await Promise.all([
        fetch(`/api/sobres/${sobreId}/categorias`),
        fetch('/api/user/config'),
        fetch('/api/categorias'),
      ])

      if (!categoriasRes.ok) {
        const error = await categoriasRes.json()
        throw new Error(error.error || 'No se pudieron cargar las categorías.')
      }

      if (!configRes.ok) {
        const error = await configRes.json()
        throw new Error(error.error || 'No se pudo cargar la configuración del usuario.')
      }

      if (!categoriasUsuarioRes.ok) {
        const error = await categoriasUsuarioRes.json()
        throw new Error(error.error || 'No se pudieron cargar las categorías disponibles.')
      }

      const categoriasData = await categoriasRes.json()
      const configData = await configRes.json()
      const categoriasUsuarioData = await categoriasUsuarioRes.json()

      const categoriasList = categoriasData.categorias || []
      setCategorias(categoriasList)

      // Cargar marcas de cada categoría individualmente
      const allMarcas: Marca[] = []
      await Promise.all(
        categoriasList.map(async (cat: Categoria) => {
          try {
            const marcasRes = await fetch(`/api/categorias/${cat.id}/subcategorias`)
            if (marcasRes.ok) {
              const marcasData = await marcasRes.json()
              const normalizedMarcas = (marcasData.subcategorias || []).map((marca: any) => ({
                ...marca,
                categoria_id: marca.categoria_id || marca.categoriaId,
              }))
              allMarcas.push(...normalizedMarcas)
            }
          } catch (err) {
            console.error(`Error cargando marcas de categoría ${cat.id}:`, err)
          }
        })
      )
      setMarcas(allMarcas)

      const paisCode = configData.config?.pais || configData.config?.locale?.split('-')[1]?.toUpperCase() || 'CL'
      setPais(paisCode)
      setMarcasVersion(configData.marcasGlobalesVersion || '')
      setAllCategorias(categoriasUsuarioData.categorias || [])
    } catch (error: any) {
      console.error(error)
      notify.error(error.message || 'No se pudieron cargar los datos.')
    } finally {
      setLoading(false)
    }
  }, [open, sobreId])

  useEffect(() => {
    if (open) {
      setInputs({})
      setShowCreateCategoria(false)
      setNewCategoriaNombre('')
      setNewCategoriaEmoji(DEFAULT_CATEGORY_EMOJI)
      setMarcaSuggestions({})
      setShowSuggestionsMarca({})
      setCategoriaSuggestions([])
      setShowCategoriaSuggestions(false)
      fetchData()
    }
  }, [open, fetchData])

  const loadMarcasGlobales = useCallback(async () => {
    try {
      if (!pais || !marcasVersion) return
      const { globales } = await getMarcasCombinadas(pais, marcasVersion, marcas)
      setMarcasGlobales(globales)
    } catch (error) {
      console.error('Error al cargar marcas globales:', error)
    }
  }, [pais, marcasVersion, marcas])

  useEffect(() => {
    if (open && marcasVersion) {
      loadMarcasGlobales()
    }
  }, [open, marcasVersion, loadMarcasGlobales])

  const handleRemoveCategoria = async (categoria: Categoria) => {
    if (!sobreId) return
    if (!canDelete) {
      notify.error('No tienes permisos para eliminar categorías')
      return
    }
    const confirmed = window.confirm(`¿Eliminar la categoría "${categoria.nombre}" de este sobre?`)
    if (!confirmed) return

    setRemovingCategoria((prev) => ({ ...prev, [categoria.id]: true }))
    try {
      const response = await fetch(`/api/sobres/${sobreId}/categorias/${categoria.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo eliminar la categoría.')
      }

      setCategorias((prev) => prev.filter((cat) => cat.id !== categoria.id))
      setMarcas((prev) => prev.filter((marca) => getMarcaCategoriaId(marca) !== categoria.id))
      setInputs((prev) => {
        const updated = { ...prev }
        delete updated[categoria.id]
        return updated
      })
      notify.success('Categoría eliminada del sobre.')
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      notify.error(error.message || 'No se pudo eliminar la categoría.')
    } finally {
      setRemovingCategoria((prev) => {
        const updated = { ...prev }
        delete updated[categoria.id]
        return updated
      })
    }
  }

  const handleRemoveMarca = async (marca: Marca) => {
    if (!canDelete) {
      notify.error('No tienes permisos para eliminar marcas')
      return
    }
    const confirmed = window.confirm(`¿Eliminar la marca "${marca.nombre}"?`)
    if (!confirmed) return

    setRemovingMarca((prev) => ({ ...prev, [marca.id]: true }))
    try {
      const response = await fetch(`/api/subcategorias/${marca.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo eliminar la marca.')
      }

      setMarcas((prev) => prev.filter((m) => m.id !== marca.id))
      notify.success('Marca eliminada.')
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      notify.error(error.message || 'No se pudo eliminar la marca.')
    } finally {
      setRemovingMarca((prev) => {
        const updated = { ...prev }
        delete updated[marca.id]
        return updated
      })
    }
  }

  const handleAddMarca = async (categoriaId: string) => {
    if (!canEdit) {
      notify.error('No tienes permisos para agregar marcas')
      return
    }
    const nombre = inputs[categoriaId]?.trim()
    if (!nombre) return

    setSavingMarca((prev) => ({ ...prev, [categoriaId]: true }))
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
        throw new Error(error.error || 'No se pudo crear la marca.')
      }

      const data = await response.json()
      if (data.subcategoria) {
        setMarcas((prev) => [
          ...prev,
          {
            ...data.subcategoria,
            categoria_id: data.subcategoria.categoria_id || data.subcategoria.categoriaId,
          },
        ])
      }
      setInputs((prev) => ({ ...prev, [categoriaId]: '' }))
      setMarcaSuggestions((prev) => ({ ...prev, [categoriaId]: [] }))
      setShowSuggestionsMarca((prev) => ({ ...prev, [categoriaId]: false }))
      notify.success('Marca agregada.')
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      notify.error(error.message || 'No se pudo crear la marca.')
    } finally {
      setSavingMarca((prev) => {
        const updated = { ...prev }
        delete updated[categoriaId]
        return updated
      })
    }
  }

  const getMarcaCategoriaId = (marca: Marca | any) => marca.categoria_id || (marca as any).categoriaId || ''

  const renderMarcas = (categoriaId: string) => {
    const marcasDeCategoria = marcas.filter((marca) => getMarcaCategoriaId(marca) === categoriaId)
    if (marcasDeCategoria.length === 0) {
      return <p className="text-sm text-muted-foreground">Aún no has agregado marcas.</p>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {marcasDeCategoria.map((marca) => (
          <button
            key={marca.id}
            type="button"
            onClick={() => canDelete && handleRemoveMarca(marca)}
            disabled={removingMarca[marca.id] || !canDelete}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-sm text-foreground transition hover:bg-muted disabled:opacity-70"
          >
            {marca.emoji && <span>{marca.emoji}</span>}
            <span>{marca.nombre}</span>
            {canDelete && (
              <>
                {removingMarca[marca.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="sr-only">Eliminar marca</span>
              </>
            )}
          </button>
        ))}
      </div>
    )
  }

  const handleMarcaInputChange = (categoriaId: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [categoriaId]: value,
    }))

    if (!value.trim()) {
      setMarcaSuggestions((prev) => ({ ...prev, [categoriaId]: [] }))
      setShowSuggestionsMarca((prev) => ({ ...prev, [categoriaId]: false }))
      return
    }

    const filtered = filterMarcas(value, marcas, marcasGlobales).slice(0, 5)
    setMarcaSuggestions((prev) => ({ ...prev, [categoriaId]: filtered }))
    setShowSuggestionsMarca((prev) => ({ ...prev, [categoriaId]: filtered.length > 0 }))
  }

  const handleSelectMarcaSuggestion = (categoriaId: string, suggestion: MarcaSuggestion) => {
    setInputs((prev) => ({
      ...prev,
      [categoriaId]: suggestion.nombre,
    }))
    setMarcaSuggestions((prev) => ({ ...prev, [categoriaId]: [] }))
    setShowSuggestionsMarca((prev) => ({ ...prev, [categoriaId]: false }))
  }

  const handleCreateCategoria = async () => {
    if (!canEdit) {
      notify.error('No tienes permisos para crear categorías')
      return
    }
    if (!sobreId || !newCategoriaNombre.trim()) {
      notify.error('Escribe un nombre para la categoría.')
      return
    }

    setCreatingCategoria(true)
    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newCategoriaNombre.trim(),
          emoji: newCategoriaEmoji.trim() || undefined,
          sobreId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo crear la categoría.')
      }

      const data = await response.json()
      if (data.categoria) {
        setCategorias((prev) => [...prev, data.categoria])
        setAllCategorias((prev) => [...prev, data.categoria])
      }
      notify.success('Categoría creada y asignada al sobre.')
      setNewCategoriaNombre('')
      setNewCategoriaEmoji(DEFAULT_CATEGORY_EMOJI)
      setCategoriaSuggestions([])
      setShowCategoriaSuggestions(false)
      setShowCreateCategoria(false)
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      notify.error(error.message || 'No se pudo crear la categoría.')
    } finally {
      setCreatingCategoria(false)
    }
  }

  const handleCategoriaNombreChange = (value: string) => {
    setNewCategoriaNombre(value)

    if (!value.trim()) {
      setCategoriaSuggestions([])
      setShowCategoriaSuggestions(false)
      return
    }

    const query = value.toLowerCase()
    const filtered = allCategorias
      .filter((cat) => cat.nombre.toLowerCase().includes(query))
      .slice(0, 5)

    setCategoriaSuggestions(filtered)
    setShowCategoriaSuggestions(filtered.length > 0)
  }

  const handleSelectCategoriaSuggestion = (categoria: Categoria) => {
    setNewCategoriaNombre(categoria.nombre)
    if ((newCategoriaEmoji === DEFAULT_CATEGORY_EMOJI || !newCategoriaEmoji) && categoria.emoji) {
      setNewCategoriaEmoji(categoria.emoji)
    }
    setCategoriaSuggestions([])
    setShowCategoriaSuggestions(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar categorías y marcas</DrawerTitle>
          <DrawerDescription>
            Organiza las categorías asignadas al sobre {sobreName || 'seleccionado'} y las marcas que contiene cada una.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4">
          {canEdit && (
            <Card className="space-y-4 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Agregar una nueva categoría</p>
                  <p className="text-sm text-muted-foreground">
                    Ordena tus gastos por tipos de gastos.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={showCreateCategoria ? 'secondary' : 'default'}
                  onClick={() => setShowCreateCategoria((prev) => !prev)}
                >
                  {showCreateCategoria ? 'Ocultar' : 'Agregar categoría'}
                </Button>
              </div>

            {showCreateCategoria && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCreateCategoria()
                }}
                className="space-y-4 rounded-xl border border-dashed border-border/60 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <EmojiPicker
                      value={newCategoriaEmoji}
                      onChange={setNewCategoriaEmoji}
                    />
                    {!newCategoriaEmoji && (
                      <span className="text-xs font-medium text-muted-foreground">Sin emoji</span>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <Input
                      value={newCategoriaNombre}
                      onChange={(e) => handleCategoriaNombreChange(e.target.value)}
                      placeholder="Nombre de la categoría"
                      onFocus={() => setShowCategoriaSuggestions(Boolean(categoriaSuggestions.length))}
                      onBlur={() => setTimeout(() => setShowCategoriaSuggestions(false), 150)}
                    />
                    {showCategoriaSuggestions && categoriaSuggestions.length > 0 && (
                      <div className="absolute z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
                        {categoriaSuggestions.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectCategoriaSuggestion(cat)}
                          >
                            {cat.emoji && <span>{cat.emoji}</span>}
                            <span className="flex-1 text-left">{cat.nombre}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se agregará automáticamente al sobre {sobreName || 'seleccionado'}.
                </p>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!newCategoriaNombre.trim() || creatingCategoria}
                  >
                    {creatingCategoria ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
          )}

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando categorías...
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categorías actuales
              </p>
              {categorias.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">
                  No hay categorías asignadas a este sobre.
                </div>
              ) : (
                <div className="space-y-4">
                  {categorias.map((categoria) => (
                    <Card key={categoria.id} className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 font-semibold">
                            {categoria.emoji && <span>{categoria.emoji}</span>}
                            <span>{categoria.nombre}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Marcas de la categoría.</p>
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleRemoveCategoria(categoria)}
                            disabled={removingCategoria[categoria.id]}
                          >
                            {removingCategoria[categoria.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            <span className="sr-only">Eliminar categoría</span>
                          </Button>
                        )}
                      </div>

                      {renderMarcas(categoria.id)}

                      {canEdit && (
                        <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleAddMarca(categoria.id)
                        }}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <div className="relative flex-1">
                          <Input
                            value={inputs[categoria.id] || ''}
                            onChange={(e) => handleMarcaInputChange(categoria.id, e.target.value)}
                            placeholder="Nueva marca"
                            onFocus={() =>
                              setShowSuggestionsMarca((prev) => ({
                                ...prev,
                                [categoria.id]: Boolean((marcaSuggestions[categoria.id] || []).length),
                              }))
                            }
                            onBlur={() => {
                              setTimeout(() => {
                                setShowSuggestionsMarca((prev) => ({ ...prev, [categoria.id]: false }))
                              }, 150)
                            }}
                            className="w-full"
                          />
                          {showSuggestionsMarca[categoria.id] &&
                            (marcaSuggestions[categoria.id] || []).length > 0 && (
                              <div className="absolute bottom-full left-0 right-0 mb-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-lg z-20">
                                {(marcaSuggestions[categoria.id] || []).map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectMarcaSuggestion(categoria.id, suggestion)}
                                  >
                                    {suggestion.emoji && <span>{suggestion.emoji}</span>}
                                    <span className="flex-1 text-left">{suggestion.nombre}</span>
                                    {suggestion.isGlobal && (
                                      <span className="text-[10px] uppercase text-muted-foreground">Global</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                        <Button
                          type="submit"
                          className="w-full sm:w-auto"
                          disabled={!inputs[categoria.id]?.trim() || !!savingMarca[categoria.id]}
                        >
                          {savingMarca[categoria.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            'Agregar'
                          )}
                        </Button>
                      </form>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/30">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
