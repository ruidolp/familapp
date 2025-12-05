'use client'

import { useMemo, useEffect, useState, useRef, useCallback, type CSSProperties, type ReactNode } from 'react'
import { Sliders, Wallet, List, UserPlus, Users, Settings2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerBody,
  DrawerClose,
  DrawerFooter,
} from '@/components/ui/drawer'
import { CategoriaCard } from '@/components/cards/CategoriaCard'
import { useSobreCategories } from '@/presentation/hooks/useSobres'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { getCurrentBudgetCycle, formatDetailedBudgetRange } from '@/infrastructure/utils/budget-cycle'
import { InviteUserDialog } from '@/components/sobres/invite-user-dialog'
import { ManageInvitationsDrawer } from '@/components/sobres/manage-invitations-drawer'
import { ConfigurarPresupuestoDrawer } from '@/components/drawers/ConfigurarPresupuestoDrawer'
import { useTheme } from '@/presentation/providers/theme-provider'
import { cn } from '@/infrastructure/lib/utils'
import { getHslFromHex } from '@/infrastructure/utils/color-utils'

interface Billetera {
  id: string
  nombre: string
  emoji?: string
  moneda_principal_id?: string
}

interface Asignacion {
  billetera_id: string
  monto_asignado: number
  billetera?: Billetera
}

interface SobreCardProps {
  id: string
  nombre: string
  emoji?: string
  color?: string
  presupuestoAsignado: number
  gastado?: number
  asignaciones: Asignacion[]
  diaInicioPeriodo?: number
  isCompartido?: boolean
  isOwner?: boolean
  userRole?: 'OWNER' | 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'
  presupuestoEnabled?: boolean
  onAgregarPresupuesto?: () => void
  onDevolverPresupuesto?: () => void
  onEditarCategorias?: () => void
  onVerDetalle?: () => void
  onFlashGasto?: (categoriaId: string) => void
  onPresupuestoUpdated?: () => void
  onEditarSobre?: () => void
}

// Hook: auto-resize large numbers so they don't overlap
const useAutoScaleNumber = (text: string) => {
  const ref = useRef<HTMLParagraphElement>(null)
  const computeScale = useCallback(() => {
    const el = ref.current
    if (!el) return 1
    const containerWidth = el.parentElement?.clientWidth || el.clientWidth
    const contentWidth = el.scrollWidth
    if (!containerWidth || !contentWidth) return 1
    const rawScale = containerWidth / contentWidth
    return Math.min(1, rawScale)
  }, [])

  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const updateScale = () => setScale(prev => {
      const next = computeScale()
      return Math.abs(prev - next) > 0.02 ? next : prev
    })

    // Run once on mount/text change
    updateScale()

    const observer = new ResizeObserver(() => updateScale())
    observer.observe(el)
    if (el.parentElement) {
      observer.observe(el.parentElement)
    }

    return () => observer.disconnect()
  }, [computeScale, text])

  return { ref, scale }
}

const DrawerSection = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) => (
  <Card className="bg-muted/40 p-4">
    <div className="space-y-1 pb-3">
      <p className="typography-caption font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
    <div className="space-y-3">{children}</div>
  </Card>
)

