/**
 * GET /api/payments/sandbox/checkout
 *
 * Página de checkout simulada para pruebas en sandbox.
 * Simula el flujo de una pasarela de pago real.
 */

import { NextRequest, NextResponse } from 'next/server'
import { findPlanBySlug } from '@/infrastructure/database/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planSlug = searchParams.get('plan')
  const period = searchParams.get('period')
  const userId = searchParams.get('userId')
  const locale = searchParams.get('locale') || 'en'

  if (!planSlug || !period || !userId) {
    return new NextResponse('Missing required parameters', { status: 400 })
  }

  // Obtener información del plan
  const plan = await findPlanBySlug(planSlug)

  if (!plan) {
    return new NextResponse('Plan not found', { status: 404 })
  }

  // Retornar HTML simulando checkout
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sandbox Checkout - ${plan.name}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .plan-info {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      margin: 10px 5px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
    }
    .success {
      background: #10b981;
      color: white;
    }
    .danger {
      background: #ef4444;
      color: white;
    }
    .secondary {
      background: #6b7280;
      color: white;
    }
    .button:hover {
      opacity: 0.9;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
      color: #92400e;
    }
    .buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧪 Sandbox Checkout</h1>

    <div class="warning">
      <strong>⚠️ Modo Sandbox</strong><br>
      Este es un entorno de pruebas. No se procesará ningún pago real.
    </div>

    <div class="plan-info">
      <h2>${plan.name}</h2>
      <p><strong>Período:</strong> ${period === 'monthly' ? 'Mensual' : 'Anual'}</p>
      <p><strong>Plan ID:</strong> ${plan.id}</p>
      <p><strong>User ID:</strong> ${userId}</p>
    </div>

    <p>Simula el resultado del pago haciendo clic en uno de los botones:</p>

    <div class="buttons">
      <button class="button success" onclick="processPayment('success')">
        ✅ Simular Pago Exitoso
      </button>
      <button class="button danger" onclick="processPayment('failure')">
        ❌ Simular Fallo de Pago
      </button>
      <a href="/subscription/plans" class="button secondary">
        ← Cancelar
      </a>
    </div>

    <div id="result" style="margin-top: 20px;"></div>
  </div>

  <script>
    async function processPayment(result) {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<p>Procesando...</p>';

      try {
        const response = await fetch('/api/webhooks/sandbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: result === 'success' ? 'payment.succeeded' : 'payment.failed',
            userId: '${userId}',
            planSlug: '${planSlug}',
            period: '${period}',
            platform: 'web',
            amount: ${period === 'monthly' ? '4.99' : '49.00'},
            currency: 'USD',
          }),
        });

        const data = await response.json();

        if (response.ok) {
          resultDiv.innerHTML = \`
            <div style="background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 4px;">
              <strong>✅ Pago procesado exitosamente</strong><br>
              Redirigiendo al dashboard...
            </div>
          \`;
          setTimeout(() => {
            window.location.href = '/${locale}/dashboard';
          }, 2000);
        } else {
          resultDiv.innerHTML = \`
            <div style="background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 4px;">
              <strong>❌ Error:</strong> \${data.error || 'Unknown error'}
            </div>
          \`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`
          <div style="background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 4px;">
            <strong>❌ Error de red:</strong> \${error.message}
          </div>
        \`;
      }
    }
  </script>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
