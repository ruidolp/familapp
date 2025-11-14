/**
 * Password Validator Component
 *
 * Muestra las reglas de contraseña y valida en tiempo real
 */

'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { appConfig } from '@/infrastructure/config/app.config'

interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
  enabled: boolean
}

interface PasswordValidatorProps {
  password: string
  className?: string
}

export function PasswordValidator({ password, className = '' }: PasswordValidatorProps) {
  const [rules, setRules] = useState<PasswordRule[]>([])

  useEffect(() => {
    const passwordRules: PasswordRule[] = [
      {
        id: 'minLength',
        label: `Al menos ${appConfig.auth.password.minLength} caracteres`,
        test: (pwd) => pwd.length >= appConfig.auth.password.minLength,
        enabled: true,
      },
      {
        id: 'uppercase',
        label: 'Al menos una letra mayúscula (A-Z)',
        test: (pwd) => /[A-Z]/.test(pwd),
        enabled: appConfig.auth.password.requireUppercase,
      },
      {
        id: 'lowercase',
        label: 'Al menos una letra minúscula (a-z)',
        test: (pwd) => /[a-z]/.test(pwd),
        enabled: appConfig.auth.password.requireLowercase,
      },
      {
        id: 'number',
        label: 'Al menos un número (0-9)',
        test: (pwd) => /\d/.test(pwd),
        enabled: appConfig.auth.password.requireNumbers,
      },
      {
        id: 'special',
        label: 'Al menos un carácter especial (!@#$%^&*)',
        test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        enabled: appConfig.auth.password.requireSpecialChars,
      },
    ]

    setRules(passwordRules.filter((rule) => rule.enabled))
  }, [])

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-muted-foreground">
        La contraseña debe cumplir con:
      </p>
      <ul className="space-y-1.5">
        {rules.map((rule) => {
          const isValid = password ? rule.test(password) : false
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-2 text-sm transition-colors ${
                password
                  ? isValid
                    ? 'text-green-600 dark:text-green-500'
                    : 'text-red-600 dark:text-red-500'
                  : 'text-muted-foreground'
              }`}
            >
              {password ? (
                isValid ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 flex-shrink-0" />
                )
              ) : (
                <span className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-muted-foreground" />
              )}
              <span>{rule.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Helper para verificar si una contraseña cumple todas las reglas
 */
export function isPasswordValid(password: string): boolean {
  if (!password) return false

  const rules = [
    password.length >= appConfig.auth.password.minLength,
    !appConfig.auth.password.requireUppercase || /[A-Z]/.test(password),
    !appConfig.auth.password.requireLowercase || /[a-z]/.test(password),
    !appConfig.auth.password.requireNumbers || /\d/.test(password),
    !appConfig.auth.password.requireSpecialChars || /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ]

  return rules.every((rule) => rule)
}