export function SobreCard({
  id,
  nombre,
  emoji,
  color,
  presupuestoAsignado,
  gastado = 0,
  asignaciones,
  diaInicioPeriodo = 1,
  isCompartido = false,
  isOwner = false,
  userRole = 'OWNER',
  presupuestoEnabled = false,
  onAgregarPresupuesto,
  onDevolverPresupuesto,
  onEditarCategorias,
  onVerDetalle,
  onFlashGasto,
  onPresupuestoUpdated,
  onEditarSobre,
}: SobreCardProps) {
  const { formatNumber } = useCurrency()
  const t = useTranslations('sobres')
  const { theme } = useTheme()
  const [categoriasLoading, setCategoriasLoading] = useState(false)
  const [accionesOpen, setAccionesOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [manageInvitesOpen, setManageInvitesOpen] = useState(false)
  const [configurarPresupuestoOpen, setConfigurarPresupuestoOpen] = useState(false)
  const [presupuestoActual, setPresupuestoActual] = useState<any>(null)
  const [loadingPresupuesto, setLoadingPresupuesto] = useState(false)

  // Permisos basados en rol
  const canManageBudget = userRole === 'OWNER' || userRole === 'ADMIN'
  const canManageCategories = userRole !== 'VIEWER'
  const canCreateExpenses = userRole !== 'VIEWER'

  // Calcular ciclo de presupuesto actual
  const budgetCycle = useMemo(
    () => getCurrentBudgetCycle(diaInicioPeriodo),
    [diaInicioPeriodo]
  )

  const periodLabel = useMemo(
    () => formatDetailedBudgetRange(budgetCycle),
    [budgetCycle]
  )

  // Asegurar que son números (pueden venir como strings/Decimal de la BD)
  const presupuesto = Number(presupuestoAsignado) || 0
  const gastadoNum = Number(gastado) || 0

  const presupuestoLibre = presupuesto - gastadoNum
  const porcentajeGastado = presupuesto > 0 ? (gastadoNum / presupuesto) * 100 : 0

  const actionButtonClass = 'h-12 w-full justify-start gap-2'
  const isRosadoTheme = theme === 'rosado'
  const drawerButtonVariant = isRosadoTheme ? 'default' : 'secondary'
  const drawerButtonClassName = cn(
    actionButtonClass,
    isRosadoTheme && 'bg-primary text-primary-foreground hover:bg-primary/90'
  )
  const showGestionSobreCard = canManageBudget || canManageCategories || isOwner
  const showAccionesCard = canManageBudget || isOwner

  const handleOpenManageInvites = () => {
    setAccionesOpen(false)
    setManageInvitesOpen(true)
  }

  const handleInvitePerson = () => {
    setAccionesOpen(false)
    setInviteDialogOpen(true)
  }

  const handleOpenConfigurarPresupuesto = async () => {
    setAccionesOpen(false)

    // Si el presupuesto está deshabilitado, no hacer fetch - ir directo al dialog
    if (!presupuestoEnabled) {
      setPresupuestoActual({ enabled: false, monto_global: 0, cuotas: [] })
      setConfigurarPresupuestoOpen(true)
      return
    }

    // Solo hacer fetch cuando el presupuesto está habilitado
    setLoadingPresupuesto(true)
    try {
      const res = await fetch(`/api/sobres/${id}/presupuesto`)
      const data = await res.json()

      if (data.success && data.data) {
        setPresupuestoActual(data.data)
      } else {
        setPresupuestoActual(null)
      }
    } catch (error) {
      console.error('Error al cargar presupuesto:', error)
      setPresupuestoActual(null)
    } finally {
      setLoadingPresupuesto(false)
      setConfigurarPresupuestoOpen(true)
    }
  }

  const handlePresupuestoSuccess = () => {
    refetchCategorias()
    setConfigurarPresupuestoOpen(false)
    // Recargar presupuesto para que se actualice en próxima apertura
    setPresupuestoActual(null)
    // Notificar al padre para que recargue la lista de sobres
    onPresupuestoUpdated?.()
  }

  // Hook para obtener categorías
  const { categorias, loading: categoriasLoadingHook, refetch: refetchCategorias } = useSobreCategories(id)

  // Sincronizar loading state
  useEffect(() => {
    setCategoriasLoading(categoriasLoadingHook)
  }, [categoriasLoadingHook])

  // Ordenar categorías por porcentaje descendente
  const categoriasOrdenadas = useMemo(() => {
    return [...categorias].sort((a, b) => {
      const pctA = Number(a.porcentaje) || 0
      const pctB = Number(b.porcentaje) || 0
      return pctB - pctA
    })
  }, [categorias])

  const accentColor = color || '#3b82f6'
  const accentHsl = useMemo(() => getHslFromHex(accentColor), [accentColor])
  const cardStyle = useMemo(
    () =>
      ({
        '--accent-color': accentHsl,
        '--background-color': 'var(--background)',
        background:
          'linear-gradient(180deg, hsl(var(--accent-color) / 0.36) 0%, hsl(var(--accent-color) / 0.30) 22%, hsl(var(--accent-color) / 0.26) 45%, hsl(var(--accent-color) / 0.20) 70%, hsl(var(--accent-color) / 0.16) 100%)',
        border: '1px solid hsl(var(--accent-color) / 0.35)',
        boxShadow: 'inset 0 1px 2px hsl(var(--accent-color) / 0.12)',
      }) as CSSProperties,
    [accentHsl]
  )
  const primaryTextClass = 'text-foreground'
  const mutedText70 = 'text-foreground'
  const mutedText80 = 'text-foreground'
  const mutedText85 = 'text-foreground'
  const overBudgetTextClass = 'text-red-600 dark:text-red-200'
  const sliderTriggerClasses = 'text-foreground/80 hover:text-foreground'
  const libreEsPositivo = presupuestoLibre >= 0
  const usadoFormatted = useMemo(() => formatNumber(gastadoNum), [formatNumber, gastadoNum])
  const libreFormatted = useMemo(
    () =>
      libreEsPositivo
        ? formatNumber(presupuestoLibre)
        : `-${formatNumber(Math.abs(presupuestoLibre))}`,
    [formatNumber, libreEsPositivo, presupuestoLibre]
  )

  const usadoScale = useAutoScaleNumber(usadoFormatted)
  const libreScale = useAutoScaleNumber(libreFormatted)
  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col gap-3">
      <Card
        className={cn(
          'relative overflow-hidden rounded-xl border border-transparent px-5 pt-4 pb-4 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-none transition-shadow'
        )}
        style={cardStyle}
        onClick={onVerDetalle}
      >
        <div className={cn('relative z-10', primaryTextClass)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn('text-xs tracking-wide opacity-70 font-medium', mutedText70)}>{periodLabel}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <h2 className="text-[26px] font-semibold leading-tight">{nombre}</h2>
                {isCompartido && (
                  <Users
                    className="h-[1.2em] w-[1.2em] text-current drop-shadow-sm"
                    aria-label="Sobre compartido"
                  />
                )}
              </div>
              {presupuestoEnabled && (
                <p className={cn('text-xs tracking-wide opacity-70 font-medium mt-0.5', mutedText70)}>
                  {`${formatNumber(presupuesto)} ${t('monthlyGoal')}`}
                </p>
              )}
            </div>
            <Drawer open={accionesOpen} onOpenChange={setAccionesOpen}>
              <Button
                variant="ghost"
                size="icon"
                className={cn('opacity-80 hover:opacity-100 transition-opacity', sliderTriggerClasses)}
                onClick={(e) => {
                  e.stopPropagation()
                  setAccionesOpen(true)
                }}
              >
                <Sliders className="h-5 w-5" />
                <span className="sr-only">{t('card.accessibility.actions')}</span>
              </Button>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{t('card.actions.title', { name: nombre })}</DrawerTitle>
                  <DrawerDescription>{t('card.actions.description')}</DrawerDescription>
                </DrawerHeader>
                <DrawerBody className="space-y-4">
                  {showGestionSobreCard && (
                    <DrawerSection
                      title={t('card.sections.manageEnvelope')}
                      description={t('card.actions.description')}
                    >
                      {isOwner && (
                        <div className="space-y-2">
                          <Button
                            variant={drawerButtonVariant}
                            className={drawerButtonClassName}
                            onClick={(e) => {
                              e.stopPropagation()
                              setAccionesOpen(false)
                              onEditarSobre?.()
                            }}
                          >
                            <Settings2 className="h-4 w-4" />
                            Editar sobre
                          </Button>
                        </div>
                      )}
                      {canManageBudget && (
                        <div className={cn('space-y-2', isOwner && 'border-t border-border/70 pt-3')}>
                          <Button
                            variant={drawerButtonVariant}
                            className={drawerButtonClassName}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenConfigurarPresupuesto()
                            }}
                            disabled={loadingPresupuesto}
                          >
                            <Settings2 className="h-4 w-4" />
                            {loadingPresupuesto
                              ? 'Cargando...'
                              : presupuestoEnabled
                                ? t('card.actions.configureBudget')
                                : t('card.actions.enableBudget')
                            }
                          </Button>
                        </div>
                      )}
                      {canManageCategories && (
                        <div className={cn('space-y-2', (isOwner || canManageBudget) && 'border-t border-border/70 pt-3')}>
                          <Button
                            variant={drawerButtonVariant}
                            className={drawerButtonClassName}
                            onClick={(e) => {
                              e.stopPropagation()
                              setAccionesOpen(false)
                              onEditarCategorias?.()
                            }}
                          >
                            <Wallet className="h-4 w-4" />
                            {t('card.actions.categoriesAndBrands')}
                          </Button>
                        </div>
                      )}
                    </DrawerSection>
                  )}

                  {showAccionesCard && (
                    <DrawerSection title={t('card.sections.actionsAndCollaboration')}>
                      {canManageBudget && (
                        <div className="space-y-2">
                          <Button
                            variant={drawerButtonVariant}
                            className={drawerButtonClassName}
                            onClick={(e) => {
                              e.stopPropagation()
                              setAccionesOpen(false)
                              onVerDetalle?.()
                            }}
                          >
                            <List className="h-4 w-4" />
                            {t('card.actions.transactions')}
                          </Button>
                        </div>
                      )}
                      {isOwner && (
                        <div className={cn('space-y-2', canManageBudget && 'border-t border-border/70 pt-3')}>
                          {isCompartido && (
                            <Button
                              variant={drawerButtonVariant}
                              className={drawerButtonClassName}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenManageInvites()
                              }}
                            >
                              <Users className="h-4 w-4" />
                              Gestionar Invitados
                            </Button>
                          )}
                          {!isCompartido && (
                            <p className="text-xs font-semibold text-muted-foreground">
                              Aún no has compartido este sobre, invita a alguien para colaborar.
                            </p>
                          )}
                          <Button
                            variant={drawerButtonVariant}
                            className={drawerButtonClassName}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInvitePerson()
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                            Invitar una persona
                          </Button>
                        </div>
                      )}
                    </DrawerSection>
                  )}
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="ghost" className="w-full">
                      {t('card.actions.close')}
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          <div
            className={cn(
              'mt-2 grid gap-3 items-end',
              presupuestoEnabled ? 'grid-cols-2' : 'grid-cols-1'
            )}
          >
            <div className="flex flex-col">
              <p
                ref={usadoScale.ref}
                className="text-2xl font-semibold leading-tight inline-block max-w-full"
                style={{ transform: `scale(${usadoScale.scale})`, transformOrigin: 'left center' }}
              >
                {usadoFormatted}
              </p>
              <p className={cn('text-xs opacity-70 mt-0.5', mutedText80)}>{t('usado')}</p>
            </div>
            {presupuestoEnabled && (
              <div className="flex flex-col items-end text-right">
                <p
                  ref={libreScale.ref}
                  className={cn(
                    'text-2xl font-semibold leading-tight inline-block max-w-full',
                    !libreEsPositivo && overBudgetTextClass
                  )}
                  style={{ transform: `scale(${libreScale.scale})`, transformOrigin: 'right center' }}
                >
                  {libreFormatted}
                </p>
                <p className={cn('text-xs opacity-70 mt-0.5', mutedText80)}>
                  {libreEsPositivo ? t('libre') : t('card.status.overBudget')}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-1 flex-col pb-4">
        <div className="flex-1 rounded-2xl border border-border bg-card w-full">
          <div className="space-y-3 px-4 pt-4 pb-2">
            <p className="typography-caption font-semibold uppercase tracking-wide text-muted-foreground">
              {t('categories.title')}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {categoriasLoading ? (
              <div className="flex h-full items-center justify-center px-4 pb-4 text-center typography-caption font-semibold text-muted-foreground">
                {t('categories.loading')}
              </div>
            ) : categoriasOrdenadas.length > 0 ? (
              <div className="divide-y divide-border border-t border-border">
                {categoriasOrdenadas.map((categoria) => (
                  <CategoriaCard
                    key={categoria.id}
                    nombre={categoria.nombre}
                    emoji={categoria.emoji}
                    color={categoria.color}
                    gastado={categoria.gastado || 0}
                    compras={categoria.compras || 0}
                    meta={categoria.meta}
                    onFlashGasto={(e) => {
                      e?.stopPropagation()
                      onFlashGasto?.(categoria.id)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 border-t border-border px-4 pb-4 pt-6 text-center">
                <p className="typography-caption font-semibold text-muted-foreground">
                  {t('categories.empty')}
                </p>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditarCategorias?.()
                  }}
                >
                  {t('categories.addButton')}
                </Button>
              </div>
            )}
          </div>

          {categoriasOrdenadas.length > 0 && !categoriasLoading && (
            <div className="border-t border-border p-4">
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditarCategorias?.()
                }}
              >
                {t('categories.addButton')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      {isOwner && (
        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          tipo="sobre"
          itemId={id}
          itemNombre={nombre}
          itemEmoji={emoji}
          onSuccess={(method) => {
            // If user chose WhatsApp, open manage invitations drawer
            if (method === 'whatsapp') {
              setManageInvitesOpen(true)
            }
          }}
        />
      )}
      {isOwner && (
        <ManageInvitationsDrawer
          open={manageInvitesOpen}
          onOpenChange={setManageInvitesOpen}
          sobreId={id}
          sobreNombre={nombre}
        />
      )}

      {/* Budget Configuration Drawer */}
      {canManageBudget && (
        <ConfigurarPresupuestoDrawer
          open={configurarPresupuestoOpen}
          onOpenChange={setConfigurarPresupuestoOpen}
          sobreId={id}
          sobreNombre={nombre}
          categorias={categoriasOrdenadas.map((cat) => ({
            id: cat.id,
            nombre: cat.nombre,
            emoji: cat.emoji,
            color: cat.color,
            gastado: cat.gastado,
          }))}
          presupuestoActual={presupuestoActual}
          onSuccess={handlePresupuestoSuccess}
        />
      )}
    </div>
  )
}
