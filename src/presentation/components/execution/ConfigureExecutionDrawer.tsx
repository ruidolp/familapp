'use client'

/**
 * ConfigureExecutionDrawer Component
 *
 * Initial configuration drawer before starting a shopping execution
 * Allows user to configure:
 * - Register in budgets (sobre + category + brand)
 * - Referential budget
 * - Price input setting
 * - Categories view setting
 * - Timer setting
 */

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/presentation/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/presentation/components/ui/sheet'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Switch } from '@/presentation/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Card } from '@/presentation/components/ui/card'
import { DollarSign, Tag, Store } from 'lucide-react'
import { notify } from '@/infrastructure/lib/notifications'
import {
  getPreferences,
  savePreferences,
  type ExecutionConfigPreferences,
} from '@/infrastructure/utils/user-preferences'

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
}

interface Subcategoria {
  id: string
  nombre: string
  emoji?: string
  categoria_id: string
}

export interface ExecutionConfig {
  registerInBudget: boolean
  sobre_id?: string
  categoria_id?: string
  subcategoria_id?: string
  store_name?: string
  budgetEnabled: boolean
  budgetAmount?: number
  enablePrices: boolean
  showCategories: boolean
  showTimer: boolean
}

interface ConfigureExecutionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onConfirm: (config: ExecutionConfig) => void
}

