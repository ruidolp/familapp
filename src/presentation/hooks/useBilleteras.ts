/**
 * React Query hooks para Billeteras
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/infrastructure/lib/notifications'

// Types
export interface Billetera {
  id: string
  nombre: string
  tipo: 'DEBITO' | 'CREDITO' | 'EFECTIVO' | 'AHORRO' | 'INVERSION'
  saldo_real: number
  saldo_proyectado: number
  is_compartida: boolean
  tasa_interes: number | null
  color: string | null
  emoji: string | null
  moneda_principal_id: string
  usuario_id: string
  created_at: string
  updated_at: string
}

export interface CreateBilleteraInput {
  nombre: string
  tipo: string
  saldoInicial: number
  isCompartida: boolean
  tasaInteres?: number | null
}

export interface UpdateBilleteraInput {
  nombre?: string
  tipo?: string
  isCompartida?: boolean
  tasaInteres?: number | null
}

export interface AdjustBalanceInput {
  monto: number
  descripcion?: string
}

export interface TransferInput {
  fromBilleteraId: string
  toBilleteraId: string
  monto: number
}

// Query keys
export const billeterasKeys = {
  all: ['billeteras'] as const,
  detail: (id: string) => ['billeteras', id] as const,
  linkedEnvelopes: (id: string) => ['billeteras', id, 'sobres-vinculados'] as const,
}

// Fetch functions
async function fetchBilleteras(): Promise<Billetera[]> {
  const res = await fetch('/api/billeteras')
  if (!res.ok) throw new Error('Error al cargar billeteras')
  const data = await res.json()
  return data.billeteras || []
}

async function fetchBilletera(id: string): Promise<Billetera> {
  const res = await fetch(`/api/billeteras/${id}`)
  if (!res.ok) throw new Error('Billetera no encontrada')
  const data = await res.json()
  return data.billetera
}

async function createBilletera(input: CreateBilleteraInput): Promise<Billetera> {
  const res = await fetch('/api/billeteras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al crear billetera')
  }
  const data = await res.json()
  return data.billetera
}

async function updateBilletera(id: string, input: UpdateBilleteraInput): Promise<Billetera> {
  const res = await fetch(`/api/billeteras/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al actualizar billetera')
  }
  const data = await res.json()
  return data.billetera
}

async function deleteBilletera(id: string): Promise<void> {
  const res = await fetch(`/api/billeteras/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al eliminar billetera')
  }
}

async function adjustBalance(id: string, input: AdjustBalanceInput): Promise<Billetera> {
  const res = await fetch(`/api/billeteras/${id}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al ajustar saldo')
  }
  const data = await res.json()
  return data.billetera
}

async function transferBetween(input: TransferInput): Promise<void> {
  const res = await fetch('/api/billeteras/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      billeteraOrigenId: input.fromBilleteraId,
      billeteraDestinoId: input.toBilleteraId,
      monto: input.monto,
    }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al transferir')
  }
}

async function fetchLinkedEnvelopes(id: string) {
  const res = await fetch(`/api/billeteras/${id}/sobres-vinculados`)
  if (!res.ok) throw new Error('Error al verificar sobres')
  return res.json()
}

async function depositarORetirar(
  id: string,
  monto: number,
  tipo: 'DEPOSITO' | 'RETIRO',
  descripcion?: string
): Promise<void> {
  const res = await fetch(`/api/billeteras/${id}/deposito-retiro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monto, tipo, descripcion }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al registrar operación')
  }
}

// Hooks
export function useBilleteras() {
  const queryClient = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: billeterasKeys.all,
    queryFn: fetchBilleteras,
  })

  const depositarRetirarrMutation = useMutation({
    mutationFn: ({ id, monto, tipo, descripcion }: { id: string; monto: number; tipo: 'DEPOSITO' | 'RETIRO'; descripcion?: string }) =>
      depositarORetirar(id, monto, tipo, descripcion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billeterasKeys.all })
      notify.success('Operación registrada correctamente')
    },
    onError: (error: Error) => {
      notify.error(error.message)
    },
  })

  const handleDeposito = async (id: string, monto: number, tipo: 'DEPOSITO' | 'RETIRO', descripcion?: string) => {
    await depositarRetirarrMutation.mutateAsync({ id, monto, tipo, descripcion })
  }

  return { billeteras: data, isLoading, handleDeposito }
}

export function useBilletera(id: string) {
  return useQuery({
    queryKey: billeterasKeys.detail(id),
    queryFn: () => fetchBilletera(id),
    enabled: !!id,
  })
}

export function useLinkedEnvelopes(id: string) {
  return useQuery({
    queryKey: billeterasKeys.linkedEnvelopes(id),
    queryFn: () => fetchLinkedEnvelopes(id),
    enabled: !!id,
  })
}

export function useCreateBilletera() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBilletera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billeterasKeys.all })
      notify.created('Billetera')
    },
    onError: (error: Error) => {
      notify.error(error.message)
    },
  })
}

export function useUpdateBilletera() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateBilleteraInput) =>
      updateBilletera(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: billeterasKeys.all })
      queryClient.invalidateQueries({ queryKey: billeterasKeys.detail(variables.id) })
      notify.updated('Billetera')
    },
    onError: (error: Error) => {
      notify.error(error.message)
    },
  })
}

export function useDeleteBilletera() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBilletera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billeterasKeys.all })
      notify.deleted('Billetera')
    },
    onError: (error: Error) => {
      notify.error(error.message)
    },
  })
}

export function useAdjustBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & AdjustBalanceInput) =>
      adjustBalance(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: billeterasKeys.all })
      queryClient.invalidateQueries({ queryKey: billeterasKeys.detail(variables.id) })
      notify.success('Saldo ajustado correctamente')
    },
    onError: (error: Error) => {
      notify.error(error.message)
    },
  })
}

export function useTransferBetween() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: transferBetween,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billeterasKeys.all })
      notify.success('Transferencia completada')
    },
    onError: (error: Error) => {
      notify.error(error.message)
    },
  })
}
