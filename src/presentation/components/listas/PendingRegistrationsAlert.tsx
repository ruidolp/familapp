'use client'

/**
 * PendingRegistrationsAlert Component
 *
 * Shows alert/dialog when there are purchases from invited users pending owner registration
 */

import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import { Button } from '@/presentation/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface PendingRegistrationsAlertProps {
  listIds: string[]  // All lists owned by user
  onRegisterNow: (execution: any) => void
  onDismissAll: () => void
}

export function PendingRegistrationsAlert({
  listIds,
  onRegisterNow,
  onDismissAll,
}: PendingRegistrationsAlertProps) {
  const [open, setOpen] = useState(false)
  const [pendingExecutions, setPendingExecutions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [checkedListIds, setCheckedListIds] = useState<string>('')

  useEffect(() => {
    // FIX: Use slice() to create a copy before sorting to avoid mutating original array
    const listIdsString = listIds.slice().sort().join(',')

    // Only check if listIds changed (not just array reference)
    if (listIdsString && listIdsString !== checkedListIds) {
      setCheckedListIds(listIdsString)
      checkPendingRegistrations(listIds)
    }
  }, [listIds])  // FIX: Remove checkedListIds from dependencies to prevent loop

  const checkPendingRegistrations = async (ids: string[]) => {
    if (ids.length === 0) return

    setLoading(true)
    try {
      // FIX: Check all lists in PARALLEL instead of series for better performance
      const promises = ids.map(async (listId) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}/pending-registrations`)
          if (response.ok) {
            const data = await response.json()
            return data.pendingExecutions || []
          } else if (response.status === 403 || response.status === 404) {
            // Silently skip lists where user is not owner or list doesn't exist
            return []
          } else {
            // Log but don't throw for non-critical errors
            console.warn(`Failed to check pending registrations for list ${listId}: ${response.status}`)
            return []
          }
        } catch (fetchError) {
          // Silently skip failed fetches for individual lists
          console.warn(`Failed to check pending registrations for list ${listId}:`, fetchError)
          return []
        }
      })

      // Wait for all requests to complete
      const results = await Promise.all(promises)
      const allPending = results.flat()

      if (allPending.length > 0) {
        setPendingExecutions(allPending)
        setOpen(true)
      }
    } catch (error) {
      console.error('Error checking pending registrations:', error)
      // Don't crash - just log the error
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterNow = () => {
    if (pendingExecutions.length > 0) {
      onRegisterNow(pendingExecutions[0])
      setOpen(false)
    }
  }

  const handleDismissAll = async () => {
    // Mark all as dismissed
    try {
      for (const execution of pendingExecutions) {
        await fetch(`/api/shopping-executions/${execution.id}/owner-register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dismiss' }),
        })
      }
      onDismissAll()
      setOpen(false)
    } catch (error) {
      console.error('Error dismissing all:', error)
    }
  }

  const handleLater = () => {
    setOpen(false)
  }

  if (loading || pendingExecutions.length === 0) return null

  const count = pendingExecutions.length

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Compras realizadas por invitados
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <div>
                Hay <strong>{count}</strong> compra{count > 1 ? 's' : ''} realizada{count > 1 ? 's' : ''} por invitados que {count > 1 ? 'no están registradas' : 'no está registrada'} en tus sobres.
              </div>
              <div className="text-sm">
                ¿Quieres registrar{count > 1 ? 'las' : 'la'} en tu presupuesto?
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            className="w-full"
            onClick={handleRegisterNow}
          >
            Registrar ahora
          </Button>
          <div className="flex w-full gap-2">
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDismissAll}
              >
                No registrar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={handleLater}
              >
                Ver más tarde
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
