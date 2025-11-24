import { appConfig } from '@/config/app.config'
import { generateInvitationLink } from '@/infrastructure/utils/invitation.utils'

const MAILERSEND_API_URL = 'https://api.mailersend.com/v1/email'

type Recipient = {
  email: string
  name?: string | null
}

type TransactionalEmailPayload = {
  to: Recipient
  subject: string
  html: string
  text: string
  tags?: string[]
}

type EmailResult = {
  success: boolean
  skipped?: boolean
}

const isMailerSendProvider = () =>
  appConfig.email.enabled &&
  appConfig.email.provider === 'mailersend' &&
  !!appConfig.email.mailersend.apiKey &&
  !!appConfig.email.mailersend.senderEmail

async function sendWithMailerSend(payload: TransactionalEmailPayload): Promise<EmailResult> {
  if (!isMailerSendProvider()) {
    console.warn('[Email] MailerSend no está configurado. Mensaje omitido.')
    return { success: false, skipped: true }
  }

  try {
    const response = await fetch(MAILERSEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appConfig.email.mailersend.apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: appConfig.email.mailersend.senderEmail,
          name: appConfig.email.mailersend.senderName,
        },
        to: [
          {
            email: payload.to.email,
            name: payload.to.name ?? undefined,
          },
        ],
        reply_to: appConfig.email.mailersend.replyTo
          ? {
              email: appConfig.email.mailersend.replyTo,
            }
          : undefined,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        tags: payload.tags,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[MailerSend] Error al enviar email', {
        status: response.status,
        error: errorBody,
      })
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('[MailerSend] Error inesperado al enviar email', error)
    return { success: false }
  }
}

function buildCodeEmailTemplate(options: {
  title: string
  intro: string
  code: string
  footer?: string
}): { html: string; text: string } {
  const brand = appConfig.email.brandName
  const footer = options.footer || 'Si no solicitaste este código, ignora este mensaje.'

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background-color: #f7f7f9; padding: 24px;">
      <table style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px;">
        <tr>
          <td>
            <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 12px;">
              ${options.title}
            </h1>
            <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
              ${options.intro}
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #111827; background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px;">
                ${options.code}
              </span>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              ${footer}
            </p>
            <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0;">
              ${brand}
            </p>
          </td>
        </tr>
      </table>
    </div>
  `

  const text = `${options.title}\n${options.intro}\n\nCódigo: ${options.code}\n\n${footer}\n\n${brand}`

  return { html, text }
}

function buildInvitationEmailTemplate(options: {
  inviterName: string
  sobreNombre: string
  inviteLink: string
  inviteCode?: string | null
  participantExists: boolean
}): { html: string; text: string } {
  const brand = appConfig.email.brandName
  const intro = `${options.inviterName} te ha invitado a colaborar en el sobre “${options.sobreNombre}”.`
  const sharedInfo =
    'En este sobre compartido podrán gestionar el presupuesto juntos, mantener todo organizado y trabajar de forma simple y en equipo.'
  const personalSobres =
    'Además, podrás gestionar tus propios presupuestos utilizando tus sobres personales dentro de la plataforma.'
  const registerLine = '👉 Regístrate para aceptar la invitación.'
  const loginLine = 'Si ya tienes cuenta, simplemente inicia sesión en la app y podrás acceder al sobre.'
  const closing = `A ${options.inviterName} le encantará que te unas.\n\nEl equipo de Famapp.`
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background-color: #f7f7f9; padding: 24px;">
      <table style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px;">
        <tr>
          <td>
            <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 12px;">
              Invitación a un sobre compartido
            </h1>
            <p style="font-size: 15px; color: #111827; font-weight: 600; margin: 0 0 12px;">
              ${intro}
            </p>
            <p style="font-size: 15px; color: #374151; margin: 0 0 12px;">
              ${sharedInfo}
            </p>
            <p style="font-size: 15px; color: #4b5563; margin: 0 0 20px;">
              ${personalSobres}
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${options.inviteLink}"
                style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Aceptar invitación
              </a>
            </div>
            <p style="font-size: 15px; color: #111827; font-weight: 600; margin: 0 0 12px;">
              ${registerLine}
            </p>
            <p style="font-size: 15px; color: #374151; margin: 0 0 12px;">
              ${loginLine}
            </p>
            ${
              options.inviteCode
                ? `<p style="font-size: 15px; color: #111827; margin: 0 0 12px;">
                    <strong>Código de invitación:</strong> ${options.inviteCode}
                  </p>`
                : ''
            }
            <p style="font-size: 15px; color: #111827; margin: 24px 0 0; white-space: pre-line;">
              ${closing}
            </p>
            <p style="font-size: 13px; color: #9ca3af; margin: 12px 0 0;">
              ${brand}
            </p>
          </td>
        </tr>
      </table>
    </div>
  `

  const textLines = [
    'Invitación a un sobre compartido',
    intro,
    sharedInfo,
    personalSobres,
    `Aceptar invitación: ${options.inviteLink}`,
    registerLine,
    loginLine,
  ]

  if (options.inviteCode) {
    textLines.push(`Código de invitación: ${options.inviteCode}`)
  }

  textLines.push('', closing, brand)

  return {
    html,
    text: textLines.join('\n\n'),
  }
}

