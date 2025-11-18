'use client'

/**
 * CalculatorDrawer Component
 *
 * Simple calculator for quick math during shopping
 * Allows copying result to clipboard
 */

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/presentation/components/ui/sheet'
import { Button } from '@/presentation/components/ui/button'
import { useToast } from '@/presentation/hooks/use-toast'
import { Calculator, Copy, Delete } from 'lucide-react'

interface CalculatorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalculatorDrawer({ open, onOpenChange }: CalculatorDrawerProps) {
  const { toast } = useToast()
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(currentValue)
    } else if (operation) {
      const result = performOperation(previousValue, currentValue, operation)
      setDisplay(String(result))
      setPreviousValue(result)
    }

    setOperation(op)
    setWaitingForOperand(true)
  }

  const performOperation = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b
      case '-':
        return a - b
      case '×':
        return a * b
      case '÷':
        return b !== 0 ? a / b : 0
      default:
        return b
    }
  }

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const currentValue = parseFloat(display)
      const result = performOperation(previousValue, currentValue, operation)
      setDisplay(String(result))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay('0')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(display)
      toast({
        title: 'Copiado',
        description: `${display} copiado al portapapeles`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar al portapapeles',
        variant: 'destructive',
      })
    }
  }

  const buttons = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[600px] sm:max-w-[425px] sm:mx-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Display */}
          <div className="relative">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-right">
              <div className="text-3xl font-bold overflow-x-auto whitespace-nowrap">
                {display}
              </div>
              {operation && (
                <div className="text-sm text-muted-foreground mt-1">
                  {previousValue} {operation}
                </div>
              )}
            </div>

            {/* Copy Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              className="text-lg font-semibold"
            >
              C (Borrar)
            </Button>
            <Button
              variant="outline"
              onClick={handleBackspace}
              className="text-lg font-semibold"
            >
              <Delete className="h-5 w-5" />
            </Button>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-4 gap-2">
            {buttons.map((row, i) => (
              <div key={i} className="col-span-4 grid grid-cols-4 gap-2">
                {row.map(btn => {
                  const isOperation = ['÷', '×', '-', '+', '='].includes(btn)
                  const isZero = btn === '0'

                  return (
                    <Button
                      key={btn}
                      variant={isOperation ? 'default' : 'outline'}
                      className={`text-2xl font-semibold h-16 ${
                        isZero ? 'col-span-1' : ''
                      }`}
                      onClick={() => {
                        if (btn === '=') {
                          handleEquals()
                        } else if (isOperation) {
                          handleOperation(btn)
                        } else if (btn === '.') {
                          handleDecimal()
                        } else {
                          handleNumber(btn)
                        }
                      }}
                    >
                      {btn}
                    </Button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Copy Result Button */}
          <Button
            onClick={() => {
              handleCopy()
              onOpenChange(false)
            }}
            className="w-full text-lg font-semibold h-14"
          >
            <Copy className="h-5 w-5 mr-2" />
            Copiar y Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
