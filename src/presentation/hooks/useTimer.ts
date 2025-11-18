/**
 * useTimer Hook
 *
 * Manages a persistent timer for shopping executions
 * The timer continues running even if the user closes the app
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { ExecutionStorage } from '@/infrastructure/utils/execution-storage'

export interface UseTimerReturn {
  elapsedSeconds: number
  formattedTime: string
  isRunning: boolean
  pause: () => Promise<void>
  resume: () => Promise<void>
  toggle: () => Promise<void>
}

export function useTimer(localExecutionId: string | null): UseTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update elapsed time every second
  const updateTime = useCallback(async () => {
    if (!localExecutionId) return

    try {
      const elapsed = await ExecutionStorage.getElapsedTime(localExecutionId)
      setElapsedSeconds(elapsed)
    } catch (error) {
      console.error('Failed to get elapsed time:', error)
    }
  }, [localExecutionId])

  // Initialize timer
  useEffect(() => {
    if (!localExecutionId) return

    const init = async () => {
      try {
        const execution = await ExecutionStorage.getById(localExecutionId)
        if (execution) {
          setIsRunning(execution.timer.isRunning)
          await updateTime()
        }
      } catch (error) {
        console.error('Failed to initialize timer:', error)
      }
    }

    init()
  }, [localExecutionId, updateTime])

  // Start interval when running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(updateTime, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, updateTime])

  const pause = useCallback(async () => {
    if (!localExecutionId) return

    try {
      await ExecutionStorage.pauseTimer(localExecutionId)
      setIsRunning(false)
      await updateTime()
    } catch (error) {
      console.error('Failed to pause timer:', error)
    }
  }, [localExecutionId, updateTime])

  const resume = useCallback(async () => {
    if (!localExecutionId) return

    try {
      await ExecutionStorage.resumeTimer(localExecutionId)
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to resume timer:', error)
    }
  }, [localExecutionId])

  const toggle = useCallback(async () => {
    if (isRunning) {
      await pause()
    } else {
      await resume()
    }
  }, [isRunning, pause, resume])

  // Format time as HH:MM:SS
  const formattedTime = formatTime(elapsedSeconds)

  return {
    elapsedSeconds,
    formattedTime,
    isRunning,
    pause,
    resume,
    toggle,
  }
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (num: number) => num.toString().padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }

  return `${pad(minutes)}:${pad(seconds)}`
}
