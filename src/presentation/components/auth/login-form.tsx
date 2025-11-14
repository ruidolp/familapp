/**
 * Login Form Component
 *
 * Formulario de inicio de sesión con validación y manejo de errores
 * Soporte multilenguaje con next-intl
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

import { loginSchema, type LoginInput } from '@/infrastructure/utils/validation'
import { apiClient, getErrorMessage } from '@/infrastructure/lib/api-client'

interface AuthConfig {
  auth: {
    registration: {
      allowSelfSignup: boolean
    }
    recovery: {
      enabled: boolean
    }
    oauth: {
      google: {
        enabled: boolean
      }
      facebook: {
        enabled: boolean
      }
    }
  }
}

export function LoginForm() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const t = useTranslations('auth.login')
  const tOAuth = useTranslations('auth.oauth')
  const tCommon = useTranslations('common')

  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [showCredentialsForm, setShowCredentialsForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  // Fetch config from API
  useEffect(() => {
    apiClient.get<AuthConfig>('/api/config')
      .then(data => {
        setConfig(data)
        // Show credentials form by default if no OAuth providers are available
        const hasOAuth = data.auth.oauth.google.enabled || data.auth.oauth.facebook.enabled
        setShowCredentialsForm(!hasOAuth)
      })
      .catch(console.error)
  }, [])

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        identifier: data.identifier,
        password: data.password,
      })

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: t('error.title'),
          description: t('error.invalidCredentials'),
        })
      } else if (result?.ok) {
        toast({
          title: t('success.title'),
          description: t('success.description'),
        })
        router.push(`/${locale}/dashboard`)
        router.refresh()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: tCommon('error'),
        description: t('error.generic'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setIsLoading(true)
    try {
      await signIn(provider, {
        callbackUrl: `/${locale}/dashboard`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: tCommon('error'),
        description: t('error.generic'),
      })
      setIsLoading(false)
    }
  }

  const hasOAuthProviders = config?.auth.oauth.google.enabled || config?.auth.oauth.facebook.enabled

  if (!config) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {hasOAuthProviders && !showCredentialsForm
            ? t('selectMethod')
            : t('description')
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* OAuth Providers - Show first if available */}
        {hasOAuthProviders && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {config.auth.oauth.google.enabled && (
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {tOAuth('google')}
                </Button>
              )}

              {config.auth.oauth.facebook.enabled && (
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('facebook')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {tOAuth('facebook')}
                </Button>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {tCommon('or')}
                </span>
              </div>
            </div>

            {/* Toggle button to show credentials form */}
            {!showCredentialsForm && (
              <Button
                variant="outline"
                onClick={() => setShowCredentialsForm(true)}
                className="w-full"
              >
                {t('continueWithEmail')}
              </Button>
            )}
          </div>
        )}

        {/* Credentials Form */}
        {(showCredentialsForm || !hasOAuthProviders) && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t('identifier')}</Label>
              <Input
                id="identifier"
                type="text"
                placeholder={t('identifierPlaceholder')}
                disabled={isLoading}
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                disabled={isLoading}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('submitting') : t('submit')}
            </Button>

            {hasOAuthProviders && showCredentialsForm && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCredentialsForm(false)}
                className="w-full"
              >
                {t('backToOptions')}
              </Button>
            )}
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {config.auth.recovery.enabled && (
          <Button
            variant="link"
            className="text-sm"
            onClick={() => router.push(`/${locale}/auth/recovery`)}
          >
            {t('forgotPassword')}
          </Button>
        )}

        {config.auth.registration.allowSelfSignup && (
          <div className="text-sm text-center text-muted-foreground">
            {t('noAccount')}{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => router.push(`/${locale}/auth/register`)}
            >
              {t('register')}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
