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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notify } from '@/infrastructure/lib/notifications'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'
import { useCrearGasto } from '@/presentation/hooks/useTransacciones'
import { useCategoryContext } from '@/presentation/providers/category-context'

interface Sobre {
  id: string
  nombre: string
  emoji?: string
  presupuesto_asignado: number
  gastado?: number
}

interface Categoria {
  id: string
  nombre: string
  emoji?: string
  gastado?: number
}

interface Marca {
  id: string
  nombre: string
  emoji?: string
  categoria_id: string
}

interface CrearGastoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  preselectedSobreId?: string
  preselectedCategoriaId?: string
  onSuccess?: () => void
}

export function CrearGastoDrawer({
  open,
  onOpenChange,
  userId,
  preselectedSobreId,
  preselectedCategoriaId,
  onSuccess,
}: CrearGastoDrawerProps) {
  const { selectedCategoryId, setSelectedCategoryId } = useCategoryContext()

  const [loading, setLoading] = useState(false)
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])

  const [sobreSeleccionado, setSobreSeleccionado] = useState<string>('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('')
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>('')
  const [inputMarca, setInputMarca] = useState('')
  const [suggestionsMarca, setSuggestionsMarca] = useState<Marca[]>([])
  const [showSuggestionsMarca, setShowSuggestionsMarca] = useState(false)
  const [monto, setMonto] = useState('')
  const [comentario, setComentario] = useState('')
  const [presupuestoWarning, setPresupuestoWarning] = useState<{
    excede: boolean
    sobre: Sobre | null
    exceso: number
    porcentaje: number
  } | null>(null)

  const montoRef = useRef<HTMLInputElement>(null)
  const inputMarcaRef = useRef<HTMLInputElement>(null)
  useInputFocus(montoRef, 350)

  const { crearGasto } = useCrearGasto()

  // Cargar datos cuando se abre
  useEffect(() => {
    if (open) {
      fetchData()
      setSobreSeleccionado(preselectedSobreId || '')
      // Usar selectedCategoryId del context si está disponible, sino usar preselectedCategoriaId
      const categoryToSet = selectedCategoryId || preselectedCategoriaId || ''
      setCategoriaSeleccionada(categoryToSet)
      setMarcaSeleccionada('')
      setInputMarca('')
      setMonto('')
      setComentario('')
      setPresupuestoWarning(null)
    }
  }, [open, preselectedSobreId, preselectedCategoriaId, selectedCategoryId])

  const fetchData = async () => {
    try {
      const [sobresRes, categoriasRes, marcasRes] = await Promise.all([
        fetch('/api/sobres'),
        fetch('/api/categorias'),
        fetch('/api/subcategorias'),
      ])

      if (sobresRes.ok) {
        const data = await sobresRes.json()
        setSobres(data.sobres || [])
      }
      if (categoriasRes.ok) {
        const data = await categoriasRes.json()
        setCategorias(data.categorias || [])
      }
      if (marcasRes.ok) {
        const data = await marcasRes.json()
        setMarcas(data.subcategorias || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      notify.error('Error al cargar formulario')
    }
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
      const perteneceeACategoriaSeleccionada = marca.categoria_id === categoriaSeleccionada
      const coincideConBusqueda = marca.nombre.toLowerCase().includes(value.toLowerCase())
      return perteneceeACategoriaSeleccionada && coincideConBusqueda
    })

    setSuggestionsMarca(filtered)
    setShowSuggestionsMarca(filtered.length > 0)
  }

  // Click en sugerencia de marca
  const handleSelectMarca = (marca: Marca) => {
    setMarcaSeleccionada(marca.id)
    setInputMarca('')
    setSuggestionsMarca([])
    setShowSuggestionsMarca(false)
    inputMarcaRef.current?.focus()
  }

  // Remover marca seleccionada
  const handleRemoveMarca = () => {
    setMarcaSeleccionada('')
    setInputMarca('')
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

    setSuggestionsMarca([])
    setShowSuggestionsMarca(false)
    inputMarcaRef.current?.focus()
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
          categoriaId: categoriaSeleccionada,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear marca')
      }

      const data = await response.json()
      const nuevaMarca = data.subcategoria

      setMarcas([...marcas, nuevaMarca])
      setMarcaSeleccionada(nuevaMarca.id)
      setInputMarca('')
      notify.success(`Marca "${nombre}" creada`)
    } catch (error: any) {
      notify.error(error.message || 'Error al crear marca')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!sobreSeleccionado) {
        notify.error('Selecciona un sobre')
        setLoading(false)
        return
      }
      if (!categoriaSeleccionada) {
        notify.error('La categoría es obligatoria')
        setLoading(false)
        return
      }
      if (!monto || parseFloat(monto) <= 0) {
        notify.error('Ingresa un monto válido')
        setLoading(false)
        return
      }

      // Obtener moneda del sobre (usando la moneda principal del usuario)
      // Por ahora, haremos una llamada a la API para obtener la configuración del usuario
      let monedaId = ''
      try {
        const configRes = await fetch('/api/user/config')
        if (configRes.ok) {
          const configData = await configRes.json()
          monedaId = configData.monedaPrincipalId || ''
        }
      } catch (error) {
        console.error('Error getting user currency:', error)
      }

      const result = await crearGasto({
        monto: parseFloat(monto),
        monedaId: monedaId,
        billeteraId: '', // No se usa billetera, pero required por API
        tipo: 'GASTO',
        descripcion: comentario || undefined,
        fecha: new Date().toISOString(),
        sobreId: sobreSeleccionado,
        categoriaId: categoriaSeleccionada,
        subcategoriaId: marcaSeleccionada || undefined,
      })

      notify.success('Gasto registrado correctamente')

      if (result.warning) {
        notify.warning(`${result.warning.type}: ${result.warning.message}`)
      }

      // Limpiar selectedCategoryId del context
      setSelectedCategoryId(null)

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      notify.error(err.message || 'Error al registrar gasto')
    } finally {
      setLoading(false)
    }
  }

  // Validar presupuesto cuando el monto o sobre cambian
  useEffect(() => {
    if (monto && sobreSeleccionado) {
      const sobreActual = sobres.find((s) => s.id === sobreSeleccionado)
      if (sobreActual) {
        const montoNum = parseFloat(monto)
        const presupuesto = sobreActual.presupuesto_asignado || 0
        const gastado = sobreActual.gastado || 0
        const montoLibre = presupuesto - gastado
        const nuevoGastadoTotal = gastado + montoNum

        if (nuevoGastadoTotal > presupuesto) {
          const exceso = nuevoGastadoTotal - presupuesto
          const porcentaje = (exceso / presupuesto) * 100
          setPresupuestoWarning({
            excede: true,
            sobre: sobreActual,
            exceso,
            porcentaje,
          })
        } else {
          setPresupuestoWarning(null)
        }
      }
    }
  }, [monto, sobreSeleccionado, sobres])

  const sobreActual = sobres.find((s) => s.id === sobreSeleccionado)
  const categoriaActual = categorias.find((c) => c.id === categoriaSeleccionada)
  const marcasDelCategoria = categoriaSeleccionada
    ? marcas.filter((m) => m.categoria_id === categoriaSeleccionada)
    : []
  const marcaActual = marcas.find((m) => m.id === marcaSeleccionada)

  // Ordenar categorías por uso (gastado) descendente
  const categoriasOrdenadas = [...categorias].sort((a, b) => {
    const gastadoA = Number(a.gastado) || 0
    const gastadoB = Number(b.gastado) || 0
    return gastadoB - gastadoA
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Registrar Gasto</DrawerTitle>
          <DrawerDescription>
            Crea un nuevo gasto en un sobre
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sobre */}
            <div className="space-y-2">
              <Label htmlFor="sobre" className="font-medium">Sobre</Label>
              {sobres.length === 1 ? (
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50">
                  <Badge variant="outline" className="text-base">
                    {sobreActual?.emoji} {sobreActual?.nombre}
                  </Badge>
                </div>
              ) : (
                <Select value={sobreSeleccionado} onValueChange={setSobreSeleccionado}>
                  <SelectTrigger id="sobre" className="text-base">
                    <SelectValue placeholder="Seleccionar sobre" />
                  </SelectTrigger>
                  <SelectContent>
                    {sobres.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.emoji} {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Categorías (como chips) */}
            <div className="space-y-2">
              <Label className="font-medium">Categoría</Label>
              <div className="flex flex-wrap gap-2">
                {categoriasOrdenadas.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoriaSeleccionada(c.id)}
                    className={`px-3 py-2 rounded-full text-base font-medium transition-all ${
                      categoriaSeleccionada === c.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'border border-border hover:border-primary hover:bg-muted'
                    }`}
                  >
                    {c.emoji && <span className="mr-1">{c.emoji}</span>}
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Marca (en Card si categoría seleccionada) */}
            {categoriaSeleccionada && (
              <Card className="p-4 space-y-3 border-blue-200 bg-blue-50">
                <Label className="text-base font-medium">Marca</Label>

                {/* Marca seleccionada */}
                {marcaSeleccionada && marcaActual && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="gap-1">
                      {marcaActual.emoji && <span>{marcaActual.emoji}</span>}
                      <span>{marcaActual.nombre}</span>
                    </Badge>
                    <button
                      onClick={handleRemoveMarca}
                      className="ml-auto text-sm hover:text-red-600"
                      type="button"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* Marcas disponibles con scroll */}
                {!marcaSeleccionada && marcasDelCategoria.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Selecciona una marca:</Label>
                    <div className="max-h-20 overflow-x-auto flex gap-2 pb-2">
                      {marcasDelCategoria.map((marca) => (
                        <button
                          key={marca.id}
                          onClick={() => handleSelectMarca(marca)}
                          className="flex-shrink-0 px-3 py-1 rounded-full border border-blue-300 hover:bg-blue-100 text-base transition"
                          type="button"
                        >
                          {marca.emoji && <span className="mr-1">{marca.emoji}</span>}
                          {marca.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input para buscar/crear marca */}
                <div className="relative">
                  <Input
                    ref={inputMarcaRef}
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
                    disabled={marcaSeleccionada !== ''}
                  />

                  {showSuggestionsMarca && suggestionsMarca.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-10">
                      {suggestionsMarca.map((marca) => (
                        <button
                          key={marca.id}
                          onClick={() => handleSelectMarca(marca)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 text-base"
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

                <p className="text-sm text-muted-foreground">
                  Presiona <kbd className="px-2 py-1 bg-slate-100 rounded text-sm">ENTER</kbd> para crear nueva marca
                </p>
              </Card>
            )}

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto" className="font-medium">Monto</Label>
              <Input
                ref={montoRef}
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                required
                className="text-base"
              />
            </div>

            {/* Warning de presupuesto */}
            {presupuestoWarning?.excede && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  <p className="font-semibold mb-2">
                    ⚠️ INFORMATIVO: Excede el presupuesto del sobre &quot;{presupuestoWarning.sobre?.nombre}&quot; en ${presupuestoWarning.exceso.toFixed(2)} ({presupuestoWarning.porcentaje.toFixed(2)}%)
                  </p>
                  <p className="text-sm">
                    Podrás ingresar el gasto de todas maneras, es solo informativo
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Comentario */}
            <div className="space-y-2">
              <Label htmlFor="comentario" className="font-medium">Comentario (opcional)</Label>
              <Input
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ej: Almuerzo en la oficina"
                className="text-base"
              />
            </div>
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !sobreSeleccionado ||
              !categoriaSeleccionada ||
              !monto
            }
            className="w-full"
          >
            {loading ? 'Registrando...' : 'Registrar Gasto'}
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
