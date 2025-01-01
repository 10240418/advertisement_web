import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useFlowStore } from '@renderer/stores/flow_store'
import type { ScreenState } from '@renderer/stores/flow_store'

// 屏幕控制器配置接口
interface ScreenControllerOptions {
  idleTimeout: number      // 空闲超时时间
  displayDuration: number  // 显示持续时间
  noticeDuration: number  // 通知显示时间
  fullscreenTimeout: number // 全屏超时时间
}

export function useScreenController(options: ScreenControllerOptions) {
  const flowStore = useFlowStore()
  // 控制器初始化状态标志
  const isInitialized = ref(false)

  // === 初始化用户交互事件监听器 ===
  const initializeEventListeners = () => {
    console.log('[Screen] 初始化事件监听器')
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const handleActivity = () => {
      if (!isInitialized.value) {
        console.log('[Screen] 控制器未初始化，忽略用户活动')
        return
      }
      console.log('[Screen] 触发用户活动处理')
      flowStore.handleUserActivity()
    }

    events.forEach(event => {
      console.log('[Screen] 注册事件监听:', event)
      window.addEventListener(event, handleActivity)
    })

    return () => {
      console.log('[Screen] 清理事件监听器')
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }

  // === 监听屏幕状态变化 ===
  const watchRouteChanges = () => {
    watch(() => flowStore.currentScreenState, (newState: ScreenState) => {
      console.log(`Screen state changed to: ${newState}`)
    })
  }

  // === 初始化计时器配置 ===
  const initializeTimerConfig = () => {
    console.log('[Screen] 初始化计时器配置:', options)
    const { 
      idleTimeout,
      displayDuration,
      noticeDuration,
      fullscreenTimeout 
    } = options

    Object.assign(flowStore.timeoutConfig, {
      idle: idleTimeout,
      display: displayDuration,
      notice: noticeDuration,
      fullscreen: fullscreenTimeout
    })
    console.log('[Screen] 计时器配置已更新:', flowStore.timeoutConfig)
  }

  // === 组件生命周期钩子 ===
  onMounted(() => {
    console.log('[Screen] 组件挂载')
    initializeTimerConfig()
    const cleanup = initializeEventListeners()
    watchRouteChanges()
    
    console.log('[Screen] 启动空闲计时器')
    flowStore.startIdleTimer()
    isInitialized.value = true

    onUnmounted(() => {
      console.log('[Screen] 组件卸载')
      cleanup()
      flowStore.cleanup()
      isInitialized.value = false
    })
  })

  // === 返回控制器接口 ===
  return {
    currentState: computed(() => flowStore.currentScreenState),  // 当前屏幕状态
    isFullscreen: computed(() => flowStore.isFullscreen),       // 是否全屏
    isError: computed(() => flowStore.isError),                 // 是否有错误
    errorMessage: computed(() => flowStore.errorMessage)        // 错误信息
  }
} 