function buildTestEmailTemplate(options: {
  message: string
  userEmail: string
  userName?: string | null
}): { html: string; text: string } {
  const brand = appConfig.email.brandName
  const intro = `Este es un correo de prueba para verificar MailerSend en ${brand}.`
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background-color: #f7f7f9; padding: 24px;">
      <table style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px;">
        <tr>
          <td>
            <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 12px;">
              Prueba de email
            </h1>
            <p style="font-size: 15px; color: #374151; margin: 0 0 12px;">
              ${intro}
            </p>
            <div style="padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
              <p style="font-size: 14px; white-space: pre-line; color: #1f2937; margin: 0;">
                ${options.message}
              </p>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin: 0;">
              Enviado a: ${options.userEmail}${options.userName ? ` (${options.userName})` : ''}
            </p>
            <p style="font-size: 13px; color: #9ca3af; margin: 16px 0 0;">
              ${brand}
            </p>
          </td>
        </tr>
      </table>
    </div>
  `

  const text = [
    'Prueba de email',
    intro,
    '',
    options.message,
    '',
    `Enviado a: ${options.userEmail}${options.userName ? ` (${options.userName})` : ''}`,
    brand,
  ].join('\n')

  return { html, text }
}

export async function sendVerificationEmail(params: {
  email: string
  name?: string | null
  code: string
}): Promise<EmailResult> {
  const template = buildCodeEmailTemplate({
    title: appConfig.email.templates.verification.subject,
    intro: 'Ingresa este código en la app para confirmar tu cuenta.',
    code: params.code,
  })

  return sendWithMailerSend({
    to: { email: params.email, name: params.name },
    subject: appConfig.email.templates.verification.subject,
    html: template.html,
    text: template.text,
    tags: ['account-verification'],
  })
}

export async function sendRecoveryEmail(params: {
  email: string
  name?: string | null
  code: string
}): Promise<EmailResult> {
  const template = buildCodeEmailTemplate({
    title: appConfig.email.templates.recovery.subject,
    intro: 'Usa este código para restablecer tu contraseña.',
    code: params.code,
    footer: 'Si no solicitaste recuperar tu contraseña, ignora este email.',
  })

  return sendWithMailerSend({
    to: { email: params.email, name: params.name },
    subject: appConfig.email.templates.recovery.subject,
    html: template.html,
    text: template.text,
    tags: ['password-recovery'],
  })
}

export async function sendInvitationEmail(params: {
  email: string
  inviteCode?: string | null
  inviteLink?: string
  inviterName: string
  sobreNombre: string
  participantExists: boolean
}): Promise<EmailResult> {
  const link =
    params.inviteLink ||
    (params.inviteCode
      ? generateInvitationLink(params.inviteCode, appConfig.api.baseUrl)
      : `${appConfig.api.baseUrl}/invitations`)

  const template = buildInvitationEmailTemplate({
    inviterName: params.inviterName,
    sobreNombre: params.sobreNombre,
    inviteLink: link,
    inviteCode: params.inviteCode,
    participantExists: params.participantExists,
  })

  return sendWithMailerSend({
    to: { email: params.email },
    subject: appConfig.email.templates.invitation.subject,
    html: template.html,
    text: template.text,
    tags: ['sobre-invitations'],
  })
}

export async function sendTestEmail(params: {
  email: string
  name?: string | null
  message: string
}): Promise<EmailResult> {
  if (!appConfig.email.enabled) {
    return { success: false, skipped: true }
  }

  const template = buildTestEmailTemplate({
    message: params.message,
    userEmail: params.email,
    userName: params.name,
  })

  return sendWithMailerSend({
    to: { email: params.email, name: params.name },
    subject: `Test MailerSend - ${appConfig.email.brandName}`,
    html: template.html,
    text: template.text,
    tags: ['email-test'],
  })
}
