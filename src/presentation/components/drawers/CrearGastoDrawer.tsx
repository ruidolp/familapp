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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 bg-primary rounded-full" />
      <h3 className="font-semibold text-sm text-foreground">{children}</h3>
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

  const [crearCategoriaMode, setCrearCategoriaMode] = useState(false)
  const [nuevaCategoriaName, setNuevaCategoriaName] = useState('')
  const [nuevaCategoriaEmoji, setNuevaCategoriaEmoji] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)

  const montoRef = useRef<HTMLInputElement>(null)
  const inputMarcaRef = useRef<HTMLInputElement>(null)
  useInputFocus(montoRef, 350)

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

      if (preselectedSobreId) {
        fetchCategoriasBySobre(preselectedSobreId)
      }
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

  useEffect(() => {
    if (sobreSeleccionado) {
      fetchCategoriasBySobre(sobreSeleccionado)
    }
  }, [sobreSeleccionado])

  const fetchCategoriasBySobre = async (sobreId: string) => {
    try {
      const response = await fetch(`/api/sobres/${sobreId}/categorias`)
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.categorias || [])
      }
    } catch (error) {
      console.error('Error fetching categorías del sobre:', error)
    }
  }

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

  const handleSelectMarca = (marca: Marca) => {
    setMarcaSeleccionada(marca.id)
    setInputMarca('')
    setSuggestionsMarca([])
    setShowSuggestionsMarca(false)
    inputMarcaRef.current?.focus()
  }

  const handleRemoveMarca = () => {
    setMarcaSeleccionada('')
    setInputMarca('')
  }

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
          emoji: nuevaCategoriaEmoji || '📁',
          sobreId: sobreSeleccionado,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear categoría')
      }

      const data = await response.json()
      const nuevaCategoria = data.categoria

      setCategorias([...categorias, nuevaCategoria])
      setCategoriaSeleccionada(nuevaCategoria.id)
      setCrearCategoriaMode(false)
      setNuevaCategoriaName('')
      setNuevaCategoriaEmoji('')
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
        notify.error('No se encontró moneda configurada. Por favor completa el onboarding.')
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

  const sobreActual = sobres.find((s) => s.id === sobreSeleccionado)
  const marcasDelCategoria = categoriaSeleccionada
    ? marcas.filter((m) => m.categoria_id === categoriaSeleccionada)
    : []
  const marcaActual = marcas.find((m) => m.id === marcaSeleccionada)

  const categoriasOrdenadas = [...categorias].sort((a, b) => {
    const gastadoA = Number(a.gastado) || 0
    const gastadoB = Number(b.gastado) || 0
    return gastadoB - gastadoA
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('gastos.create.title')}</DrawerTitle>
          <DrawerDescription>
            {t('gastos.create.description')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* MONTO - Card Accent (destacada) */}
            <Card className="p-5 bg-card-accent border-primary/20">
              <div className="space-y-3">
                <Label htmlFor="monto" className="text-base font-semibold">
                  {t('gastos.create.amount')}
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                    $
                  </span>
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
                    className="pl-10 text-2xl font-semibold h-14 bg-background"
                  />
                </div>
              </div>

              {presupuestoWarning?.excede && (
                <Alert className="mt-4 border-border bg-muted">
                  <AlertDescription className="text-foreground">
                    <p className="font-medium">
                      ⚠️ Excede el presupuesto en ${presupuestoWarning.exceso.toFixed(2)}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Sobre &quot;{presupuestoWarning.sobre?.nombre}&quot; • {presupuestoWarning.porcentaje.toFixed(1)}% sobre el límite
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            {/* ORIGEN */}
            <div className="space-y-3">
              <SectionTitle>{t('gastos.create.origin')}</SectionTitle>

              <Card className="p-4 space-y-4 bg-card-elevated">
                {/* Sobre */}
                <div className="space-y-2">
                  <Label htmlFor="sobre" className="text-sm font-medium text-muted-foreground">
                    {t('gastos.create.originPlaceholder')}
                  </Label>
                  {sobres.length === 1 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <span className="text-lg">{sobreActual?.emoji}</span>
                      <span className="font-medium">{sobreActual?.nombre}</span>
                    </div>
                  ) : (
                    <Select value={sobreSeleccionado} onValueChange={setSobreSeleccionado}>
                      <SelectTrigger id="sobre" className="h-11">
                        <SelectValue placeholder={t('gastos.create.selectEnvelopePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {sobres.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="flex items-center gap-2">
                              <span>{s.emoji}</span>
                              <span>{s.nombre}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Categoría */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">
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
                      <Input
                        type="text"
                        placeholder={t('gastos.create.categoryNamePlaceholder')}
                        value={nuevaCategoriaName}
                        onChange={(e) => setNuevaCategoriaName(e.target.value)}
                        className="h-10"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder={t('gastos.create.categoryEmoji')}
                          value={nuevaCategoriaEmoji}
                          onChange={(e) => setNuevaCategoriaEmoji(e.target.value)}
                          className="w-16 h-10 text-center"
                          maxLength={2}
                        />
                        <Button
                          type="button"
                          onClick={handleCreateCategoria}
                          disabled={creandoCategoria || !nuevaCategoriaName.trim()}
                          className="flex-1 h-10"
                          size="sm"
                        >
                          {creandoCategoria ? t('common.loading') : t('common.cancel')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setCrearCategoriaMode(false)
                            setNuevaCategoriaName('')
                            setNuevaCategoriaEmoji('')
                          }}
                          className="h-10 px-3"
                          size="sm"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {categoriasOrdenadas.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoriaSeleccionada(c.id)}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${categoriaSeleccionada === c.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                          }
                        `}
                      >
                        {c.emoji && <span className="mr-1.5">{c.emoji}</span>}
                        {c.nombre}
                      </button>
                    ))}
                  </div>
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
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('gastos.create.brand')}
                      </Label>
                      <span className="text-xs text-muted-foreground">{t('gastos.create.brandOptional')}</span>
                    </div>

                    {marcaSeleccionada && marcaActual && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                        <Badge variant="secondary" className="gap-1.5">
                          {marcaActual.emoji && <span>{marcaActual.emoji}</span>}
                          <span>{marcaActual.nombre}</span>
                        </Badge>
                        <button
                          onClick={handleRemoveMarca}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          type="button"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}

                    {!marcaSeleccionada && marcasDelCategoria.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                          {marcasDelCategoria.slice(0, 8).map((marca) => (
                            <button
                              key={marca.id}
                              onClick={() => handleSelectMarca(marca)}
                              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                              type="button"
                            >
                              {marca.emoji && <span className="mr-1">{marca.emoji}</span>}
                              {marca.nombre}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!marcaSeleccionada && (
                      <div className="relative">
                        <Input
                          ref={inputMarcaRef}
                          type="text"
                          placeholder={t('gastos.create.brandPlaceholder')}
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
                          enterKeyHint="go"
                          className="h-10"
                        />

                        {showSuggestionsMarca && suggestionsMarca.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-popover shadow-lg z-10 overflow-hidden">
                            {suggestionsMarca.map((marca) => (
                              <button
                                key={marca.id}
                                onClick={() => handleSelectMarca(marca)}
                                className="w-full text-left px-3 py-2.5 hover:bg-muted flex items-center gap-2 text-sm transition-colors"
                                type="button"
                              >
                                <span className="text-primary">✓</span>
                                {marca.emoji && <span>{marca.emoji}</span>}
                                <span>{marca.nombre}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!marcaSeleccionada && (
                      <p className="text-xs text-muted-foreground">
                        {t('gastos.create.pressEnter')} <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd>
                      </p>
                    )}
                  </div>
                )}

                {!categoriaSeleccionada && (
                  <p className="text-sm text-muted-foreground italic">
                    {t('gastos.create.selectCategoryForBrands')}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="comentario" className="text-sm font-medium text-muted-foreground">
                      {t('gastos.create.comment')}
                    </Label>
                    <span className="text-xs text-muted-foreground">{t('gastos.create.commentOptional')}</span>
                  </div>
                  <Input
                    id="comentario"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder={t('gastos.create.commentPlaceholder')}
                    className="h-10"
                  />
                </div>
              </Card>
            </div>
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
            className="w-full h-12 text-base font-semibold"
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
