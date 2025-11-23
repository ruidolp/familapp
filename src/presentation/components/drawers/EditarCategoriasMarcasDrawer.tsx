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
import { Loader2, Plus, X } from 'lucide-react'

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

interface EditarCategoriasMarcasDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  onSuccess?: () => void
}

export function EditarCategoriasMarcasDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
  onSuccess,
}: EditarCategoriasMarcasDrawerProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(false)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [savingMarca, setSavingMarca] = useState<Record<string, boolean>>({})
  const [removingMarca, setRemovingMarca] = useState<Record<string, boolean>>({})
  const [removingCategoria, setRemovingCategoria] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    if (!open || !sobreId) return
    setLoading(true)

    try {
      const [categoriasRes, marcasRes] = await Promise.all([
        fetch(`/api/sobres/${sobreId}/categorias`),
        fetch('/api/subcategorias'),
      ])

      if (!categoriasRes.ok) {
        const error = await categoriasRes.json()
        throw new Error(error.error || 'No se pudieron cargar las categorías.')
      }

      if (!marcasRes.ok) {
        const error = await marcasRes.json()
        throw new Error(error.error || 'No se pudieron cargar las marcas.')
      }

      const categoriasData = await categoriasRes.json()
      const marcasData = await marcasRes.json()
      setCategorias(categoriasData.categorias || [])
      setMarcas(marcasData.subcategorias || [])
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
      fetchData()
    }
  }, [open, fetchData])

  const handleRemoveCategoria = async (categoria: Categoria) => {
    if (!sobreId) return
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
      setMarcas((prev) => prev.filter((marca) => marca.categoria_id !== categoria.id))
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
        setMarcas((prev) => [...prev, data.subcategoria])
      }
      setInputs((prev) => ({ ...prev, [categoriaId]: '' }))
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

  const renderMarcas = (categoriaId: string) => {
    const marcasDeCategoria = marcas.filter((marca) => marca.categoria_id === categoriaId)
    if (marcasDeCategoria.length === 0) {
      return <p className="text-sm text-muted-foreground">Aún no has agregado marcas.</p>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {marcasDeCategoria.map((marca) => (
          <div
            key={marca.id}
            className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-sm text-foreground"
          >
            <span className="flex items-center gap-1">
              {marca.emoji && <span>{marca.emoji}</span>}
              {marca.nombre}
            </span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleRemoveMarca(marca)}
              disabled={removingMarca[marca.id]}
            >
              {removingMarca[marca.id] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="sr-only">Eliminar marca</span>
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar categorías y marcas</DrawerTitle>
          <DrawerDescription>
            Organiza las categorías asignadas al sobre {sobreName || 'seleccionado'} y las marcas que contiene cada una.
          </DrawerDescription>
          <div className="mt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando
                </>
              ) : (
                'Actualizar'
              )}
            </Button>
          </div>
        </DrawerHeader>

        <DrawerBody>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando categorías...
            </div>
          ) : categorias.length === 0 ? (
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
                      <p className="text-sm text-muted-foreground">Marcas disponibles para esta categoría.</p>
                    </div>
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
                  </div>

                  {renderMarcas(categoria.id)}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddMarca(categoria.id)
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={inputs[categoria.id] || ''}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [categoria.id]: e.target.value,
                        }))
                      }
                      placeholder="Nueva marca"
                    />
                    <Button
                      type="submit"
                      disabled={!inputs[categoria.id]?.trim() || !!savingMarca[categoria.id]}
                    >
                      {savingMarca[categoria.id] ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              ))}
            </div>
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
