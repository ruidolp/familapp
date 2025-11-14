/**
 * Hook para auto-scroll a input cuando se enfoca en mobile
 * Previene que el input quede oculto bajo el teclado virtual
 */

import { useEffect } from 'react'

/**
 * @param inputRef - Ref del input a observar
 * @param delay - Delay en ms antes de hacer scroll (para esperar a que el teclado aparezca)
 */
export function useInputFocus(
  inputRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  delay: number = 300
) {
  useEffect(() => {
    if (!inputRef.current) return

    const element = inputRef.current

    const handleFocus = () => {
      // Usar setTimeout para esperar a que el teclado aparezca
      setTimeout(() => {
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }, delay)
    }

    element.addEventListener('focus', handleFocus)
    return () => {
      element.removeEventListener('focus', handleFocus)
    }
  }, [inputRef, delay])
}
