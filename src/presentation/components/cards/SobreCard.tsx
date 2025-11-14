'use client'

import { useMemo, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CategoriaCard } from '@/components/cards/CategoriaCard'
import { useSobreCategories } from '@/presentation/hooks/useSobres'
import { EditarCategoriaDrawer } from '@/components/drawers/EditarCategoriaDrawer'

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
  onAgregarPresupuesto?: () => void
  onDevolverPresupuesto?: () => void
  onEditarCategorias?: () => void
  onAgregarCategoria?: () => void
  onVerDetalle?: () => void
}

export function SobreCard({
  id,
  nombre,
  emoji,
  color,
  presupuestoAsignado,
  gastado = 0,
  asignaciones,
  onAgregarPresupuesto,
  onDevolverPresupuesto,
  onEditarCategorias,
  onAgregarCategoria,
  onVerDetalle,
}: SobreCardProps) {
  const [categoriasLoading, setCategoriasLoading] = useState(false)
  const [editarCategoriaOpen, setEditarCategoriaOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<{ id: string; nombre: string } | null>(null)

  // Asegurar que son números (pueden venir como strings/Decimal de la BD)
  const presupuesto = Number(presupuestoAsignado) || 0
  const gastadoNum = Number(gastado) || 0

  const presupuestoLibre = presupuesto - gastadoNum
  const porcentajeGastado = presupuesto > 0 ? (gastadoNum / presupuesto) * 100 : 0
  const isOverspent = gastadoNum > presupuesto

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

  const bgColor = color || '#3b82f6'

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onVerDetalle}
    >
      {/* Header con color y menu de 3 puntos */}
      <div
        className="p-4 text-white flex justify-between items-start"
        style={{ backgroundColor: bgColor }}
      >
        <div>
          <h3 className="font-bold text-lg">{nombre}</h3>
          <p className="text-sm opacity-90">
            ${presupuesto.toFixed(2)}
          </p>
        </div>

        {/* Menu de 3 puntos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              ⋮
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onAgregarPresupuesto?.()
            }}>
              Aumentar Presupuesto
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDevolverPresupuesto?.()
              }}
              disabled={presupuestoLibre <= 0}
            >
              Devolver Presupuesto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onEditarCategorias?.()
            }}>
              Editar Categorías
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onVerDetalle?.()
            }}>
              Ver Detalle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Estado de gasto */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              Gastado: ${gastadoNum.toFixed(2)}
            </span>
            <span className={`font-medium ${
              isOverspent ? 'text-red-600' : 'text-green-600'
            }`}>
              {isOverspent
                ? `Exceso: $${(gastadoNum - presupuesto).toFixed(2)}`
                : `Libre: $${presupuestoLibre.toFixed(2)}`}
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${
            isOverspent ? 'bg-red-100' : 'bg-green-100'
          }`}>
            <div
              className={`h-full ${
                isOverspent ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {porcentajeGastado.toFixed(1)}% del presupuesto
          </p>
        </div>

        {/* Categorías */}
        {categoriasLoading ? (
          <div className="p-3 rounded-lg bg-slate-50 text-center">
            <p className="text-sm text-muted-foreground">
              Cargando categorías...
            </p>
          </div>
        ) : categoriasOrdenadas.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-muted-foreground">
                Categorías ({categoriasOrdenadas.length})
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregarCategoria?.()
                }}
                className="h-6 px-2"
              >
                ➕
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {categoriasOrdenadas.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  id={categoria.id}
                  nombre={categoria.nombre}
                  emoji={categoria.emoji}
                  color={categoria.color}
                  gastado={categoria.gastado || 0}
                  porcentaje={categoria.porcentaje || 0}
                  presupuestoAsignado={presupuesto}
                  onClick={(e) => {
                    e?.stopPropagation()
                    setSelectedCategoria({ id: categoria.id, nombre: categoria.nombre })
                    setEditarCategoriaOpen(true)
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-50 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Sin categorías aún
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAgregarCategoria?.()
              }}
              className="w-full"
            >
              ➕ Agregar Categorías
            </Button>
          </div>
        )}

        {/* Badge de overspend */}
        {isOverspent && (
          <Badge variant="destructive" className="w-full justify-center">
            ⚠️ Presupuesto excedido
          </Badge>
        )}
      </div>

      {/* Drawer editar categoría */}
      {selectedCategoria && (
        <EditarCategoriaDrawer
          open={editarCategoriaOpen}
          onOpenChange={setEditarCategoriaOpen}
          categoriaId={selectedCategoria.id}
          categoriaNombre={selectedCategoria.nombre}
          onSuccess={() => {
            refetchCategorias()
          }}
        />
      )}
    </Card>
  )
}
