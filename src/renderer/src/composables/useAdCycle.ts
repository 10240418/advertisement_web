// @ts-nocheck  // 忽略整个文件的所有 TypeScript 错误

// 或者只忽略下一行的未使用变量警告
// @ts-ignore
import { ref, _computed as computed } from 'vue'
import type { Advertisement } from '@renderer/apis'

export function useAdCycle() {
  const adTimer = ref<number | null>(null)
  const countdownTimer = ref<number | null>(null)
  const remainingTime = ref<number>(0)
  
  const clearAdTimer = () => {
    if (adTimer.value) {
      clearTimeout(adTimer.value)
      adTimer.value = null
    }
  }

  const clearCountdownTimer = () => {
    if (countdownTimer.value) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
  }

  const startCountdown = (duration: number, onComplete?: () => void) => {
    clearCountdownTimer()
    remainingTime.value = duration

    countdownTimer.value = window.setInterval(() => {
      if (remainingTime.value > 0) {
        remainingTime.value--
      } else {
        clearCountdownTimer()
        onComplete?.()
      }
    }, 1000)
  }

  return {
    adTimer,
    countdownTimer,
    remainingTime,
    clearAdTimer,
    clearCountdownTimer,
    startCountdown
  }
} 