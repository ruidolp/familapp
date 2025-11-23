'use client'

import { useState } from 'react'
import { ArrowLeft, ShoppingCart, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { MetricasListasCompras } from '../metricas/MetricasListasCompras'
import { MetricasSobres } from '../metricas/MetricasSobres'

type Module = 'listas' | 'sobres'

interface MetricasScreenProps {
  userId: string
}

export function MetricasScreen({ userId }: MetricasScreenProps) {
  const router = useRouter()
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)

  if (!selectedModule) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="typography-h3 text-foreground">Métricas</h1>
        </div>

        {/* Module Selector */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <p className="typography-body text-muted-foreground text-center mb-4">
            Selecciona el módulo para ver tus métricas
          </p>

          <Card
            className="w-full max-w-sm p-6 cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedModule('listas')}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart size={32} className="text-primary" />
              </div>
              <h2 className="typography-h4 text-foreground">Listas de Compras</h2>
              <p className="typography-body-sm text-muted-foreground text-center">
                Análisis de tus compras, productos y tiendas
              </p>
            </div>
          </Card>

          <Card
            className="w-full max-w-sm p-6 cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedModule('sobres')}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet size={32} className="text-primary" />
              </div>
              <h2 className="typography-h4 text-foreground">Sobres</h2>
              <p className="typography-body-sm text-muted-foreground text-center">
                Análisis de tus gastos, categorías y marcas
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {selectedModule === 'listas' && (
        <MetricasListasCompras
          userId={userId}
          onBack={() => setSelectedModule(null)}
        />
      )}
      {selectedModule === 'sobres' && (
        <MetricasSobres
          userId={userId}
          onBack={() => setSelectedModule(null)}
        />
      )}
    </div>
  )
}
