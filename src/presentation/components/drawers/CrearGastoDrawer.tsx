'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { EmojiPicker } from '@/components/inputs/EmojiPicker'
import { useCrearGasto } from '@/presentation/hooks/useTransacciones'
import { useCategoryContext } from '@/presentation/providers/category-context'
import {
  getMarcasCombinadas,
  filterMarcas,
  updateMarcasCache,
} from '@/infrastructure/utils/marcas-storage'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { X } from 'lucide-react'

const DEFAULT_CATEGORY_EMOJI = '📁'

interface Sobre {
  id: string
  nombre: string
  emoji?: string
  presupuesto_asignado: number
  gastado?: number
  is_compartido?: boolean
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 bg-primary rounded-full" />
      <h3 className="font-semibold typography-body-sm text-foreground">{children}</h3>
    </div>
  )
}

function SelectionBadge({
  emoji,
  label,
  onClear,
}: {
  emoji?: string
  label: string
  onClear: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-primary bg-primary/10 px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {emoji && <span className="text-lg">{emoji}</span>}
        <span className="text-foreground">{label}</span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-1 text-primary transition-colors hover:bg-primary/10"
        aria-label="Limpiar selección"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function CrearGastoDrawer({
  open,
  onOpenChange,
  userId,
  preselectedSobreId,
  preselectedCategoriaId,
  onSuccess,
}: CrearGastoDrawerProps) {
  const t = useTranslations()
  const { selectedCategoryId, setSelectedCategoryId } = useCategoryContext()
  const { decimales, formatNumber, simbolo } = useCurrency()
  const stepValue = decimales > 0 ? Number((1 / Math.pow(10, decimales)).toFixed(decimales)) : 1
  const placeholderValue = decimales > 0 ? (1 / Math.pow(10, decimales)).toFixed(decimales) : '0'

  const [loading, setLoading] = useState(false)
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [marcasGlobales, setMarcasGlobales] = useState<any[]>([])
  const [marcasVersion, setMarcasVersion] = useState<string>('')
  const [pais, setPais] = useState<string>('CL')

  const [sobreSeleccionado, setSobreSeleccionado] = useState<string>('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('')
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>('')
  const [inputMarca, setInputMarca] = useState('')
  const [marcasSugeridas, setMarcasSugeridas] = useState<any[]>([])
  const [monto, setMonto] = useState('')
  const [comentario, setComentario] = useState('')
  const [presupuestoWarning, setPresupuestoWarning] = useState<{
    excede: boolean
    sobre: Sobre | null
    exceso: number
    porcentaje: number
  } | null>(null)

  const [crearCategoriaMode, setCrearCategoriaMode] = useState(false)
  const [nuevaCategoriaName, setNuevaCategoriaName] = useState('')
  const [nuevaCategoriaEmoji, setNuevaCategoriaEmoji] = useState(DEFAULT_CATEGORY_EMOJI)
  const [creandoCategoria, setCreandoCategoria] = useState(false)

  const [crearMarcaMode, setCrearMarcaMode] = useState(false)

  const montoRef = useRef<HTMLInputElement>(null)
  const inputMarcaRef = useRef<HTMLInputElement>(null)

  const { crearGasto } = useCrearGasto()

  useEffect(() => {
    if (open) {
      fetchData()
      setSobreSeleccionado(preselectedSobreId || '')
      const categoryToSet = selectedCategoryId || preselectedCategoriaId || ''
      setCategoriaSeleccionada(categoryToSet)
      setMarcaSeleccionada('')
      setInputMarca('')
      setMonto('')
      setComentario('')
      setPresupuestoWarning(null)
      setCrearCategoriaMode(false)
      setCrearMarcaMode(false)
      setNuevaCategoriaName('')
      setNuevaCategoriaEmoji(DEFAULT_CATEGORY_EMOJI)

      if (preselectedSobreId) {
        fetchCategoriasBySobre(preselectedSobreId)
      }
    }
  }, [open, preselectedSobreId, preselectedCategoriaId, selectedCategoryId])

  const fetchData = async () => {
    try {
      const [sobresRes, configRes] = await Promise.all([
        fetch('/api/sobres'),
        fetch('/api/user/config'),
      ])

      if (sobresRes.ok) {
        const data = await sobresRes.json()
        setSobres(data.sobres || [])
      }
      if (configRes.ok) {
        const configData = await configRes.json()
        const paisCode = configData.config?.pais || configData.config?.locale?.split('-')[1]?.toUpperCase() || 'CL'
        setPais(paisCode)
        setMarcasVersion(configData.marcasGlobalesVersion || '')
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      notify.error('Error al cargar formulario')
    }
  }

  useEffect(() => {
    if (sobreSeleccionado) {
      fetchCategoriasBySobre(sobreSeleccionado)
    }
  }, [sobreSeleccionado])

  // Cargar marcas globales cuando se abre el drawer o cambian las marcas
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

  const fetchCategoriasBySobre = async (sobreId: string) => {
    try {
      const response = await fetch(`/api/sobres/${sobreId}/categorias`)
      if (response.ok) {
        const data = await response.json()
        const categoriasList = data.categorias || []
        setCategorias(categoriasList)

        // Cargar marcas de cada categoría del sobre
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
      }
    } catch (error) {
      console.error('Error fetching categorías del sobre:', error)
    }
  }

  const handleSelectMarca = (marca: Marca) => {
    setMarcaSeleccionada(marca.id)
    setInputMarca('')
    setMarcasSugeridas([])
  }

  const handleSelectMarcaSugerida = async (marca: any) => {
    // Si es marca global, crear copia en tabla personal
    if (marca.isGlobal) {
      await crearYAgregarMarca(marca.nombre, marca.emoji)
    } else {
      // Si es marca personal, seleccionarla directamente
      setMarcaSeleccionada(marca.id)
      setInputMarca('')
      setMarcasSugeridas([])
    }
  }

  const handleRemoveMarca = () => {
    setMarcaSeleccionada('')
    setInputMarca('')
    setMarcasSugeridas([])
  }

  // Filtrar marcas mientras escribe
  const handleInputMarcaChange = (value: string) => {
    setInputMarca(value)

    if (!value.trim()) {
      setMarcasSugeridas([])
      return
    }

    // Filtrar marcas (personales + globales)
    const sugerencias = filterMarcas(value, marcas, marcasGlobales, categoriaSeleccionada)
    setMarcasSugeridas(sugerencias.slice(0, 5)) // Mostrar solo 5 sugerencias
  }

  const handleKeyDownMarca = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmedValue = inputMarca.trim()
    if (!trimmedValue || !categoriaSeleccionada) return

    const existe = marcas.find(
      (m) =>
        m.categoria_id === categoriaSeleccionada &&
        m.nombre.toLowerCase() === trimmedValue.toLowerCase(),
    )

    if (existe) {
      handleSelectMarca(existe)
      setCrearMarcaMode(false)
      return
    }

    await crearYAgregarMarca(trimmedValue)
  }

  const crearYAgregarMarca = async (nombre: string, emoji?: string) => {
    if (!categoriaSeleccionada) {
      notify.error('Selecciona una categoría primero')
      return
    }

    if (!nombre.trim()) {
      notify.error('Ingresa el nombre de la marca')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/subcategorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          categoriaId: categoriaSeleccionada,
          emoji: emoji,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear marca')
      }

      const data = await response.json()
      const nuevaMarca = data.subcategoria

      setMarcas((prev) => [...prev, nuevaMarca])
      setMarcaSeleccionada(nuevaMarca.id)
      setInputMarca('')
      setMarcasSugeridas([])
      setCrearMarcaMode(false)

      // Actualizar cache de IndexedDB
      await updateMarcasCache(marcasGlobales, [...marcas, nuevaMarca], marcasVersion, pais)

      notify.success(`Marca "${nombre}" creada`)
    } catch (error: any) {
      notify.error(error.message || 'Error al crear marca')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nuevaCategoriaName.trim()) {
      notify.error('Ingresa el nombre de la categoría')
      return
    }

    if (!sobreSeleccionado) {
      notify.error('Selecciona un sobre')
      return
    }

    setCreandoCategoria(true)
    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevaCategoriaName.trim(),
          ...(nuevaCategoriaEmoji ? { emoji: nuevaCategoriaEmoji } : {}),
          sobreId: sobreSeleccionado,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear categoría')
      }

      const data = await response.json()
      const nuevaCategoria = data.categoria

      setCategorias((prev) => [...prev, nuevaCategoria])
      setCategoriaSeleccionada(nuevaCategoria.id)
      setCrearCategoriaMode(false)
      setNuevaCategoriaName('')
      setNuevaCategoriaEmoji(DEFAULT_CATEGORY_EMOJI)
      notify.success(`Categoría "${nuevaCategoriaName}" creada`)
    } catch (error: any) {
      notify.error(error.message || 'Error al crear categoría')
    } finally {
      setCreandoCategoria(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!sobreSeleccionado) {
        notify.error(t('gastos.create.errors.selectEnvelope'))
        setLoading(false)
        return
      }
      if (!categoriaSeleccionada) {
        notify.error(t('gastos.create.errors.categoryRequired'))
        setLoading(false)
        return
      }
      if (!monto || parseFloat(monto) <= 0) {
        notify.error(t('gastos.create.errors.amountGreaterThanZero'))
        setLoading(false)
        return
      }

      let monedaId = ''

      try {
        const configRes = await fetch('/api/user/config')
        if (configRes.ok) {
          const configData = await configRes.json()
          monedaId = configData.config?.moneda_principal_id || ''
        }
      } catch (error) {
        console.error('Error fetching user config:', error)
      }

      if (!monedaId) {
        notify.error(
          'No se encontró moneda configurada. Por favor completa el onboarding.',
        )
        setLoading(false)
        return
      }

      const gastoData = {
        monto: parseFloat(monto),
        monedaId: monedaId,
        tipo: 'GASTO',
        descripcion: comentario || undefined,
        fecha: new Date().toISOString(),
        sobreId: sobreSeleccionado,
        categoriaId: categoriaSeleccionada,
        subcategoriaId: marcaSeleccionada || undefined,
      }

      const result = await crearGasto(gastoData)

      notify.success('Gasto registrado correctamente')

      if (result.warning) {
        notify.warning(`${result.warning.type}: ${result.warning.message}`)
      }

      setSelectedCategoryId(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      notify.error(err.message || 'Error al registrar gasto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (monto && sobreSeleccionado) {
      const sobreActual = sobres.find((s) => s.id === sobreSeleccionado)
      if (sobreActual) {
        const montoNum = parseFloat(monto)
        const presupuesto = Number(sobreActual.presupuesto_asignado) || 0
        const gastado = Number(sobreActual.gastado) || 0
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

  useEffect(() => {
    setMarcaSeleccionada('')
    setCrearMarcaMode(false)
    setInputMarca('')
    setMarcasSugeridas([])
  }, [categoriaSeleccionada])

  const sobreActual = sobres.find((s) => s.id === sobreSeleccionado)
  const marcasDelCategoria = categoriaSeleccionada
    ? marcas.filter((m) => m.categoria_id === categoriaSeleccionada)
    : []
  const categoriasOrdenadas = [...categorias].sort((a, b) => {
    const gastadoA = Number(a.gastado) || 0
    const gastadoB = Number(b.gastado) || 0
    return gastadoB - gastadoA
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95dvh]">
        <DrawerHeader>
          <DrawerTitle>{t('gastos.create.title')}</DrawerTitle>
          <DrawerDescription>
            {t('gastos.create.description')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="pt-0 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ORIGEN */}
            <div className="space-y-3">
              <SectionTitle>{t('gastos.create.origin')}</SectionTitle>

              <Card className="p-4 space-y-4 bg-card-elevated">
                {/* Sobre */}
                <div className="space-y-2">
                  <Label
                    htmlFor="sobre"
                    className="typography-label text-muted-foreground"
                  >
                    {t('gastos.create.originPlaceholder')}
                  </Label>
                  {sobres.length === 1 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <span className="typography-body-lg">{sobreActual?.emoji}</span>
                      <span className="font-medium">
                        {sobreActual?.nombre}
                      </span>
                    </div>
                  ) : (
                    <Select
                      value={sobreSeleccionado}
                      onValueChange={setSobreSeleccionado}
                    >
                      <SelectTrigger id="sobre" className="h-11">
                        <SelectValue
                          placeholder={t(
                            'gastos.create.selectEnvelopePlaceholder',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sobres.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2 w-full">
                              <span>{s.emoji}</span>
                              <span className="flex-1">{s.nombre}</span>
                              {s.is_compartido && (
                                <span className="text-xs text-muted-foreground">(Compartido)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

              {/* Categoría */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="typography-label text-muted-foreground">
                    {t('gastos.create.category')}
                  </Label>
                  {!crearCategoriaMode && (
                    <button
                      type="button"
                      onClick={() => setCrearCategoriaMode(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {t('gastos.create.addNewCategory')}
                    </button>
                  )}
                </div>

                {crearCategoriaMode && (
                  <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-muted space-y-3">
                    <div className="flex gap-2 items-end">
                      <Input
                        type="text"
                        placeholder={t(
                          'gastos.create.categoryNamePlaceholder',
                        )}
                        value={nuevaCategoriaName}
                        onChange={(e) =>
                          setNuevaCategoriaName(e.target.value)
                        }
                        className="h-10 flex-1"
                        autoFocus
                      />
                      <EmojiPicker
                        value={nuevaCategoriaEmoji}
                        onChange={setNuevaCategoriaEmoji}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleCreateCategoria}
                        disabled={
                          creandoCategoria || !nuevaCategoriaName.trim()
                        }
                        className="flex-1 h-10"
                        size="sm"
                      >
                        {creandoCategoria
                          ? t('common.loading')
                          : t('gastos.create.addNewCategory')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setCrearCategoriaMode(false)
                          setNuevaCategoriaName('')
                          setNuevaCategoriaEmoji(DEFAULT_CATEGORY_EMOJI)
                        }}
                        className="h-10 px-3"
                        size="sm"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}

                {categoriaSeleccionada ? (
                  (() => {
                    const categoriaActiva = categoriasOrdenadas.find(
                      (c) => c.id === categoriaSeleccionada,
                    )
                    if (!categoriaActiva) return null
                    return (
                      <SelectionBadge
                        emoji={categoriaActiva.emoji}
                        label={categoriaActiva.nombre}
                        onClear={() => {
                          setCategoriaSeleccionada('')
                          setMarcaSeleccionada('')
                        }}
                      />
                    )
                  })()
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categoriasOrdenadas.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoriaSeleccionada(c.id)}
                        className="min-h-[44px] w-full rounded-xl border border-transparent bg-muted px-3 py-2 text-left text-sm font-medium leading-tight text-foreground transition-all hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          {c.emoji && <span className="text-lg">{c.emoji}</span>}
                          <span className="flex-1">{c.nombre}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

            {/* DETALLE */}
            <div className="space-y-3">
              <SectionTitle>{t('gastos.create.details')}</SectionTitle>

              <Card className="p-4 space-y-4 bg-card-elevated">
              {categoriaSeleccionada && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="typography-label text-muted-foreground">
                      {t('gastos.create.brand')}
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setCrearMarcaMode((prev) => !prev)
                        setInputMarca('')
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {crearMarcaMode
                        ? t('common.cancel')
                        : t('gastos.create.addNewBrand')}
                    </button>
                  </div>

                  {/* Grid de marcas existentes */}
                  {marcaSeleccionada ? (
                    (() => {
                      const marcaActiva = marcasDelCategoria.find(
                        (marca) => marca.id === marcaSeleccionada,
                      )
                      if (!marcaActiva) return null
                      return (
                        <SelectionBadge
                          emoji={marcaActiva.emoji}
                          label={marcaActiva.nombre}
                          onClear={handleRemoveMarca}
                        />
                      )
                    })()
                  ) : (
                    marcasDelCategoria.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {marcasDelCategoria.map((marca) => (
                          <button
                            key={marca.id}
                            type="button"
                            onClick={() => handleSelectMarca(marca)}
                            className="min-h-[44px] w-full rounded-xl border border-transparent bg-muted px-3 py-2 text-left text-sm font-medium leading-tight text-foreground transition-all hover:bg-muted/80"
                          >
                            <div className="flex items-center gap-2">
                              {marca.emoji && <span className="text-lg">{marca.emoji}</span>}
                              <span className="flex-1">{marca.nombre}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  )}

                  {/* Crear nueva marca */}
                  {crearMarcaMode && (
                    <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-muted space-y-2">
                      <div className="relative">
                        <Input
                          ref={inputMarcaRef}
                          type="text"
                          placeholder={t('gastos.create.brandPlaceholder')}
                          value={inputMarca}
                          onChange={(e) => handleInputMarcaChange(e.target.value)}
                          onKeyDown={handleKeyDownMarca}
                          className="h-10"
                          autoFocus
                        />
                        {/* Sugerencias de autocompletado */}
                        {marcasSugeridas.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                            {marcasSugeridas.map((sugerencia, idx) => (
                              <button
                                key={`${sugerencia.id}-${idx}`}
                                type="button"
                                onClick={() => handleSelectMarcaSugerida(sugerencia)}
                                className="w-full flex items-center gap-2 px-3 py-2 typography-body-sm hover:bg-muted transition-colors text-left"
                              >
                                {sugerencia.emoji && (
                                  <span className="typography-body">{sugerencia.emoji}</span>
                                )}
                                <span className="flex-1">{sugerencia.nombre}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 px-3"
                          disabled={loading || !inputMarca.trim()}
                          onClick={() => crearYAgregarMarca(inputMarca)}
                        >
                          {t('gastos.create.addNewBrand')}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {t('gastos.create.pressEnter')}{' '}
                        <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">
                          Enter
                        </kbd>
                      </p>
                    </div>
                  )}

                </div>
              )}

              {!categoriaSeleccionada && (
                <p className="typography-body-sm text-muted-foreground italic">
                  {t('gastos.create.selectCategoryForBrands')}
                </p>
              )}
            </Card>
          </div>

            {/* MONTO + OBSERVACIÓN */}
            <Card className="p-5 bg-card-accent border-primary/20 space-y-4">
              <div className="space-y-3">
                <Label
                  htmlFor="monto"
                className="typography-label-lg"
              >
                {t('gastos.create.amount')}
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 typography-h2 text-muted-foreground">
                  {simbolo ?? ''}
                </span>
                <Input
                  ref={montoRef}
                  id="monto"
                  type="number"
                  step={stepValue}
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder={placeholderValue}
                  required
                  className="pl-10 typography-h2 h-14 bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="comentario"
                  className="typography-label text-muted-foreground"
                >
                  {t('gastos.create.comment')}
                </Label>
                <span className="typography-metadata">
                  {t('gastos.create.commentOptional')}
                </span>
              </div>
              <Input
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={t('gastos.create.commentPlaceholder')}
                className="h-10 bg-background"
              />
            </div>

            {presupuestoWarning?.excede && (
              <Alert className="mt-2 border-border bg-muted">
                <AlertDescription className="text-foreground">
                  <p className="font-medium">
                    ⚠️ Excede el presupuesto en {formatNumber(presupuestoWarning.exceso)}
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Sobre &quot;{presupuestoWarning.sobre?.nombre}&quot; •{' '}
                    {presupuestoWarning.porcentaje.toFixed(1)}% sobre el
                    límite
                  </p>
                </AlertDescription>
              </Alert>
              )}
            </Card>
          </form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/30">
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !sobreSeleccionado ||
              !categoriaSeleccionada ||
              !monto
            }
            className="w-full h-12 typography-label-lg"
          >
            {loading ? t('gastos.create.creating') : t('gastos.create.submit')}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" disabled={loading} className="w-full">
              {t('common.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