export function ConfigureExecutionDrawer({
  open,
  onOpenChange,
  userId,
  onConfirm,
}: ConfigureExecutionDrawerProps) {
  const [loading, setLoading] = useState(false)

  // Data
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])

  // Configuration state
  const [registerInBudget, setRegisterInBudget] = useState(false)
  const [sobreId, setSobreId] = useState<string>('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [subcategoriaId, setSubcategoriaId] = useState<string>('')
  const [storeName, setStoreName] = useState('')

  const [budgetEnabled, setBudgetEnabled] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('')

  // UI preferences - Initialize with defaults (will be loaded from IndexedDB)
  const [enablePrices, setEnablePrices] = useState(true)
  const [showCategories, setShowCategories] = useState(true)
  const [showTimer, setShowTimer] = useState(true)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  // Create subcategoria inline
  const [newSubcategoriaName, setNewSubcategoriaName] = useState('')
  const [creatingSubcategoria, setCreatingSubcategoria] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Load preferences from IndexedDB on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      const defaults: ExecutionConfigPreferences = {
        enablePrices: true,
        showCategories: true,
        showTimer: true,
      }
      const prefs = await getPreferences('executionConfig', defaults)
      setEnablePrices(prefs.enablePrices)
      setShowCategories(prefs.showCategories)
      setShowTimer(prefs.showTimer)
      setPreferencesLoaded(true)
    }
    loadUserPreferences()
  }, [])

  // Load sobres on mount
  useEffect(() => {
    if (open && userId) {
      loadSobres()
    }
  }, [open, userId])

  // Load categories when sobre changes
  useEffect(() => {
    if (sobreId) {
      loadCategoriasBySobre(sobreId)
    } else {
      setCategorias([])
    }
  }, [sobreId])

  // Load subcategorias when categoria changes
  useEffect(() => {
    if (categoriaId) {
      loadSubcategoriasByCategoria(categoriaId)
    } else {
      setSubcategorias([])
    }
  }, [categoriaId])

  // Auto-find "Supermercado" category and select first sobre
  useEffect(() => {
    if (registerInBudget && sobres.length > 0 && !sobreId) {
      // Select first sobre
      setSobreId(sobres[0].id)
    }
  }, [registerInBudget, sobres, sobreId])

  useEffect(() => {
    if (categorias.length > 0 && !categoriaId) {
      // Try to find "Supermercado" category
      const supermercado = categorias.find(
        c => c.nombre.toLowerCase().includes('supermercado')
      )
      if (supermercado) {
        setCategoriaId(supermercado.id)
      }
    }
  }, [categorias, categoriaId])

  // Save UI preferences to IndexedDB when they change (only after initial load)
  useEffect(() => {
    if (preferencesLoaded) {
      savePreferences('executionConfig', {
        enablePrices,
        showCategories,
        showTimer,
      })
    }
  }, [enablePrices, showCategories, showTimer, preferencesLoaded])

  const loadSobres = async () => {
    try {
      const response = await fetch('/api/sobres')
      if (response.ok) {
        const data = await response.json()
        setSobres(data.sobres || [])
      }
    } catch (error) {
      console.error('Error loading sobres:', error)
    }
  }

  const loadCategoriasBySobre = async (sobreId: string) => {
    try {
      const response = await fetch(`/api/sobres/${sobreId}/categorias`)
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.categorias || [])
      }
    } catch (error) {
      console.error('Error loading categorias:', error)
    }
  }

  const loadSubcategoriasByCategoria = async (categoriaId: string) => {
    try {
      const response = await fetch(`/api/categorias/${categoriaId}/subcategorias`)
      if (response.ok) {
        const data = await response.json()
        setSubcategorias(data.subcategorias || [])
      }
    } catch (error) {
      console.error('Error loading subcategorias:', error)
    }
  }

  const handleCreateSubcategoria = async () => {
    if (!newSubcategoriaName.trim() || !categoriaId) return

    setCreatingSubcategoria(true)
    try {
      const response = await fetch('/api/subcategorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newSubcategoriaName.trim(),
          categoriaId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear marca')
      }

      const data = await response.json()
      const nuevaSubcategoria = data.subcategoria

      setSubcategorias([...subcategorias, nuevaSubcategoria])
      setSubcategoriaId(nuevaSubcategoria.id)
      setStoreName(nuevaSubcategoria.nombre)
      setNewSubcategoriaName('')

      notify.success(`Marca "${nuevaSubcategoria.nombre}" creada`)
    } catch (error: any) {
      notify.error(error.message || 'Error al crear marca')
    } finally {
      setCreatingSubcategoria(false)
    }
  }

  const handleConfirm = () => {
    // Validate
    if (registerInBudget && !sobreId) {
      notify.error('Selecciona un sobre')
      return
    }

    if (registerInBudget && !categoriaId) {
      notify.error('Selecciona una categoría')
      return
    }

    if (registerInBudget && !subcategoriaId && !storeName) {
      notify.error('Selecciona o crea una marca/tienda')
      return
    }

    if (budgetEnabled && !budgetAmount) {
      notify.error('Ingresa el presupuesto referencial')
      return
    }

    const config: ExecutionConfig = {
      registerInBudget,
      sobre_id: registerInBudget ? sobreId : undefined,
      categoria_id: registerInBudget ? categoriaId : undefined,
      subcategoria_id: registerInBudget ? subcategoriaId : undefined,
      store_name: registerInBudget ? storeName : undefined,
      budgetEnabled,
      budgetAmount: budgetEnabled ? parseFloat(budgetAmount) : undefined,
      enablePrices,
      showCategories,
      showTimer,
    }

    onConfirm(config)
    onOpenChange(false)
  }

  // Update store name when subcategoria changes
  useEffect(() => {
    if (subcategoriaId) {
      const sub = subcategorias.find(s => s.id === subcategoriaId)
      if (sub) {
        setStoreName(sub.nombre)
      }
    }
  }, [subcategoriaId, subcategorias])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-[92vh] flex-col overflow-hidden sm:max-w-[480px]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-semibold">Configurar compra</SheetTitle>
          <SheetDescription>Prepara la compra antes de iniciar el conteo.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto py-5">
          <Card className="mx-1 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Presupuesto</p>
                <p className="text-sm text-foreground">¿Registrar en sobres?</p>
                <p className="text-xs text-muted-foreground">Asocia la compra a un sobre y categoría.</p>
              </div>
              <Switch checked={registerInBudget} onCheckedChange={setRegisterInBudget} />
            </div>

            {registerInBudget && (
              <div className="space-y-4 rounded-xl bg-muted/40 p-3">
                <div className="space-y-2">
                  <Label htmlFor="sobre" className="text-xs uppercase text-muted-foreground">
                    Sobre
                  </Label>
                  <Select value={sobreId} onValueChange={setSobreId}>
                    <SelectTrigger id="sobre">
                      <SelectValue placeholder="Selecciona sobre" />
                    </SelectTrigger>
                    <SelectContent>
                      {sobres.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.emoji} {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {sobreId && (
                  <div className="space-y-2">
                    <Label htmlFor="categoria" className="text-xs uppercase text-muted-foreground">
                      Categoría
                    </Label>
                    <Select value={categoriaId} onValueChange={setCategoriaId}>
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.emoji} {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {categoriaId && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                      <Store className="h-3.5 w-3.5" /> Marca / Tienda
                    </Label>
                    {subcategorias.length > 0 && (
                      <Select value={subcategoriaId} onValueChange={setSubcategoriaId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tienda" />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategorias.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.emoji} {s.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        placeholder="Crear nueva marca"
                        value={newSubcategoriaName}
                        onChange={e => setNewSubcategoriaName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateSubcategoria()
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        disabled={!newSubcategoriaName.trim() || creatingSubcategoria}
                        onClick={handleCreateSubcategoria}
                      >
                        {creatingSubcategoria ? 'Creando...' : 'Agregar'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="mx-1 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Presupuesto referencial</p>
                <p className="text-sm text-foreground">Control visual del gasto</p>
              </div>
              <Switch checked={budgetEnabled} onCheckedChange={setBudgetEnabled} />
            </div>

            {budgetEnabled && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" /> Monto objetivo
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Ej: 25000"
                  value={budgetAmount}
                  onChange={e => setBudgetAmount(e.target.value)}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Es solo informativo; no detendrá la compra.
                </p>
              </div>
            )}
          </Card>

          <Card className="mx-1 space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Agregar precios</p>
                <p className="text-xs text-muted-foreground">Registra el precio de cada producto.</p>
              </div>
              <Switch checked={enablePrices} onCheckedChange={setEnablePrices} />
            </div>
            <p className="text-xs text-muted-foreground">
              Las vistas y el cronómetro se pueden ajustar directamente durante la compra.
            </p>
          </Card>
        </div>

        <div className="border-t bg-background p-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Iniciar compra
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
