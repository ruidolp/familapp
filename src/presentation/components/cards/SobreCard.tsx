'use client'

import { useMemo, useEffect, useState, useRef, useCallback, type CSSProperties } from 'react'
import { MoreVertical, Wallet, ArrowUpRight, ArrowDownRight, List, UserPlus, Users } from 'lucide-react'
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
import { useTheme } from '@/presentation/providers/theme-provider'
import { cn } from '@/infrastructure/lib/utils'

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
  onAgregarPresupuesto?: () => void
  onDevolverPresupuesto?: () => void
  onEditarCategorias?: () => void
  onVerDetalle?: () => void
  onFlashGasto?: (categoriaId: string) => void
  onVerTransaccionesCategoria?: (
    categoriaId: string,
    categoriaNombre: string,
    sobreId: string,
    sobreName: string
  ) => void
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
  onAgregarPresupuesto,
  onDevolverPresupuesto,
  onEditarCategorias,
  onVerDetalle,
  onFlashGasto,
  onVerTransaccionesCategoria,
}: SobreCardProps) {
  const { formatNumber } = useCurrency()
  const t = useTranslations('sobres')
  const { theme } = useTheme()
  const [categoriasLoading, setCategoriasLoading] = useState(false)
  const [accionesOpen, setAccionesOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [manageInvitesOpen, setManageInvitesOpen] = useState(false)

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

  const handleOpenManageInvites = () => {
    setAccionesOpen(false)
    setManageInvitesOpen(true)
  }

  const handleInvitePerson = () => {
    setAccionesOpen(false)
    setInviteDialogOpen(true)
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
  const libreEsPositivo = presupuestoLibre >= 0
  const usadoFormatted = useMemo(() => formatNumber(gastadoNum), [formatNumber, gastadoNum])
  const libreFormatted = useMemo(
    () => formatNumber(libreEsPositivo ? presupuestoLibre : Math.abs(presupuestoLibre)),
    [formatNumber, libreEsPositivo, presupuestoLibre]
  )

  const usadoScale = useAutoScaleNumber(usadoFormatted)
  const libreScale = useAutoScaleNumber(libreFormatted)

  const withAlpha = (hex: string, alphaHex: string) => {
    if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex
    if (hex.length === 7) {
      return `${hex}${alphaHex}`
    }
    const r = hex[1]
    const g = hex[2]
    const b = hex[3]
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`
  }

  const accentBg = withAlpha(accentColor, 'b3')
  const accentStyles = {
    '--sobre-accent': accentColor,
  } as CSSProperties

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4" style={accentStyles}>
      <Card
        className="relative overflow-hidden rounded-3xl border border-transparent p-5 text-white shadow-theme hover:shadow-none transition-shadow"
        style={{ background: `linear-gradient(135deg, ${accentBg} 0%, ${withAlpha(accentColor, '90')} 60%)` }}
        onClick={onVerDetalle}
      >
        <div
          className="pointer-events-none absolute -top-4 right-0 h-16 w-24 opacity-70"
          style={{
            backgroundColor: accentColor,
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          }}
        />
        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 typography-caption font-semibold uppercase tracking-wide text-white/70">
                <span className="text-left">{periodLabel}</span>
                <div className="h-px flex-1 bg-white/30" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="typography-h1 leading-tight">{nombre}</h2>
                  {isCompartido && (
                    <Users
                      className="h-[1.2em] w-[1.2em] text-current drop-shadow-sm"
                      aria-label="Sobre compartido"
                    />
                  )}
                </div>
                <p className="typography-caption font-semibold text-white/80">
                  {formatNumber(presupuesto)} {t('total')}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
              <Drawer open={accionesOpen} onOpenChange={setAccionesOpen}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/80"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAccionesOpen(true)
                  }}
                >
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">{t('card.accessibility.actions')}</span>
                </Button>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>{t('card.actions.title', { name: nombre })}</DrawerTitle>
                    <DrawerDescription>{t('card.actions.description')}</DrawerDescription>
                  </DrawerHeader>
                  <DrawerBody className="space-y-4">
                  {canManageBudget && (
                    <Card className="p-3 space-y-3 bg-muted/40">
                      <p className="typography-caption font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('card.actions.budgetSection')}
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={drawerButtonVariant}
                          className={drawerButtonClassName}
                          onClick={(e) => {
                            e.stopPropagation()
                            setAccionesOpen(false)
                            onAgregarPresupuesto?.()
                          }}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          {t('card.actions.increase')}
                        </Button>
                        <Button
                          variant={drawerButtonVariant}
                          className={cn(
                            drawerButtonClassName,
                            presupuestoLibre <= 0 && 'cursor-not-allowed'
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (presupuestoLibre <= 0) return
                            setAccionesOpen(false)
                            onDevolverPresupuesto?.()
                          }}
                        >
                          <ArrowDownRight className="h-4 w-4" />
                          {t('card.actions.reduce')}
                        </Button>
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
                    </Card>
                  )}

                  {canManageCategories && (
                    <Card className="p-3 space-y-3 bg-muted/40">
                      <p className="typography-caption font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('card.actions.organizationSection')}
                      </p>
                      <div className="flex flex-col gap-2">
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
                    </Card>
                  )}

                  {isOwner && (
                    <Card className="p-3 space-y-3 bg-muted/40">
                      <p className="typography-caption font-semibold uppercase tracking-wide text-muted-foreground">
                        Compartir
                      </p>
                      <div className="flex flex-col gap-2">
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
                    </Card>
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
        </div>

        <div className="grid grid-cols-2 gap-4 text-white">
            <div className="space-y-1">
              <p className="typography-caption font-semibold uppercase tracking-wide text-white/80">
                {t('usado')}
              </p>
              <p
                ref={usadoScale.ref}
                className="typography-h1 leading-tight text-[clamp(1.75rem,8vw,2.75rem)] inline-block max-w-full"
                style={{ transform: `scale(${usadoScale.scale})`, transformOrigin: 'left center' }}
              >
                {usadoFormatted}
              </p>
              <p className="typography-caption font-semibold text-white/80">
                {t('card.status.percentOfBudget', { percent: Math.round(porcentajeGastado) })}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="typography-caption font-semibold uppercase tracking-wide text-white/80">
                {libreEsPositivo ? t('libre') : t('card.status.overBudget')}
              </p>
              <p
                ref={libreScale.ref}
                className={`typography-h1 leading-tight text-[clamp(1.75rem,8vw,2.75rem)] inline-block max-w-full ${
                  libreEsPositivo ? '' : 'text-red-100'
                }`}
                style={{ transform: `scale(${libreScale.scale})`, transformOrigin: 'right center' }}
              >
                {libreFormatted}
              </p>
              <p className="typography-caption font-semibold text-white/80">{t('card.status.available')}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-1 flex-col">
        <div className="space-y-3 px-4 pt-2 pb-1">
          <div className="flex items-center gap-3 typography-caption font-semibold uppercase tracking-wide text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>{t('categories.title', { count: categoriasOrdenadas.length })}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {presupuesto <= 0 && (
            <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center">
              <p className="typography-caption font-semibold text-muted-foreground">
                {t('emptyBudget.message')}
              </p>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregarPresupuesto?.()
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t('emptyBudget.button')}
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {categoriasLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-muted/30 p-4 typography-caption font-semibold text-muted-foreground">
              {t('categories.loading')}
            </div>
          ) : categoriasOrdenadas.length > 0 ? (
            <>
              {categoriasOrdenadas.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  id={categoria.id}
                  nombre={categoria.nombre}
                  emoji={categoria.emoji}
                  color={categoria.color}
                  gastado={categoria.gastado || 0}
                  porcentaje={categoria.porcentaje || 0}
                  compras={categoria.compras || 0}
                  onViewTransactions={() =>
                    onVerTransaccionesCategoria?.(categoria.id, categoria.nombre, id, nombre)
                  }
                  onFlashGasto={(e) => {
                    e?.stopPropagation()
                    onFlashGasto?.(categoria.id)
                  }}
                />
              ))}
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
            </>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-center">
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
    </div>
  )
}
