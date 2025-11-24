'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'

interface MailTestFormProps {
  targetEmail: string
}

export function MailTestForm({ targetEmail }: MailTestFormProps) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!message.trim()) {
      setError('Debes ingresar un mensaje')
      setStatus('error')
      return
    }

    setStatus('sending')
    setError(null)

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo enviar el email')
      }

      setStatus('success')
      setLastSentAt(new Date().toLocaleString())
      setMessage('')
    } catch (err) {
      console.error('Error enviando email de prueba:', err)
      setStatus('error')
      const messageError = err instanceof Error ? err.message : 'Error desconocido'
      setError(messageError)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="typography-label text-sm font-semibold text-muted-foreground">
          Email destino
        </label>
        <p className="typography-body-sm text-foreground">{targetEmail || 'Sin email en perfil'}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="typography-label text-sm font-semibold">
          Mensaje de prueba
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Escribe cualquier texto para enviarlo por MailerSend"
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {lastSentAt && status === 'success' && (
        <p className="text-sm text-green-600">
          Último envío: {lastSentAt}
        </p>
      )}

      <Button
        type="submit"
        disabled={status === 'sending' || !targetEmail}
        className="w-full"
      >
        {status === 'sending' ? 'Enviando...' : 'Enviar email de prueba'}
      </Button>
    </form>
  )
}
