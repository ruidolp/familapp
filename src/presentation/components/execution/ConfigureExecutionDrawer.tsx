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
import { useTranslations } from 'next-intl'
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
import { DollarSign, Store } from 'lucide-react'
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
  const t = useTranslations('shopping.execution.configure')
  const commonT = useTranslations('common')

  // Data
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])

  // Configuration state
  const [registerInBudget, setRegisterInBudget] = useState(true)
  const [sobreId, setSobreId] = useState<string>('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [subcategoriaId, setSubcategoriaId] = useState<string>('')
  const [storeName, setStoreName] = useState('')

  const [budgetEnabled, setBudgetEnabled] = useState(true)
  const [budgetAmount, setBudgetAmount] = useState('')

  // UI preferences - Initialize with defaults (will be loaded from IndexedDB)
  const [enablePrices, setEnablePrices] = useState(true)
  const [showCategories, setShowCategories] = useState(true)
  const [showTimer, setShowTimer] = useState(true)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  // Create subcategoria inline
  const [newSubcategoriaName, setNewSubcategoriaName] = useState('')
  const [creatingSubcategoria, setCreatingSubcategoria] = useState(false)
  const [showCreateBrand, setShowCreateBrand] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const getDefaultSobreId = () => {
    const hogarSobre = sobres.find(s => s.nombre?.toLowerCase().includes('hogar'))
    return hogarSobre?.id || sobres[0]?.id || ''
  }

  const getDefaultCategoriaId = () => {
    const defaultCategoria =
      categorias.find(c => c.nombre?.toLowerCase().includes('supermercado')) || categorias[0]
    return defaultCategoria?.id || ''
  }

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
      setCategoriaId('')
      setSubcategoriaId('')
      setStoreName('')
      loadCategoriasBySobre(sobreId)
    } else {
      setCategorias([])
      setCategoriaId('')
      setSubcategorias([])
      setStoreName('')
    }
  }, [sobreId])

  // Load subcategorias when categoria changes
  useEffect(() => {
    if (categoriaId) {
      setSubcategoriaId('')
      setStoreName('')
      setShowCreateBrand(false)
      loadSubcategoriasByCategoria(categoriaId)
    } else {
      setSubcategorias([])
      setSubcategoriaId('')
      setStoreName('')
      setShowCreateBrand(false)
    }
  }, [categoriaId])

  // Auto-find "Hogar" sobre + "Supermercado" categoría
  useEffect(() => {
    if (sobres.length > 0 && !sobreId) {
      const defaultSobreId = getDefaultSobreId()
      if (defaultSobreId) {
        setSobreId(defaultSobreId)
      }
    }
  }, [sobres, sobreId])

  useEffect(() => {
    if (!registerInBudget && sobres.length > 0) {
      const defaultSobreId = getDefaultSobreId()
      if (defaultSobreId && defaultSobreId !== sobreId) {
        setSobreId(defaultSobreId)
      }
    }
  }, [registerInBudget, sobres, sobreId])

  useEffect(() => {
    if (categorias.length > 0 && !categoriaId) {
      const defaultCategoriaId = getDefaultCategoriaId()
      if (defaultCategoriaId) {
        setCategoriaId(defaultCategoriaId)
      }
    }
  }, [categorias, categoriaId])

  useEffect(() => {
    if (!registerInBudget) {
      setShowCreateBrand(false)
      setNewSubcategoriaName('')
    }
  }, [registerInBudget])

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

  const loadSubcategoriasByCategoria = async (
    categoriaId: string,
    options?: { selectId?: string }
  ) => {
    try {
      const response = await fetch(`/api/categorias/${categoriaId}/subcategorias`)
      if (response.ok) {
        const data = await response.json()
        const list = data.subcategorias || []
        setSubcategorias(list)
        if (options?.selectId) {
          setSubcategoriaId(options.selectId)
          const selected = list.find(s => s.id === options.selectId)
          if (selected) {
            setStoreName(selected.nombre)
          }
        }
      }
    } catch (error) {
      console.error('Error loading subcategorias:', error)
    }
  }

  const handleCreateSubcategoria = async () => {
    if (!newSubcategoriaName.trim()) return
    if (!categoriaId) {
      notify.error(t('validation.selectCategory'))
      return
    }

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
        throw new Error(error.error || t('register.brandError'))
      }

      const data = await response.json()
      const nuevaSubcategoria = data.subcategoria

      await loadSubcategoriasByCategoria(categoriaId, { selectId: nuevaSubcategoria.id })
      setShowCreateBrand(false)
      setNewSubcategoriaName('')

      notify.success(t('register.brandCreated', { name: nuevaSubcategoria.nombre }))
    } catch (error: any) {
      notify.error(error.message || t('register.brandError'))
    } finally {
      setCreatingSubcategoria(false)
    }
  }

  const handleConfirm = () => {
    // Validate
    if (registerInBudget && !sobreId) {
      notify.error(t('validation.selectEnvelope'))
      return
    }

    if (registerInBudget && !categoriaId) {
      notify.error(t('validation.selectCategory'))
      return
    }

    if (!subcategoriaId && !storeName) {
      notify.error(t('validation.selectBrand'))
      return
    }

    if (budgetEnabled && !budgetAmount) {
      notify.error(t('validation.enterBudget'))
      return
    }

    const config: ExecutionConfig = {
      registerInBudget,
      sobre_id: registerInBudget ? sobreId : undefined,
      categoria_id: registerInBudget ? categoriaId : undefined,
      subcategoria_id: subcategoriaId || undefined,
      store_name: storeName || undefined,
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
    } else {
      setStoreName('')
    }
  }, [subcategoriaId, subcategorias])

  const brandCreationForm = (
    <div className="space-y-2 rounded-lg border-2 border-dashed border-primary/40 bg-muted/60 p-3">
      <Input
        ref={inputRef}
        placeholder={t('register.brandInputPlaceholder')}
        value={newSubcategoriaName}
        onChange={e => setNewSubcategoriaName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleCreateSubcategoria()
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowCreateBrand(false)
            setNewSubcategoriaName('')
          }}
        >
          {commonT('cancel')}
        </Button>
        <Button
          size="sm"
          disabled={!newSubcategoriaName.trim() || creatingSubcategoria}
          onClick={handleCreateSubcategoria}
        >
          {creatingSubcategoria ? t('register.brandSubmitting') : t('register.brandSubmit')}
        </Button>
      </div>
    </div>
  )

  const toggleCreateBrand = () => {
    setShowCreateBrand(prev => {
      const next = !prev
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 10)
      } else {
        setNewSubcategoriaName('')
      }
      return next
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-[92vh] flex-col overflow-hidden sm:max-w-[480px]">
        <SheetHeader className="text-left">
          <SheetTitle className="typography-h3">{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto py-5">
          <Card className="mx-1 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="typography-label text-foreground">{t('register.title')}</p>
                <p className="typography-metadata">{t('register.description')}</p>
              </div>
              <Switch checked={registerInBudget} onCheckedChange={setRegisterInBudget} />
            </div>

            {registerInBudget && (
              <div className="space-y-4 rounded-xl bg-muted/40 p-3">
                <div className="space-y-2">
                  <Label htmlFor="sobre" className="typography-caption text-muted-foreground">
                    {t('register.envelopeLabel')}
                  </Label>
                  <Select value={sobreId} onValueChange={setSobreId}>
                    <SelectTrigger id="sobre">
                      <SelectValue placeholder={t('register.envelopePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sobres.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.emoji && <span className="mr-1">{s.emoji}</span>}
                          <span className="truncate">{s.nombre}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {sobreId && (
                  <div className="space-y-2">
                    <Label htmlFor="categoria" className="typography-caption text-muted-foreground">
                      {t('register.categoryLabel')}
                    </Label>
                    <Select value={categoriaId} onValueChange={setCategoriaId}>
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder={t('register.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.emoji && <span className="mr-1">{c.emoji}</span>}
                            <span className="truncate">{c.nombre}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {categoriaId && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="flex items-center gap-2 typography-caption text-muted-foreground">
                        <Store className="h-3.5 w-3.5" /> {t('register.brandLabel')}
                      </Label>
                      <button
                        type="button"
                        className="typography-caption text-primary hover:underline disabled:opacity-60"
                        onClick={toggleCreateBrand}
                        disabled={!categoriaId}
                      >
                        {showCreateBrand ? commonT('cancel') : t('register.createBrand')}
                      </button>
                    </div>
                    {subcategorias.length > 0 ? (
                      <Select value={subcategoriaId} onValueChange={setSubcategoriaId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('register.brandPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategorias.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.emoji && <span className="mr-1">{s.emoji}</span>}
                              <span className="truncate">{s.nombre}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="typography-metadata">{t('register.brandPlaceholder')}</p>
                    )}
                    {showCreateBrand && brandCreationForm}
                  </div>
                )}
              </div>
            )}

            {!registerInBudget && (
              <div className="space-y-3 rounded-xl bg-muted/40 p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="flex items-center gap-2 typography-caption text-muted-foreground">
                      <Store className="h-3.5 w-3.5" /> {t('register.brandLabel')}
                    </Label>
                    <button
                      type="button"
                      className="typography-caption text-primary hover:underline disabled:opacity-60"
                      onClick={toggleCreateBrand}
                      disabled={!categoriaId}
                    >
                      {showCreateBrand ? commonT('cancel') : t('register.createBrand')}
                    </button>
                  </div>
                  {subcategorias.length > 0 ? (
                    <Select value={subcategoriaId} onValueChange={setSubcategoriaId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('register.brandPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategorias.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.emoji && <span className="mr-1">{s.emoji}</span>}
                            <span className="truncate">{s.nombre}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="typography-metadata">{t('register.brandPlaceholder')}</p>
                  )}
                  {showCreateBrand && brandCreationForm}
                </div>
                <p className="typography-metadata">{t('register.disabledInfo')}</p>
              </div>
            )}
          </Card>

          <Card className="mx-1 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="typography-label text-foreground">{t('budget.title')}</p>
                <p className="typography-metadata">{t('budget.description')}</p>
              </div>
              <Switch checked={budgetEnabled} onCheckedChange={setBudgetEnabled} />
            </div>

            {budgetEnabled && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 typography-caption text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" /> {t('budget.amountLabel')}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder={t('budget.amountPlaceholder')}
                  value={budgetAmount}
                  onChange={e => setBudgetAmount(e.target.value)}
                  className="typography-body-lg"
                />
                <p className="typography-metadata">{t('budget.note')}</p>
              </div>
            )}
          </Card>

          <Card className="mx-1 space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="typography-label">{t('prices.title')}</p>
                <p className="typography-metadata">{t('prices.description')}</p>
              </div>
              <Switch checked={enablePrices} onCheckedChange={setEnablePrices} />
            </div>
          </Card>
        </div>

        <div className="border-t bg-background p-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              {t('actions.start')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
